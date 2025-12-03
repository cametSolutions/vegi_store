import mongoose from "mongoose";
import AccountMonthlyBalance from "../../../model/AccountMonthlyBalanceModel.js";
import AccountLedger from "../../../model/AccountLedgerModel.js";
import Adjustment from "../../../model/AdjustmentEntryModel.js";
import AccountMaster from "../../../model/masters/AccountMasterModel.js";
import {
  getPreviousMonth,
  getNextMonth,
  getMonthDateRange,
  formatYearMonth,
  sortMonthsChronologically,
} from "../utils/dateHelpers.js";

/**
 * Processes all accounts marked as "dirty" (needing recalculation) across all branches.
 * 
 * This is the main entry point for the account ledger recalculation system. It identifies
 * all account-branch combinations that have months flagged for recalculation, processes
 * each one sequentially, and returns a comprehensive summary of the operation.
 * 
 * @async
 * @returns {Promise<Object>} Summary object containing:
 *   - accountsProcessed {number} - Number of account-branch combinations successfully processed
 *   - monthsRefolded {number} - Total number of months recalculated across all accounts
 *   - errors {Array<Object>} - Array of error objects for failed accounts
 *   - success {boolean} - True if no errors occurred
 *   - processedAdjustmentIds {Array<string>} - Array of adjustment IDs that were processed
 * 
 * @example
 * const result = await processAllDirtyAccounts();
 * console.log(`Processed ${result.accountsProcessed} accounts`);
 * console.log(`Refolded ${result.monthsRefolded} months`);
 */
export const processAllDirtyAccounts = async () => {
  // throw new Error("Deprecated: Use nightlyRecalculation.js instead.");
  console.log("💰 Finding all dirty accounts...");

  const workMap = await findDirtyAccounts();
  const workKeys = Object.keys(workMap);

  console.log(
    `📊 Found ${workKeys.length} account-branch combinations with dirty months`
  );

  if (workKeys.length === 0) {
    console.log("✨ No dirty accounts found. Database is clean!");
    return {
      accountsProcessed: 0,
      monthsRefolded: 0,
      errors: [],
      processedAdjustmentIds: [],
    };
  }

  let accountsProcessed = 0;
  let monthsRefolded = 0;
  const errors = [];
  const processedAdjustmentIdsSet = new Set();

  for (const key of workKeys) {
    const { accountId, branchId, accountName, months } = workMap[key];

    try {
      console.log(`\n🔧 Processing: ${accountName} - Branch: ${branchId}`);
      console.log(
        `   Dirty months: ${months
          .map((m) => formatYearMonth(m.year, m.month))
          .join(", ")}`
      );

      // Pass the Set so it can accumulate adjustment IDs from each call
      const result = await processOneAccount(accountId, branchId, months, processedAdjustmentIdsSet);

      accountsProcessed++;
      monthsRefolded += result.monthsProcessed;

      console.log(`   ✅ Success: ${result.monthsProcessed} months refolded`);
    } catch (error) {
      console.error(
        `   ❌ Error processing ${accountName} (Branch: ${branchId}):`,
        error.message
      );
      errors.push({
        accountId,
        branchId,
        accountName,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 ACCOUNT LEDGER RECALCULATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Accounts processed successfully: ${accountsProcessed}`);
  console.log(`📅 Total months refolded: ${monthsRefolded}`);
  console.log(`❌ Errors encountered: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n⚠️  ERROR DETAILS:");
    errors.forEach((e) => {
      console.log(`   ${e.accountName} - Branch ${e.branchId}: ${e.error}`);
    });
  }

  return {
    accountsProcessed,
    monthsRefolded,
    errors,
    success: errors.length === 0,
    processedAdjustmentIds: Array.from(processedAdjustmentIdsSet),
  };
};

/**
 * Finds all accounts with months flagged for recalculation and organizes them by account-branch combination.
 * 
 * Queries the AccountMonthlyBalance collection for records with needsRecalculation=true and
 * groups them by account and branch. This creates a work map that can be efficiently processed
 * without redundant queries.
 * 
 * @async
 * @returns {Promise<Object>} Work map object where:
 *   - Key: String in format "accountId_branchId"
 *   - Value: Object containing:
 *     - accountId {string} - MongoDB ObjectId of the account
 *     - branchId {string} - MongoDB ObjectId of the branch
 *     - accountName {string} - Display name of the account
 *     - months {Array<Object>} - Array of {year, month} objects needing recalculation
 * 
 * @example
 * const workMap = await findDirtyAccounts();
 * // Returns: {
 * //   "507f1f77bcf86cd799439011_507f191e810c19729de860ea": {
 * //     accountId: "507f1f77bcf86cd799439011",
 * //     branchId: "507f191e810c19729de860ea",
 * //     accountName: "Cash Account",
 * //     months: [{year: 2025, month: 12}, {year: 2026, month: 1}]
 * //   }
 * // }
 */
export const findDirtyAccounts = async () => {
  const dirtyRecords = await AccountMonthlyBalance.find({
    needsRecalculation: true,
  })
    .select("account branch year month accountName")
    .lean();

  const workMap = {};

  dirtyRecords.forEach((record) => {
    const accountId = record.account.toString();
    const branchId = record.branch.toString();
    const key = `${accountId}_${branchId}`;

    if (!workMap[key]) {
      workMap[key] = {
        accountId,
        branchId,
        accountName: record.accountName,
        months: [],
      };
    }

    workMap[key].months.push({
      year: record.year,
      month: record.month,
    });
  });

  return workMap;
};

/**
 * Processes all dirty months for a single account-branch combination within a single transaction.
 * 
 * Handles the complete recalculation workflow for one account at a specific branch. Sorts the
 * dirty months chronologically and processes them sequentially to maintain proper balance carry-forward.
 * Uses a MongoDB session with transaction to ensure atomicity - either all months are successfully
 * recalculated or all changes are rolled back.
 * 
 * @async
 * @param {string|ObjectId} accountId - MongoDB ObjectId of the account to process
 * @param {string|ObjectId} branchId - MongoDB ObjectId of the branch
 * @param {Array<Object>} dirtyMonths - Array of month objects with {year, month} properties
 * @param {Set<string>} processedAdjustmentIdsSet - Set to accumulate adjustment IDs processed across all months
 * 
 * @returns {Promise<Object>} Result object containing:
 *   - monthsProcessed {number} - Count of months successfully recalculated
 * 
 * @throws {Error} If any month fails to process, rolls back entire transaction and throws error
 * 
 * @example
 * const adjustmentSet = new Set();
 * const result = await processOneAccount(
 *   "507f1f77bcf86cd799439011",
 *   "507f191e810c19729de860ea",
 *   [{year: 2025, month: 11}, {year: 2025, month: 12}],
 *   adjustmentSet
 * );
 * console.log(`Processed ${result.monthsProcessed} months`);
 */
export const processOneAccount = async (accountId, branchId, dirtyMonths, processedAdjustmentIdsSet) => {
  dirtyMonths.sort(sortMonthsChronologically);

  let monthsProcessed = 0;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const { year, month } of dirtyMonths) {
      const monthKey = formatYearMonth(year, month);
      console.log(`   🔄 Refolding ${monthKey}...`);

      try {
        // Pass the Set down to accumulate adjustment IDs found during refold
        const adjustmentsInMonth = await refoldAccountMonth(accountId, branchId, year, month, session);
        adjustmentsInMonth.forEach((id) => processedAdjustmentIdsSet.add(id));

        monthsProcessed++;
        console.log(`     ✓ ${monthKey} completed`);
      } catch (error) {
        console.error(`     ✗ ${monthKey} failed:`, error.message);
        throw new Error(`Failed at ${monthKey}: ${error.message}`);
      }
    }

    await session.commitTransaction();
    console.log(`   💾 All ${monthsProcessed} months committed successfully`);
  } catch (error) {
    await session.abortTransaction();
    console.error(`   🔄 Transaction rolled back:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }

  return { monthsProcessed };
};

/**
 * Recalculates ledger balances and monthly summary for a specific account-branch-month combination.
 * 
 * This is the core recalculation function that:
 * 1. Determines opening balance from previous month or  from AccountMaster
 * 2. Fetches all ledger entries for the month
 * 3. Fetches all adjustments affecting this account in this month
 * 4. Applies adjustments to ledger entries (amount changes, account changes)
 * 5. Recalculates running balances for all entries
 * 6. Updates ledger entries with corrected amounts and balances
 * 7. Updates AccountMonthlyBalance with opening, closing, totals
 * 8. Marks next month as dirty if it exists (cascade effect)
 * 
 * @async
 * @param {string|ObjectId} accountId - MongoDB ObjectId of the account
 * @param {string|ObjectId} branchId - MongoDB ObjectId of the branch
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @param {ClientSession} session - Mongoose session for transaction support
 * 
 * @returns {Promise<Array<string>>} Array of adjustment IDs that were processed for this month
 * 
 * @throws {Error} If database operations fail during update
 * 
 * @example
 * const session = await mongoose.startSession();
 * session.startTransaction();
 * try {
 *   const adjustmentIds = await refoldAccountMonth(
 *     "507f1f77bcf86cd799439011",
 *     "507f191e810c19729de860ea",
 *     2025,
 *     12,
 *     session
 *   );
 *   await session.commitTransaction();
 *   console.log(`Processed adjustments: ${adjustmentIds.join(', ')}`);
 * } catch (err) {
 *   await session.abortTransaction();
 * }
 */
export const refoldAccountMonth = async (accountId, branchId, year, month, session) => {
  const monthKey = formatYearMonth(year, month);
  const currentAccountIdStr = accountId.toString();

  const prevMonth = getPreviousMonth(year, month);
  const prevMonthRecord = await AccountMonthlyBalance.findOne({
    account: accountId,
    branch: branchId,
    year: prevMonth.year,
    month: prevMonth.month,
  })
    .select("closingBalance")
    .session(session)
    .lean();

  let openingBalance = 0;

  if (prevMonthRecord) {
    openingBalance = prevMonthRecord.closingBalance;
    console.log(`     📊 Opening from previous month: ${openingBalance}`);
  } else {
    console.log(`     ℹ️  No previous month, checking AccountMaster...`);

    try {
      const accountMaster = await AccountMaster.findOne({
        _id: accountId,
        branches: branchId,
      })
        .select("accountName openingBalance")
        .lean();

      if (accountMaster?.openingBalance !== undefined) {
        openingBalance = accountMaster.openingBalance;
        console.log(
          `     💰 Opening from AccountMaster (${accountMaster.accountName}): ${openingBalance}`
        );
      } else {
        console.log(`     ⚠️  No opening balance in AccountMaster, using 0`);
      }
    } catch (error) {
      console.error(`     ❌ Error fetching AccountMaster:`, error.message);
      console.log(`     ℹ️  Defaulting to 0 as opening balance`);
    }
  }

  console.log(`     ✅ Final opening balance: ${openingBalance}`);

  const { startDate, endDate } = getMonthDateRange(year, month);

  const ledgerEntries = await AccountLedger.find({
    account: accountId,
    branch: branchId,
    transactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
  })
    .sort({ transactionDate: 1, createdAt: 1 })
    .lean();

  console.log(`     📝 Found ${ledgerEntries.length} ledger entries`);

  const adjustments = await Adjustment.find({
    $or: [
      { oldAccount: accountId }, // Adjustments FROM this account
      { affectedAccount: accountId }, // Adjustments TO this account
    ],
    branch: branchId,
    originalTransactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: "active",
    isReversed: false,
  }).lean();

  console.log(`🔧 Found ${adjustments.length} adjustments`);

  // Gather processed adjustment IDs here to return upstream
  const processedAdjustmentIds = adjustments.map((adj) => adj._id.toString());

  const adjustmentMap = buildAccountAdjustmentDeltaMap(
    adjustments,
    currentAccountIdStr
  );

  if (
    Object.keys(adjustmentMap.amountDeltaMap).length > 0 ||
    adjustmentMap.accountChanges.size > 0
  ) {
    console.log(
      ` 📊 Adjustments affect ${
        Object.keys(adjustmentMap.amountDeltaMap).length +
        adjustmentMap.accountChanges.size
      } transactions`
    );
  }

  // Recalculate running balances (your existing logic here) ...
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  const ledgerUpdates = [];

  for (const entry of ledgerEntries) {
    const txId = entry.transactionId.toString();

    let effectiveAmount = entry.amount;
    let effectiveAccount = entry.account;
    let effectiveAccountName = entry.accountName;

    if (adjustmentMap.accountChanges.has(txId)) {
      effectiveAmount = 0;
      console.log(
        `🔧 Tx ${entry.transactionNumber}: OLD ACCOUNT → SET TO 0 (removed)`
      );
    } else {
      if (adjustmentMap.amountDeltaMap[txId]) {
        effectiveAmount += adjustmentMap.amountDeltaMap[txId];
        console.log(
          `🔧 Tx ${entry.transactionNumber}: amount ${entry.amount} + delta ${adjustmentMap.amountDeltaMap[txId]} = ${effectiveAmount}`
        );
      }

      if (adjustmentMap.accountMap[txId]) {
        effectiveAccount = adjustmentMap.accountMap[txId];
        console.log(
          `🔧 Tx ${entry.transactionNumber}: account changed to ${effectiveAccount}`
        );
      }

      if (adjustmentMap.accountNameMap[txId]) {
        effectiveAccountName = adjustmentMap.accountNameMap[txId];
        console.log(
          `🔧 Tx ${entry.transactionNumber}: account name changed to ${effectiveAccountName}`
        );
      }
    }

    if (entry.ledgerSide === "debit") {
      totalDebit += effectiveAmount;
      runningBalance += effectiveAmount;
    } else if (entry.ledgerSide === "credit") {
      totalCredit += effectiveAmount;
      runningBalance -= effectiveAmount;
    }

    ledgerUpdates.push({
      _id: entry._id,
      amount: effectiveAmount,
      runningBalance: runningBalance,
      account: effectiveAccount,
      accountName: effectiveAccountName,
    });

    const amountDelta = effectiveAmount - entry.amount;
    if (amountDelta !== 0) {
      console.log(
        `         💰 Amount: ${entry.amount.toFixed(
          2
        )} → ${effectiveAmount.toFixed(2)} (Δ: ${amountDelta.toFixed(2)})`
      );
    }
  }

  const closingBalance = runningBalance;

  console.log(
    `     📊 Closing balance: ${closingBalance.toFixed(
      2
    )} (Dr: ${totalDebit.toFixed(2)}, Cr: ${totalCredit.toFixed(2)})`
  );

  try {
    for (const update of ledgerUpdates) {
      await AccountLedger.updateOne(
        { _id: update._id },
        {
          amount: update.amount,
          runningBalance: update.runningBalance,
          account: update.account,
          accountName: update.accountName,
        },
        { session }
      );
    }

    await AccountMonthlyBalance.updateOne(
      {
        account: accountId,
        branch: branchId,
        year: year,
        month: month,
      },
      {
        openingBalance: openingBalance,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        closingBalance: closingBalance,
        transactionCount: ledgerEntries.length,
        needsRecalculation: false,
        lastUpdated: new Date(),
      },
      { session, upsert: true }
    );

    const nextMonth = getNextMonth(year, month);

    const nextMonthExists = await AccountMonthlyBalance.findOne({
      account: accountId,
      branch: branchId,
      year: nextMonth.year,
      month: nextMonth.month,
    }).session(session);

    if (nextMonthExists) {
      await AccountMonthlyBalance.updateOne(
        {
          account: accountId,
          branch: branchId,
          year: nextMonth.year,
          month: nextMonth.month,
        },
        { needsRecalculation: true },
        { session }
      );
      console.log(
        `     ⚠️  Marked ${formatYearMonth(
          nextMonth.year,
          nextMonth.month
        )} as dirty (cascade)`
      );
    }

    console.log(`     ✅ Month data updated`);
  } catch (error) {
    console.error(`     ❌ Update failed:`, error.message);
    throw error;
  }

  return processedAdjustmentIds;
};

/**
 * Builds a map of adjustments to apply to ledger entries for a specific account.
 * 
 * Processes all adjustments and categorizes them based on whether they affect the current account
 * as the OLD account (being changed FROM) or the NEW account (being changed TO). Handles two scenarios:
 * 
 * 1. **Account Change**: When oldAccount !== affectedAccount
 *    - For OLD account: Marks transaction for zeroing (removal)
 *    - For NEW account: Applies FULL newAmount (since ledger entry starts at 0)
 * 
 * 2. **Amount Change Only**: When account stays the same but amount changes
 *    - Applies delta (newAmount - oldAmount) to existing ledger entry
 * 
 * @param {Array<Object>} adjustments - Array of adjustment documents from Adjustment collection
 * @param {string} currentAccountIdStr - String representation of the current account's ObjectId
 * 
 * @returns {Object} Delta map object containing:
 *   - amountDeltaMap {Object} - Map of transactionId -> amount delta to apply
 *   - accountMap {Object} - Map of transactionId -> new account ObjectId
 *   - accountNameMap {Object} - Map of transactionId -> new account name
 *   - accountChanges {Set<string>} - Set of transaction IDs where account changed (to be zeroed)
 * 
 * @example
 * const adjustments = await Adjustment.find({...});
 * const deltaMap = buildAccountAdjustmentDeltaMap(adjustments, "507f1f77bcf86cd799439011");
 * // Returns:
 * // {
 * //   amountDeltaMap: { "tx123": 2500, "tx124": 500 },
 * //   accountMap: { "tx123": ObjectId("...") },
 * //   accountNameMap: { "tx123": "Sony Account" },
 * //   accountChanges: Set(["tx125"])
 * // }
 */
function buildAccountAdjustmentDeltaMap(adjustments, currentAccountIdStr) {
  const deltaMap = {
    amountDeltaMap: {},
    accountMap: {},
    accountNameMap: {},
    accountChanges: new Set(),
  };

  adjustments.forEach((adjustment) => {
    const txId = adjustment.originalTransaction.toString();
    const oldAccountId = adjustment?.oldAccount?.toString();
    const affectedAccountId = adjustment.affectedAccount.toString();

    // Check if this is an ACCOUNT CHANGE scenario
    const isAccountChange = oldAccountId && oldAccountId !== affectedAccountId;

    if (oldAccountId === currentAccountIdStr) {
      // OLD account - zero it out
      deltaMap.accountChanges.add(txId);
      deltaMap.amountDeltaMap[txId] = -adjustment.oldAmount;
      console.log(
        `📤 OLD ACCOUNT MATCH: Tx ${txId} → SET TO 0 (removing ${adjustment.oldAmount})`
      );
    } else if (affectedAccountId === currentAccountIdStr) {
      // NEW/AFFECTED account
      
      if (isAccountChange) {
        // ACCOUNT CHANGED: Use FULL newAmount (ledger starts at 0)
        deltaMap.amountDeltaMap[txId] = adjustment.newAmount;
        console.log(
          `📥 NEW ACCOUNT (ACCOUNT CHANGE): Tx ${txId} → ADD FULL AMOUNT ${adjustment.newAmount}`
        );
      } else {
        // SAME ACCOUNT: Use delta for amount-only changes
        const amountDelta = adjustment.newAmount - adjustment.oldAmount;
        if (amountDelta !== 0) {
          deltaMap.amountDeltaMap[txId] = amountDelta;
          console.log(
            `📥 SAME ACCOUNT AMOUNT CHANGE: Tx ${txId} delta ${amountDelta} (old:${adjustment.oldAmount}→new:${adjustment.newAmount})`
          );
        }
      }

      if (adjustment.newAccount) {
        deltaMap.accountMap[txId] = adjustment.newAccount;
      }
      if (adjustment.newAccountName) {
        deltaMap.accountNameMap[txId] = adjustment.newAccountName;
      }
    }
  });

  return deltaMap;
}
