/**
 * =============================================================================
 * ACCOUNT LEDGER REFOLD - NIGHTLY RECALCULATION ENGINE (FIXED VERSION)
 * =============================================================================
 *
 * ✅ FIXED: Proper handling of oldAccount vs affectedAccount adjustments
 * ✅ OLD ACCOUNT: Sets ledger amount to 0 (removes transaction)
 * ✅ NEW ACCOUNT: Applies newAmount with account/accountName changes
 *
 * Author: Midhun Mohan (with AI assistance)
 * Last Updated: Dec 2025 - Fixed double-adjustment bug
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
 * MAIN ENTRY POINT (UNCHANGED)
 * =============================================================================
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

  let accountsProcessed = 0;
  let monthsRefolded = 0;
  const errors = [];

  for (const key of workKeys) {
    const { accountId, branchId, accountName, months } = workMap[key];

    try {
      console.log(`\n🔧 Processing: ${accountName} - Branch: ${branchId}`);
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
  };
};

/**
 * =============================================================================
 * STEP 1: FIND ALL DIRTY ACCOUNTS (UNCHANGED)
 * =============================================================================
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
 * =============================================================================
 * STEP 2: PROCESS ONE ACCOUNT-BRANCH COMBINATION (UNCHANGED)
 * =============================================================================
 */
export const processOneAccount = async (accountId, branchId, dirtyMonths) => {
  dirtyMonths.sort(sortMonthsChronologically);

  let monthsProcessed = 0;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
 * =============================================================================
 * STEP 3: REFOLD ONE ACCOUNT MONTH (CORE ALGORITHM - FIXED)
 * =============================================================================
 */
export const refoldAccountMonth = async (
  accountId,
  branchId,
  year,
  month,
  session
) => {
  const monthKey = formatYearMonth(year, month);
  const currentAccountIdStr = accountId.toString(); // For string comparison

  // STEP 3.1: Get opening balance (UNCHANGED)
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

  // STEP 3.2: Fetch all ledger entries for this month (UNCHANGED)
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

  // ✅ STEP 3.3: FIXED - Fetch adjustments for BOTH oldAccount AND affectedAccount
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

  // ✅ STEP 3.4: FIXED - Build proper adjustment delta map
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

  // STEP 3.5: Recalculate running balances with FIXED adjustment logic
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  const ledgerUpdates = [];

  console.log("ledgerEntries", ledgerEntries);

  for (const entry of ledgerEntries) {
    const txId = entry.transactionId.toString();

    // ✅ FIXED LOGIC: Handle account changes properly
    let effectiveAmount = entry.amount;
    let effectiveAccount = entry.account;
    let effectiveAccountName = entry.accountName;

    // SPECIAL CASE 1: This is OLD ACCOUNT - REMOVE transaction completely (set to 0)
    if (adjustmentMap.accountChanges.has(txId)) {
      effectiveAmount = 0;
      console.log(
        `🔧 Tx ${entry.transactionNumber}: OLD ACCOUNT → SET TO 0 (removed)`
      );
    } else {
      // NORMAL CASE: Apply amount delta (for NEW accounts or simple amount changes)
      if (adjustmentMap.amountDeltaMap[txId]) {
        effectiveAmount += adjustmentMap.amountDeltaMap[txId];
        console.log(
          `🔧 Tx ${entry.transactionNumber}: amount ${entry.amount} + delta ${adjustmentMap.amountDeltaMap[txId]} = ${effectiveAmount}`
        );
      }

      // Account changes (only apply to NEW accounts)
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
        `       💰 Amount: ${entry.amount.toFixed(
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

  // STEP 3.6: Update database (UNCHANGED)
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

    // STEP 3.7: Cascade to next month (UNCHANGED)
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
 * ✅ FIXED HELPER: Build Account Adjustment Delta Map
 * =============================================================================
 *
 * LOGIC:
 * 1. OLD ACCOUNT: Set amount to 0 (remove transaction) → accountChanges Set
 * 2. NEW ACCOUNT: Apply newAmount delta + account/accountName changes
 */
function buildAccountAdjustmentDeltaMap(adjustments, currentAccountIdStr) {
  const deltaMap = {
    amountDeltaMap: {},
    accountMap: {},
    accountNameMap: {},
    accountChanges: new Set(), // NEW: Track transactions to be ZEROED (old accounts)
  };

  adjustments.forEach((adjustment) => {
    console.log(adjustment.originalTransaction.toString());
    const txId = adjustment.originalTransaction.toString();
    const oldAccountId = adjustment?.oldAccount?.toString();
    const affectedAccountId = adjustment.affectedAccount.toString();

    // ✅ CASE 1: Current account is OLD ACCOUNT - REMOVE transaction completely
    if (oldAccountId === currentAccountIdStr) {
      deltaMap.accountChanges.add(txId);
      // Force amount to 0 by applying negative oldAmount
      deltaMap.amountDeltaMap[txId] = -adjustment.oldAmount;
      console.log(
        `📤 OLD ACCOUNT MATCH: Tx ${txId} → SET TO 0 (removing ${adjustment.oldAmount})`
      );
    }
    // ✅ CASE 2: Current account is NEW/AFFECTED ACCOUNT - Apply changes
    else if (affectedAccountId === currentAccountIdStr) {
      // Calculate delta: newAmount - oldAmount
      const amountDelta = adjustment.newAmount - adjustment.oldAmount;
      if (amountDelta !== 0) {
        deltaMap.amountDeltaMap[txId] = amountDelta;
        console.log(
          `📥 NEW ACCOUNT MATCH: Tx ${txId} delta ${amountDelta} (old:${adjustment.oldAmount}→new:${adjustment.newAmount})`
        );
      }

      // Apply account changes
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
