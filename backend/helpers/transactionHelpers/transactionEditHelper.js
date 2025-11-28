import { generatePeriodKey, getMonthYear } from "../../../shared/utils/date.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";
import { formatYearMonth } from "../../jobs/tasks/utils/dateHelpers.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";

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
 * Handles: item rename/add/remove + ensures ItemLedger exists
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

  console.log(`🔄 Processing items for ${year}-${month}...`);

  // ========================================
  // 1. Account Monthly Balances (UNCHANGED)
  // ========================================
  await AccountMonthlyBalance.updateMany(
    {
      account: original.account,
      $or: [{ year: { $gt: year } }, { year: year, month: { $gte: month } }],
    },
    {
      $set: {
        needsRecalculation: true,
        lastModified: new Date(),
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
          lastModified: new Date(),
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
    return {
      success: true,
      year,
      month,
      itemsProcessed: 0,
      message: "No item changes detected",
    };
  }

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

  console.log(
    `✅ Created/marked dirty ONLY ${changedItemIds.size} CHANGED items from ${year}-${month} onwards`
  );

  return {
    success: true,
    year,
    month,
    itemsProcessed: changedItemIds.size,
    changedItems: Array.from(changedItemIds),
    message: `ONLY ${changedItemIds.size} changed items marked for recalculation`,
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
  console.log("transactionData:", transactionData);

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
    console.log(`✅ Created monthly balance for ${monthKey}`);
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
    console.log(`🔄 Marked existing ${monthKey} as dirty`);
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
