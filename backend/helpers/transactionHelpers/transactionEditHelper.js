import { generatePeriodKey, getMonthYear } from "../../../shared/utils/date.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";
import { formatYearMonth } from "../../jobs/tasks/utils/dateHelpers.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";
import AccountLedger from "../../model/AccountLedgerModel.js";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import { determineTransactionBehavior } from "./modelFindHelper.js";

/**
 * Update original transaction document with new data
 * Based on actual Sale transaction schema
 */
export const updateOriginalTransactionRecord = async (
  originalTransaction,
  updatedData,
  userId,
  session
) => {
  // ========================================
  // Update all editable fields
  // ========================================
  const fieldsToUpdate = [
    // Account/Party details
    "account",
    "accountName",
    "accountType",
    "email",
    "phone",
    "openingBalance",

    // Price level
    "priceLevel",
    "priceLevelName",

    // Items array
    "items",

    // Amounts
    "subtotal",
    "totalTaxAmount",
    "totalAmountAfterTax",
    "discount",
    "discountAmount",
    "netAmount",
    "totalDue",
    "paidAmount",
    "balanceAmount",

    // Payment details
    "paymentMethod",
    "paymentStatus",

    // Transaction details
    "transactionDate",
    "status",
    "reference",
    "notes",
  ];

  fieldsToUpdate.forEach((field) => {
    if (updatedData[field] !== undefined) {
      originalTransaction[field] = updatedData[field];
    }
  });

  // ========================================
  // Update metadata (audit fields)
  // ========================================
  originalTransaction.lastUpdatedBy = userId;
  originalTransaction.lastUpdatedAt = new Date();
  originalTransaction.editCount = (originalTransaction.editCount || 0) + 1;
  originalTransaction.lastEditReason = "Transaction edited";

  // Save with session
  await originalTransaction.save({ session });

  return originalTransaction;
};

/**
 * Mark monthly balances as needing recalculation + CREATE missing records
 * Handles: item rename/add/remove + account changes + ensures ItemLedger/AccountLedger exists
 * Recalculation will be done in nightly job.
 */
export const markMonthlyBalancesForRecalculation = async (
  original,
  updated,
  session
) => {
  const { company, branch } = updated;
  const { year, month } = getMonthYear(updated.transactionDate);
  const periodKey = generatePeriodKey(updated.transactionDate);

  console.log(`🔄 Processing items/accounts for ${year}-${month}...`);

  // ========================================
  // 1. Account Monthly Balances (MAIN ACCOUNT)
  // ========================================
  await AccountMonthlyBalance.updateMany(
    {
      account: original.account,
      $or: [{ year: { $gt: year } }, { year: year, month: { $gte: month } }],
    },
    {
      $set: {
        needsRecalculation: true,
        lastUpdated: new Date(),
      },
    }
  ).session(session);

  if (
    updated.account &&
    updated.account.toString() !== original.account.toString()
  ) {
    await AccountMonthlyBalance.updateMany(
      {
        account: updated.account,
        $or: [{ year: { $gt: year } }, { year: year, month: { $gte: month } }],
      },
      {
        $set: {
          needsRecalculation: true,
          lastUpdated: new Date(),
        },
      }
    ).session(session);
  }

  // ========================================
  // 2. SMART DETECTION: ONLY CHANGED ITEMS
  // ========================================
  const changedItemIds = detectActualItemChanges(original.items, updated.items);
  console.log(`🔍 Detected ${changedItemIds.size} CHANGED items only`);

  if (changedItemIds.size === 0) {
    console.log(`✨ No item changes detected - skipping item recalculation`);
  } else {
    // For EACH CHANGED item only: CREATE monthly balance if missing + mark dirty
    for (const itemId of changedItemIds) {
      await ensureItemMonthlyBalanceExistsAndMarkDirty(
        company,
        branch,
        itemId,
        year,
        month,
        session,
        updated
      );
    }

    // Mark subsequent months ONLY for CHANGED items (cascade)
    await markSubsequentMonthsDirty(
      Array.from(changedItemIds), // ✅ ONLY changed items
      branch,
      year,
      month,
      session
    );
  }

  // ========================================
  // 3. SMART DETECTION: ONLY CHANGED ACCOUNTS
  // ========================================
  const changedAccountIds = detectActualAccountChanges(original, updated);
  console.log(`💰 Detected ${changedAccountIds.size} CHANGED accounts only`);

  if (changedAccountIds.size === 0) {
    console.log(`✨ No account changes detected - skipping account recalculation`);
  } else {
    // For EACH CHANGED account only: CREATE monthly balance if missing + mark dirty
    for (const accountId of changedAccountIds) {
      await ensureAccountMonthlyBalanceExistsAndMarkDirty(
        company,
        branch,
        accountId,
        updated.accountName,
        year,
        month,
        session,
        updated
      );
    }

    // Mark subsequent months ONLY for CHANGED accounts (cascade)
    await markSubsequentAccountMonthsDirty(
      Array.from(changedAccountIds),
      branch,
      year,
      month,
      session
    );
  }

  console.log(
    `✅ Processed ${changedItemIds.size} items + ${changedAccountIds.size} accounts from ${year}-${month} onwards`
  );

  return {
    success: true,
    year,
    month,
    itemsProcessed: changedItemIds.size,
    accountsProcessed: changedAccountIds.size,
    changedItems: Array.from(changedItemIds),
    changedAccounts: Array.from(changedAccountIds),
    message: `Marked ${changedItemIds.size} items + ${changedAccountIds.size} accounts for recalculation`,
  };
};

/**
 * CREATE ItemMonthlyBalance if missing + mark dirty
 */
const ensureItemMonthlyBalanceExistsAndMarkDirty = async (
  companyId,
  branchId,
  itemId,
  year,
  month,
  session,
  transactionData
) => {
  const monthKey = formatYearMonth(year, month);

  // 1. CHECK if monthly balance exists
  let monthlyBalance = await ItemMonthlyBalance.findOne({
    company: companyId,
    branch: branchId,
    item: itemId,
    year,
    month,
  }).session(session);

  if (!monthlyBalance) {
    console.log(`📦 Creating NEW monthly balance: Item ${itemId}, ${monthKey}`);

    // Get item details from ItemMaster or transaction
    const itemMaster = await ItemMasterModel.findById(itemId)
      .select("itemName itemCode")
      .lean();

    const transactionItem = transactionData.items?.find(
      (item) => item.item.toString() === itemId
    );

    monthlyBalance = new ItemMonthlyBalance({
      company: companyId,
      branch: branchId,
      item: itemId,
      itemName:
        itemMaster?.itemName || transactionItem?.itemName || "Unknown Item",
      itemCode: itemMaster?.itemCode || transactionItem?.itemCode || "UNK",
      year,
      month,
      periodKey: monthKey,
      openingStock: 0,
      closingStock: 0,
      totalStockIn: 0,
      totalStockOut: 0,
      transactionCount: 1, // First transaction
      needsRecalculation: true, // 🚨 Always mark new records dirty
      lastUpdated: new Date(),
    });
    await monthlyBalance.save({ session });
    console.log(`✅ Created item monthly balance for ${monthKey}`);
  } else if (!monthlyBalance.needsRecalculation) {
    // Exists but clean → mark dirty
    await ItemMonthlyBalance.updateOne(
      { _id: monthlyBalance._id },
      {
        needsRecalculation: true,
        lastUpdated: new Date(),
      },
      { session }
    );
    console.log(`🔄 Marked existing item ${monthKey} as dirty`);
  }

  // 2. Ensure ItemLedger exists for this transaction+item
  await ensureItemLedgerEntryExists(
    companyId,
    branchId,
    itemId,
    transactionData,
    session
  );
};

/**
 * CREATE AccountMonthlyBalance if missing + mark dirty
 */
const ensureAccountMonthlyBalanceExistsAndMarkDirty = async (
  companyId,
  branchId,
  accountId,
  accountName,
  year,
  month,
  session,
  transactionData
) => {
  console.log("Processing account:", accountId);

  const monthKey = formatYearMonth(year, month);

  // 1. CHECK if monthly balance exists
  let monthlyBalance = await AccountMonthlyBalance.findOne({
    company: companyId,
    branch: branchId,
    account: accountId,
    year,
    month,
  }).session(session);

  if (!monthlyBalance) {
    console.log(`💰 Creating NEW account monthly balance: Account ${accountId}, ${monthKey}`);

    // Get account details from AccountMaster or transaction
    const accountMaster = await AccountMasterModel.findById(accountId)
      .select("accountName")
      .lean();

    monthlyBalance = new AccountMonthlyBalance({
      company: companyId,
      branch: branchId,
      account: accountId,
      accountName: accountMaster?.accountName || "Unknown Account",
      year,
      month,
      periodKey: monthKey,
      openingBalance: 0,
      totalDebit: 0,
      totalCredit: 0,
      closingBalance: 0,
      transactionCount: 1,
      needsRecalculation: true, // 🚨 Always mark new records dirty
      lastUpdated: new Date(),
    });
    await monthlyBalance.save({ session });
    console.log(`✅ Created account monthly balance for ${monthKey}`);
  } else if (!monthlyBalance.needsRecalculation) {
    // Exists but clean → mark dirty
    await AccountMonthlyBalance.updateOne(
      { _id: monthlyBalance._id },
      {
        needsRecalculation: true,
        lastUpdated: new Date(),
      },
      { session }
    );
    console.log(`🔄 Marked existing account ${monthKey} as dirty`);
  }

  // 2. Ensure AccountLedger exists for this transaction+account
  await ensureAccountLedgerEntryExists(
    companyId,
    branchId,
    accountId,
    accountName,
    transactionData,
    session
  );
};

/**
 * Create ItemLedger entry if missing for this transaction
 */
const ensureItemLedgerEntryExists = async (
  companyId,
  branchId,
  itemId,
  transactionData,
  session
) => {
  const {
    _id: transactionId,
    transactionNumber,
    transactionDate,
    items = [],
  } = transactionData;

  // Find this item in transaction items
  const transactionItem = items.find((item) => item.item.toString() === itemId);
  if (!transactionItem) return; // Item not in this transaction

  // Check if ItemLedger already exists
  const existingLedger = await ItemLedger.findOne({
    company: companyId,
    branch: branchId,
    item: itemId,
    transactionId,
  }).session(session);

  if (!existingLedger) {
    console.log(
      `📝 Creating ItemLedger: Item ${itemId}, Tx ${transactionNumber}`
    );

    const newLedger = new ItemLedger({
      company: companyId,
      branch: branchId,
      item: itemId,
      itemName: transactionItem.itemName || "Unknown",
      itemCode: transactionItem.itemCode || "UNK",
      unit: transactionItem.unit || "kg",
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType: transactionData.transactionType,
      movementType: transactionItem.movementType || "out",
      quantity: 0,
      rate: 0,
      baseAmount: 0,
      amountAfterTax: 0,
      taxRate: 0,
      taxAmount: 0, // Nightly job will recalculate
      runningStockBalance: 0, // Nightly job will calculate
      createdBy: transactionData.createdBy || "system",
    });
    await newLedger.save({ session });
    console.log(`✅ Created ItemLedger for Tx ${transactionNumber}`);
  }
};

/**
 * Create AccountLedger entry if missing for this transaction
 */
const ensureAccountLedgerEntryExists = async (
  companyId,
  branchId,
  accountId,
  accountName,
  transactionData,
  session
) => {
  const { _id: transactionId, transactionNumber, transactionDate } = transactionData;

  // Check if AccountLedger already exists
  const existingLedger = await AccountLedger.findOne({
    company: companyId,
    branch: branchId,
    account: accountId,
    transactionId,
  }).session(session);

  if (!existingLedger) {
    console.log(`📝 Creating AccountLedger: Account ${accountId}, Tx ${transactionNumber}`);

    // Use placeholder values - nightly job will recalculate
    const newLedger = new AccountLedger({
      company: companyId,
      branch: branchId,
      account: accountId,
      accountName: accountName, // Will be updated by nightly job
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType: transactionData.transactionType,
      ledgerSide: determineTransactionBehavior(transactionData.transactionType).ledgerSide, // Placeholder
      amount: 0, // Placeholder
      runningBalance: 0, // Nightly job will calculate
      createdBy: transactionData.createdBy || "system",
    });
    await newLedger.save({ session });
    console.log(`✅ Created AccountLedger for Tx ${transactionNumber}`);
  }
};

/**
 * Mark all subsequent months dirty for affected items (cascade effect)
 */
const markSubsequentMonthsDirty = async (
  itemIds,
  branchId,
  year,
  month,
  session
) => {
  for (const itemId of itemIds) {
    await ItemMonthlyBalance.updateMany(
      {
        item: itemId,
        branch: branchId,
        $or: [{ year: { $gt: year } }, { year: year, month: { $gte: month } }],
      },
      {
        $set: {
          needsRecalculation: true,
          lastUpdated: new Date(),
        },
      },
      { session }
    );
  }
};

/**
 * Mark all subsequent months dirty for affected accounts (cascade effect)
 */
const markSubsequentAccountMonthsDirty = async (
  accountIds,
  branchId,
  year,
  month,
  session
) => {
  for (const accountId of accountIds) {
    await AccountMonthlyBalance.updateMany(
      {
        account: accountId,
        branch: branchId,
        $or: [{ year: { $gt: year } }, { year: year, month: { $gte: month } }],
      },
      {
        $set: {
          needsRecalculation: true,
          lastUpdated: new Date(),
        },
      },
      { session }
    );
  }
};

/**
 * Detect ACTUAL item changes (add/remove/modify)
 */
const detectActualItemChanges = (originalItems, updatedItems) => {
  const changedItemIds = new Set();
  const originalMap = new Map();
  const updatedMap = new Map();

  // Build comparison maps
  originalItems?.forEach((item) => {
    originalMap.set(item.item.toString(), {
      quantity: item.quantity,
      rate: item.rate,
      itemName: item.itemName,
    });
  });

  updatedItems?.forEach((item) => {
    updatedMap.set(item.item.toString(), {
      quantity: item.quantity,
      rate: item.rate,
      itemName: item.itemName,
    });
  });

  // 1. REMOVED items (original has, updated doesn't)
  for (const [itemId] of originalMap) {
    if (!updatedMap.has(itemId)) {
      changedItemIds.add(itemId);
      console.log(`   🗑️  Item REMOVED: ${itemId}`);
    }
  }

  // 2. CHANGED items (exists in both, data different)
  for (const [itemId, origData] of originalMap) {
    const updatedData = updatedMap.get(itemId);
    if (
      updatedData &&
      (origData.quantity !== updatedData.quantity ||
        origData.rate !== updatedData.rate ||
        origData.itemName !== updatedData.itemName)
    ) {
      changedItemIds.add(itemId);
      console.log(
        `   ✏️  Item CHANGED: ${itemId} (qty:${origData.quantity}→${updatedData.quantity})`
      );
    }
  }

  // 3. ADDED items (updated has, original doesn't)
  for (const [itemId] of updatedMap) {
    if (!originalMap.has(itemId)) {
      changedItemIds.add(itemId);
      console.log(`   ➕ Item ADDED: ${itemId}`);
    }
  }

  return changedItemIds;
};

/**
 * Detect ACTUAL account changes (account, outstanding, cash/bank changes)
 */
const detectActualAccountChanges = (original, updated) => {
  const changedAccountIds = new Set();

  // 1. MAIN ACCOUNT changed
  if (original.account.toString() !== updated.account.toString()) {
    changedAccountIds.add(original.account.toString());
    changedAccountIds.add(updated.account.toString());
    console.log(`   💱 Main account CHANGED: ${original.account} → ${updated.account}`);
  }

  // 2. OUTSTANDING CUSTOMERS changed (if any)
  if (original.outstandingCustomers?.length !== updated.outstandingCustomers?.length) {
    (original.outstandingCustomers || []).forEach(cust => 
      changedAccountIds.add(cust.account.toString())
    );
    (updated.outstandingCustomers || []).forEach(cust => 
      changedAccountIds.add(cust.account.toString())
    );
    console.log(`   👥 Outstanding customers count changed`);
  }

  // 3. CASH/BANK changed
  if (original.cashBankAccount?.toString() !== updated.cashBankAccount?.toString()) {
    if (original.cashBankAccount) changedAccountIds.add(original.cashBankAccount.toString());
    if (updated.cashBankAccount) changedAccountIds.add(updated.cashBankAccount.toString());
    console.log(`   💳 Cash/Bank account CHANGED`);
  }

  return changedAccountIds;
};
