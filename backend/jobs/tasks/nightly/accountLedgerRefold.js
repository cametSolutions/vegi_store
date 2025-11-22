import AdjustmentEntryModel from "../../../model/AdjustmentEntryModel";

/**
 * Refold a single month for a specific account and branch
 * Recalculates running balances and updates ledger entries and monthly summary
 *
 * @param {String} accountId - MongoDB ObjectId as string of the account
 * @param {String} branchId - MongoDB ObjectId as string of the branch
 * @param {Number} year - Year of month to refold (e.g., 2025)
 * @param {Number} month - Month to refold (1-12)
 * @param {Object} session - MongoDB session for transaction context
 */
export const refoldAccountMonth = async (
  accountId,
  branchId,
  year,
  month,
  session
) => {
  const monthKey = formatYearMonth(year, month);
  console.log(`🔄 Refolding ${monthKey}...`);

  // ===========================================================================
  // STEP 1: Determine the opening balance for this month
  // Look for previous month's closing balance first to maintain continuity
  // Fallback to account master opening balance if no previous month found
  // ===========================================================================
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
    console.log(`📊 Opening from previous month: ${openingBalance}`);
  } else {
    // No previous month found, get opening from Account Master data
    const accountMaster = await mongoose
      .model("AccountMaster")
      .findOne({
        _id: accountId,
        branches: branchId,
      })
      .select("openingBalance")
      .session(session);

    if (accountMaster && accountMaster.openingBalance !== undefined) {
      openingBalance = accountMaster.openingBalance;
      console.log(`📦 Opening from Account Master: ${openingBalance}`);
    } else {
      console.log(
        `⚠️ Account not found in Account Master or no opening balance, using 0`
      );
    }
  }

  // ===========================================================================
  // STEP 2: Fetch all ledger entries for this account-branch-month in chronological order
  // ===========================================================================
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

  // ===========================================================================
  // STEP 3: Fetch all active, non-reversed adjustments affecting this account and branch for the month
  // ===========================================================================
  const adjustments = await AdjustmentEntryModel.find({
    affectedAccount: accountId,
    branch: branchId,
    adjustmentDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: "active",
    isReversed: false,
  }).lean();

  // ===========================================================================
  // STEP 4: Build a map of cumulative adjustment deltas by transactionId
  // This map will hold amount deltas and account overrides for ledger refold
  // ===========================================================================
  const adjustmentMap = buildAccountAdjustmentDeltaMap(adjustments);

  // ===========================================================================
  // STEP 5: Loop through each ledger entry, apply adjustments and recalculate balances
  // Maintain running balance and accumulate monthly totals of debit and credit
  // ===========================================================================
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  const ledgerUpdates = [];

  for (const entry of ledgerEntries) {
    const txId = entry.transactionId.toString();
    let effectiveAmount = entry.amount;
    let effectiveAccount = entry.account;
    let effectiveAccountName = entry.accountName;

    // Apply amount delta adjustment if present for transaction
    if (adjustmentMap.amountDeltaMap[txId]) {
      effectiveAmount += adjustmentMap.amountDeltaMap[txId];
      console.log(
        `🔧 Tx ${entry.transactionNumber}: amount ${entry.amount} + delta ${adjustmentMap.amountDeltaMap[txId]} = ${effectiveAmount}`
      );
    }

    // Override account if adjustment changes it
    if (adjustmentMap.accountMap[txId]) {
      effectiveAccount = adjustmentMap.accountMap[txId];
      console.log(
        `🔧 Tx ${entry.transactionNumber}: account changed to ${effectiveAccount}`
      );
    }

    // Override accountName if adjustment changes it
    if (adjustmentMap.accountNameMap[txId]) {
      effectiveAccountName = adjustmentMap.accountNameMap[txId];
      console.log(
        `🔧 Tx ${entry.transactionNumber}: account name changed to ${effectiveAccountName}`
      );
    }

    // Recalculate running balance according to ledger side (debit/credit)
    runningBalance +=
      entry.ledgerSide === "debit" ? effectiveAmount : -effectiveAmount;

    // Aggregate total debit and credit for the month
    if (entry.ledgerSide === "debit") {
      totalDebit += effectiveAmount;
    } else {
      totalCredit += effectiveAmount;
    }

    // Prepare batch update data for this ledger entry
    ledgerUpdates.push({
      _id: entry._id,
      amount: effectiveAmount,
      runningBalance: runningBalance,
      account: effectiveAccount,
      accountName: effectiveAccountName,
    });
  }

  const closingBalance = runningBalance;

  // ===========================================================================
  // STEP 6: Persist all updated ledger entries and update monthly balance document
  // Updates performed inside the passed MongoDB transaction session
  // ===========================================================================
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
      closingBalance: closingBalance,
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      needsRecalculation: false,
      lastUpdated: new Date(),
    },
    { session }
  );

  // ===========================================================================
  // STEP 7: Cascade recalculation to next month by marking it dirty
  // This ensures consistency for subsequent months dependent on this closing balance
  // ===========================================================================
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
      `⚠️ Marked ${formatYearMonth(nextMonth.year, nextMonth.month)} as dirty (cascade)`
    );
  }

  console.log(`✅ Month data updated`);
};



/**
 * Build cumulative adjustment delta maps for account ledger recalculation
 * Aggregates amountDelta and account overrides for each original transaction
 *
 * @param {Array} adjustments - Array of adjustment documents for a specific account/month
 * @returns {Object} - Maps with keys transactionId:
 *   {
 *     amountDeltaMap: { [transactionId]: cumulative amount delta },
 *     accountMap: { [transactionId]: new account ObjectId (last override) },
 *     accountNameMap: { [transactionId]: new account name (last override) }
 *   }
 */
export function buildAccountAdjustmentDeltaMap(adjustments) {
  const deltaMap = {
    amountDeltaMap: {},
    accountMap: {},
    accountNameMap: {},
  };

  adjustments.forEach((adj) => {
    const txId = adj.originalTransaction.toString();

    // Accumulate amountDelta for the transaction
    if (typeof adj.amountDelta === "number" && adj.amountDelta !== 0) {
      if (!deltaMap.amountDeltaMap[txId]) {
        deltaMap.amountDeltaMap[txId] = 0;
      }
      deltaMap.amountDeltaMap[txId] += adj.amountDelta;
    }

    // Override account if changed (take last override if multiple adjustments)
    if (adj.newAccount) {
      deltaMap.accountMap[txId] = adj.newAccount.toString();
    }

    // Override accountName if changed (take last override)
    if (adj.newAccountName) {
      deltaMap.accountNameMap[txId] = adj.newAccountName;
    }
  });

  return deltaMap;
}

