/**
 * =============================================================================
 * ACCOUNT LEDGER REFOLD - NIGHTLY RECALCULATION ENGINE
 * =============================================================================
 *
 * Mirrors the exact same architecture as itemLedgerRefold.js
 * Processes dirty AccountMonthlyBalance records by recalculating:
 * 1. AccountLedger runningBalance for each entry
 * 2. AccountMonthlyBalance totals (opening, totalDebit, totalCredit, closing)
 * 3. Applies adjustments (amountDelta, account changes)
 * 4. Cascades dirty flag to next month
 *
 * Author: Midhun Mohan (with AI assistance)
 * Last Updated: Nov 2025
 * =============================================================================
 */

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
 * =============================================================================
 * MAIN ENTRY POINT
 * =============================================================================
 */

/**
 * Process all accounts that have dirty months
 * Returns summary statistics (identical structure to item refold)
 */
export const processAllDirtyAccounts = async () => {
  console.log("💰 Finding all dirty accounts...");

  const workMap = await findDirtyAccounts();
  const workKeys = Object.keys(workMap);

  console.log(
    `📊 Found ${workKeys.length} account-branch combinations with dirty months`
  );

  if (workKeys.length === 0) {
    console.log("✨ No dirty accounts found. Database is clean!");
    return { accountsProcessed: 0, monthsRefolded: 0, errors: [] };
  }

  // Statistics tracking
  let accountsProcessed = 0;
  let monthsRefolded = 0;
  const errors = [];

  // Process each account-branch combination sequentially (same as items)
  for (const key of workKeys) {
    const { accountId, branchId, accountName, months } = workMap[key];

    try {
      console.log(
        `\n🔧 Processing: ${accountName} - Branch: ${branchId}`
      );
      console.log(
        `   Dirty months: ${months
          .map((m) => formatYearMonth(m.year, m.month))
          .join(", ")}`
      );

      const result = await processOneAccount(accountId, branchId, months);

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
      // Continue with next account (isolation)
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
      console.log(
        `   ${e.accountName} - Branch ${e.branchId}: ${e.error}`
      );
    });
  }

  return {
    accountsProcessed,
    monthsRefolded,
    errors,
    success: errors.length === 0,
  };
};

/**
 * =============================================================================
 * STEP 1: FIND ALL DIRTY ACCOUNTS
 * =============================================================================
 */

/**
 * Find all accounts with dirty months and group by account + branch
 * Returns: { "accountId_branchId": { accountId, branchId, accountName, months: [{year, month}] }, ... }
 */
export const findDirtyAccounts = async () => {
  // Query all monthly balance records that need recalculation
  const dirtyRecords = await AccountMonthlyBalance.find({
    needsRecalculation: true,
  })
    .select("account branch year month accountName")
    .lean();

  // Group by account AND branch (composite key)
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
 * =============================================================================
 * STEP 2: PROCESS ONE ACCOUNT-BRANCH COMBINATION
 * =============================================================================
 */

/**
 * Process all dirty months for a single account in a single branch
 * EXACT SAME TRANSACTION PATTERN AS ITEMS
 */
export const processOneAccount = async (accountId, branchId, dirtyMonths) => {
  // Sort months chronologically (CRITICAL)
  dirtyMonths.sort(sortMonthsChronologically);

  let monthsProcessed = 0;

  // START TRANSACTION FOR ALL MONTHS (same as items)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Process each month sequentially within the same transaction
    for (const { year, month } of dirtyMonths) {
      const monthKey = formatYearMonth(year, month);
      console.log(`   🔄 Refolding ${monthKey}...`);

      try {
        await refoldAccountMonth(accountId, branchId, year, month, session);
        monthsProcessed++;
        console.log(`     ✓ ${monthKey} completed`);
      } catch (error) {
        console.error(`     ✗ ${monthKey} failed:`, error.message);
        throw new Error(`Failed at ${monthKey}: ${error.message}`);
      }
    }

    // COMMIT TRANSACTION
    await session.commitTransaction();
    console.log(`   💾 All ${monthsProcessed} months committed successfully`);
  } catch (error) {
    // ROLLBACK TRANSACTION
    await session.abortTransaction();
    console.error(`   🔄 Transaction rolled back:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }

  return { monthsProcessed };
};

/**
 * =============================================================================
 * STEP 3: REFOLD ONE ACCOUNT MONTH (CORE ALGORITHM)
 * =============================================================================
 */

/**
 * Refold a single month for a single account in a single branch
 * EXACT SAME LOGIC AS refoldMonth() but for accounts
 */
export const refoldAccountMonth = async (accountId, branchId, year, month, session) => {
  const monthKey = formatYearMonth(year, month);

  // =========================================================================
  // STEP 3.1: Get opening balance (previous month's closing OR AccountMaster)
  // =========================================================================
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

  // =========================================================================
  // STEP 3.2: Fetch all ledger entries for this month
  // =========================================================================
  const { startDate, endDate } = getMonthDateRange(year, month);

  const ledgerEntries = await AccountLedger.find({
    account: accountId,
    branch: branchId,
    transactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
  })
    .sort({ transactionDate: 1, createdAt: 1 }) // Chronological order
    .lean();

  console.log(`     📝 Found ${ledgerEntries.length} ledger entries`);

  // =========================================================================
  // STEP 3.3: Fetch all adjustments for this month
  // =========================================================================
  const adjustments = await Adjustment.find({
    affectedAccount: accountId,
    branch: branchId,
    originalTransactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: "active",
    isReversed: false,
  }).lean();

  console.log(`     🔧 Found ${adjustments.length} adjustments`);

  // =========================================================================
  // STEP 3.4: Build adjustment delta map
  // =========================================================================
  const adjustmentMap = buildAccountAdjustmentDeltaMap(adjustments);

  if (Object.keys(adjustmentMap.amountDeltaMap).length > 0) {
    console.log(
      `     📊 Adjustments affect ${
        Object.keys(adjustmentMap.amountDeltaMap).length
      } transactions`
    );
  }

  // =========================================================================
  // STEP 3.5: Recalculate running balances with adjustments
  // =========================================================================
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  const ledgerUpdates = [];

  for (const entry of ledgerEntries) {
    const txId = entry.transactionId.toString();

    // Start with existing ledger values
    let effectiveAmount = entry.amount;
    let effectiveAccount = entry.account;
    let effectiveAccountName = entry.accountName;

    // Apply amount adjustments
    if (adjustmentMap.amountDeltaMap[txId]) {
      effectiveAmount += adjustmentMap.amountDeltaMap[txId];
      console.log(
        `🔧 Tx ${entry.transactionNumber}: amount ${entry.amount} + delta ${adjustmentMap.amountDeltaMap[txId]} = ${effectiveAmount}`
      );
    }

    // Override account changes
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

    // Update totals and running balance based on ledgerSide
    if (entry.ledgerSide === "debit") {
      totalDebit += effectiveAmount;
      runningBalance += effectiveAmount;
    } else if (entry.ledgerSide === "credit") {
      totalCredit += effectiveAmount;
      runningBalance -= effectiveAmount;
    }

    // Prepare ledger update
    ledgerUpdates.push({
      _id: entry._id,
      amount: effectiveAmount,
      runningBalance: runningBalance,
      account: effectiveAccount,
      accountName: effectiveAccountName,
    });

    // Log amount changes
    const amountDelta = effectiveAmount - entry.amount;
    if (amountDelta !== 0) {
      console.log(
        `       💰 Amount: ${entry.amount.toFixed(2)} → ${effectiveAmount.toFixed(2)} (Δ: ${amountDelta.toFixed(2)})`
      );
    }
  }

  const closingBalance = runningBalance;

  console.log(
    `     📊 Closing balance: ${closingBalance.toFixed(2)} (Dr: ${totalDebit.toFixed(2)}, Cr: ${totalCredit.toFixed(2)})`
  );

  // =========================================================================
  // STEP 3.6: Update database (within transaction)
  // =========================================================================
  try {
    // Update all ledger entries
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

    // Update monthly balance summary
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

    // =========================================================================
    // STEP 3.7: Cascade to next month (EXACT SAME AS ITEMS)
    // =========================================================================
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
};

/**
 * =============================================================================
 * HELPER: Build Account Adjustment Delta Map
 * =============================================================================
 */

/**
 * Build adjustment map for accounts (mirrors item version)
 * Matches: AdjustmentEntry.originalTransaction === AccountLedger.transactionId 
 *        + AdjustmentEntry.affectedAccount === AccountLedger.account
 */
function buildAccountAdjustmentDeltaMap(adjustments) {
  const deltaMap = {
    amountDeltaMap: {},
    accountMap: {},
    accountNameMap: {},
  };

  adjustments.forEach((adjustment) => {
    const txId = adjustment.originalTransaction.toString();

    // Amount adjustments
    if (adjustment.amountDelta) {
      deltaMap.amountDeltaMap[txId] = (deltaMap.amountDeltaMap[txId] || 0) + adjustment.amountDelta;
    }

    // Account changes (always override last one)
    if (adjustment.newAccount) {
      deltaMap.accountMap[txId] = adjustment.newAccount;
    }
    if (adjustment.newAccountName) {
      deltaMap.accountNameMap[txId] = adjustment.newAccountName;
    }
  });

  return deltaMap;
}
