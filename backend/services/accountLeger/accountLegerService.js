// services/accountLedgerService.js
import mongoose from 'mongoose';
import AccountLedger from '../../model/AccountLedgerModel.js';
import AccountMonthlyBalance from '../../model/AccountMonthlyBalanceModel.js';
import AdjustmentEntry from '../../model/AdjustmentEntryModel.js';
import AccountMasterModel from '../../model/masters/AccountMasterModel.js';



const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// =============================================================================
// DEBIT/CREDIT CONDITIONS HELPER
// sale, purchase_return, payment → DEBIT
// purchase, sales_return, receipt → CREDIT
// =============================================================================
const getDebitCreditConditions = (transactionType) => {
  if (transactionType === 'sale') {
    return { 
      debitCondition: { $eq: ['$transactionType', 'sale'] }, 
      creditCondition: { $eq: ['$transactionType', 'purchase_return'] } 
    };
  } else if (transactionType === 'purchase') {
    return { 
      debitCondition: { $eq: ['$transactionType', 'purchase_return'] }, 
      creditCondition: { $eq: ['$transactionType', 'purchase'] } 
    };
  } else {
    // Default: All transactions
    return { 
      debitCondition: { $in: ['$transactionType', ['sale', 'purchase_return', 'payment']] }, 
      creditCondition: { $in: ['$transactionType', ['purchase', 'sales_return', 'receipt']] } 
    };
  }
};

// =============================================================================
// CORE UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate opening balances for multiple accounts at once (BATCHED)
 * Process:
 * 1. Find last clean monthly balance for each account
 * 2. If no monthly balance, use AccountMaster opening balance
 * 3. Calculate movements in dirty period (after last clean snapshot, before report start)
 * 4. Apply adjustments in dirty period
 * 5. Return map of accountId → openingBalance
 */
export const getBatchOpeningBalances = async (company, branch, accountIds, selectedDate) => {
  console.log('getBatchOpeningBalances START', { 
    company, 
    branch, 
    accountIdsCount: accountIds.length, 
    selectedDate: selectedDate?.toISOString() 
  });
  
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const accountIdObjs = accountIds.map(id => toObjectId(id));
  
  // Base start date for the system (no data before this)
  const BASE_START_DATE = new Date('2025-04-01T00:00:00.000Z');
  
  // Handle invalid dates or dates before system start
  if (!selectedDate || isNaN(selectedDate.getTime()) || selectedDate < BASE_START_DATE) {
    console.log('Early return: Invalid or pre-base date detected');
    return accountIds.reduce((acc, id) => ({ ...acc, [id.toString()]: 0 }), {});
  }
  
  // Calculate previous month for finding last clean monthly balance
  const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  
  console.log('Calculated previous month:', { prevYear, prevMonthNum });
  
  // -----------------------------------------------------------------------
  // STEP 1: Get last CLEAN monthly balance for ALL accounts
  // This finds the most recent verified snapshot before our report date
  // -----------------------------------------------------------------------
  console.time('Step 1 - Monthly balances query');
  const monthlyBalances = await AccountMonthlyBalance.aggregate([
    { 
      $match: { 
        company: companyId, 
        branch: branchId, 
        account: { $in: accountIdObjs },
        needsRecalculation: false, // Only clean/verified balances
        $or: [
          { year: { $lt: prevYear } },
          { year: prevYear, month: { $lte: prevMonthNum } }
        ]
      }
    },
    { $sort: { account: 1, year: -1, month: -1 } }, // Latest first per account
    { 
      $group: {
        _id: '$account',
        closingBalance: { $first: '$closingBalance' }, // Take latest
        year: { $first: '$year' },
        month: { $first: '$month' }
      }
    }
  ]);
  console.timeEnd('Step 1 - Monthly balances query');
  console.log('Monthly balances found:', monthlyBalances.length);
  
  // -----------------------------------------------------------------------
  // STEP 2: Fallback to AccountMaster for accounts WITHOUT monthly balances
  // New accounts or accounts created before monthly balance system
  // -----------------------------------------------------------------------
  const accountsWithBalances = monthlyBalances.map(m => m._id.toString());
  const accountsNeedingMaster = accountIdObjs.filter(id => !accountsWithBalances.includes(id.toString()));
  
  console.log('Accounts needing master lookup:', accountsNeedingMaster.length);
  
  let masterBalances = [];
  if (accountsNeedingMaster.length > 0) {
    console.time('Step 2 - Account master query');
    masterBalances = await AccountMasterModel.aggregate([
      { $match: { _id: { $in: accountsNeedingMaster }, company: companyId }},
      { $project: { _id: 1, openingBalance: 1 }}
    ]);
    console.timeEnd('Step 2 - Account master query');
    console.log('Master balances found:', masterBalances.length);
  }
  
  // -----------------------------------------------------------------------
  // STEP 3: Build base balances map and track dirty period start dates
  // Each account has its own dirty period based on last snapshot
  // -----------------------------------------------------------------------
  console.log('Step 3: Building base balances map');
  const baseBalances = {};
  const dirtyPeriodStarts = {};
  
  // Accounts with monthly balance use closing balance as base
  monthlyBalances.forEach(mb => {
    const accountKey = mb._id.toString();
    baseBalances[accountKey] = mb.closingBalance || 0;
    // Dirty period starts from the month AFTER the snapshot
    dirtyPeriodStarts[accountKey] = new Date(mb.year, mb.month, 1);
    console.log(`Account ${accountKey}: Monthly balance ${mb.closingBalance} from ${mb.year}-${mb.month}`);
  });
  
  // Accounts from master use opening balance as base
  masterBalances.forEach(master => {
    const accountKey = master._id.toString();
    baseBalances[accountKey] = master.openingBalance || 0;
    // Dirty period starts from system base date (no snapshots exist)
    dirtyPeriodStarts[accountKey] = BASE_START_DATE;
    console.log(`Account ${accountKey}: Master opening ${master.openingBalance}, dirty start ${BASE_START_DATE.toISOString()}`);
  });
  
  // Initialize accounts with no data found anywhere
  accountIdObjs.forEach(id => {
    const accountKey = id.toString();
    if (!baseBalances[accountKey]) {
      baseBalances[accountKey] = 0;
      dirtyPeriodStarts[accountKey] = BASE_START_DATE;
      console.log(`Account ${accountKey}: No data found, defaulting to 0`);
    }
  });
  
  console.log('Base balances initialized:', Object.keys(baseBalances).length);
  
  // Dirty period ends just before report starts
  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);
  console.log('Dirty period end:', dirtyPeriodEnd.toISOString());
  
  // -----------------------------------------------------------------------
  // STEP 4: Get ledger movements in dirty period (PER ACCOUNT date ranges)
  // Each account has different dirty period based on last snapshot
  // -----------------------------------------------------------------------
  console.time('Step 4 - Ledger movements query');
  
  // Build OR conditions with per-account date ranges
  const ledgerMatchConditions = accountIdObjs.map(id => {
    const accountKey = id.toString();
    const startDate = dirtyPeriodStarts[accountKey] || BASE_START_DATE;
    return {
      account: id,
      transactionDate: { 
        $gte: startDate,          // Dirty period start (different per account)
        $lt: dirtyPeriodEnd       // Report start date (same for all)
      }
    };
  });
  
  const ledgerMovements = await AccountLedger.aggregate([
    { 
      $match: { 
        company: companyId, 
        branch: branchId, 
        $or: ledgerMatchConditions // Use per-account date ranges
      }
    },
    {
      $addFields: {
        // Convert to signed amount: debit=+, credit=-
        signedAmount: {
          $multiply: [
            '$amount',
            { $cond: [{ $eq: ['$ledgerSide', 'debit'] }, 1, -1] }
          ]
        }
      }
    },
    {
      $group: {
        _id: '$account',
        totalSignedAmount: { $sum: '$signedAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  console.timeEnd('Step 4 - Ledger movements query');
  console.log('Ledger movements found:', ledgerMovements.length);
  
  ledgerMovements.forEach(lm => {
    console.log(`Account ${lm._id}: ${lm.transactionCount} transactions, total signed amount: ${lm.totalSignedAmount}`);
  });
  
  // -----------------------------------------------------------------------
  // STEP 5: Get adjustments in dirty period (PER ACCOUNT date ranges)
  // Adjustments modify original transactions, need to apply deltas
  // -----------------------------------------------------------------------
  console.time('Step 5 - Adjustment movements query');
  
  const adjustmentMatchConditions = accountIdObjs.map(id => {
    const accountKey = id.toString();
    const startDate = dirtyPeriodStarts[accountKey] || BASE_START_DATE;
    return {
      affectedAccount: id,
      originalTransactionDate: { 
        $gte: startDate, 
        $lt: dirtyPeriodEnd 
      }
    };
  });
  
  const adjustmentMovements = await AdjustmentEntry.aggregate([
    { 
      $match: { 
        company: companyId, 
        branch: branchId, 
        $or: adjustmentMatchConditions,
        status: 'active',
        isReversed: false
      }
    },
    {
      $group: {
        _id: '$affectedAccount',
        totalAmountDelta: { $sum: '$amountDelta' }
      }
    }
  ]);
  console.timeEnd('Step 5 - Adjustment movements query');
  console.log('Adjustment movements found:', adjustmentMovements.length);
  
  adjustmentMovements.forEach(am => {
    console.log(`Account ${am._id}: adjustment delta ${am.totalAmountDelta}`);
  });
  
  // -----------------------------------------------------------------------
  // STEP 6: Combine all data to calculate final opening balances
  // Formula: opening = base + ledgerMovements + adjustments
  // -----------------------------------------------------------------------
  console.log('Step 6: Combining all data');
  const finalBalances = {};
  
  accountIdObjs.forEach(id => {
    const accountKey = id.toString();
    let balance = baseBalances[accountKey] || 0;
    const baseBalance = balance;
    
    // Add ledger movements
    const ledgerMove = ledgerMovements.find(l => l._id.toString() === accountKey);
    let ledgerMovement = 0;
    if (ledgerMove) {
      ledgerMovement = ledgerMove.totalSignedAmount;
      balance += ledgerMovement;
    }
    
    // Add adjustment deltas
    const adjMove = adjustmentMovements.find(a => a._id.toString() === accountKey);
    let adjustmentMovement = 0;
    if (adjMove) {
      adjustmentMovement = adjMove.totalAmountDelta;
      balance += adjustmentMovement;
    }
    
    finalBalances[accountKey] = balance;
    console.log(`Account ${accountKey} final: ${baseBalance} (base) + ${ledgerMovement} (ledger) + ${adjustmentMovement} (adj) = ${balance}`);
  });
  
  console.log('Final balances computed:', Object.keys(finalBalances).length);
  console.log('getBatchOpeningBalances END');
  
  return finalBalances;
};

/**
 * Check if dirty period exists and determine which report path to use
 * Returns: { isDirty: boolean, needsFullRefold: boolean, reason: string }
 * 
 * Three possible outcomes:
 * 1. isDirty=false, needsFullRefold=false → FAST PATH
 * 2. isDirty=true, needsFullRefold=false → HYBRID PATH
 * 3. isDirty=true, needsFullRefold=true → FULL REFOLD
 */
export const checkIfDirtyPeriodExists = async (company, branch, accountIds, startDate, endDate) => {
  console.log('Checking dirty period status');
  
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const accountIdObjs = accountIds.map(id => toObjectId(id));
  
  const reportStartDate = new Date(startDate);
  
  // Calculate previous month details
  const prevMonthDate = new Date(reportStartDate.getFullYear(), reportStartDate.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  
  console.log('Checking for clean monthly balances:', { prevYear, prevMonthNum });
  
  // -----------------------------------------------------------------------
  // CHECK 1: Do ALL accounts have clean monthly balance for previous month?
  // If not, we need full refold (missing base data)
  // -----------------------------------------------------------------------
  const cleanMonthlyBalances = await AccountMonthlyBalance.countDocuments({
    company: companyId,
    branch: branchId,
    account: { $in: accountIdObjs },
    year: prevYear,
    month: prevMonthNum,
    needsRecalculation: false
  });

  console.log('Clean monthly balances:', cleanMonthlyBalances);
  
  
  if (cleanMonthlyBalances !== accountIds.length) {
    console.log(`Only ${cleanMonthlyBalances}/${accountIds.length} accounts have clean monthly balance`);
    return { 
      isDirty: true, 
      needsFullRefold: true, 
      reason: 'Missing or dirty monthly balances' 
    };
  }
  
  console.log(`All ${accountIds.length} accounts have clean monthly balance`);
  
  // -----------------------------------------------------------------------
  // CHECK 2: Are there adjustments in the REPORT period?
  // If yes, we need full refold (must apply adjustment deltas)
  // -----------------------------------------------------------------------
  const adjustmentsInPeriod = await AdjustmentEntry.countDocuments({
    company: companyId,
    branch: branchId,
    originalTransactionDate: { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    },
    status: 'active',
    isReversed: false
  });
  
  if (adjustmentsInPeriod > 0) {
    console.log(`Found ${adjustmentsInPeriod} adjustments in report period`);
    return { 
      isDirty: true, 
      needsFullRefold: true, 
      reason: 'Adjustments in report period' 
    };
  }
  
  console.log('No adjustments in report period');
  
  // -----------------------------------------------------------------------
  // CHECK 3: Does report start mid-month?
  // If yes, use hybrid path (calculate opening, but simple ledger)
  // -----------------------------------------------------------------------
  if (reportStartDate.getDate() !== 1) {
    console.log('Report starts mid-month, opening needs calculation');
    return { 
      isDirty: true, 
      needsFullRefold: false, 
      reason: 'Mid-month start (hybrid path eligible)' 
    };
  }
  
  // -----------------------------------------------------------------------
  // All checks passed → Pure fast path!
  // -----------------------------------------------------------------------
  console.log('Pure fast path - everything is clean!');
  return { 
    isDirty: false, 
    needsFullRefold: false, 
    reason: 'All conditions perfect for fast path' 
  };
};

/**
 * Get adjusted ledger data for multiple accounts with lookup to adjustments (BATCHED)
 * This is used in FULL REFOLD path when adjustments exist in report period
 * 
 * Process:
 * 1. Fetch ledger entries for report period
 * 2. $lookup adjustment entries for each transaction
 * 3. Calculate effective amounts (original + adjustment deltas)
 * 4. Group by account and calculate summaries
 * 5. Return map of accountId → ledger data
 */
export const getBatchAdjustedLedgers = async (companyId, branchId, accountIds, startDate, endDate, openingBalances, transactionType = null) => {
  const accountIdObjs = accountIds.map(id => toObjectId(id));
  
  const baseMatch = {
    company: companyId,
    branch: branchId,
    account: { $in: accountIdObjs },
    transactionDate: { $gte: startDate, $lte: endDate }
  };
  
  // Apply transaction type filter if specified
  if (transactionType === 'sale') {
    baseMatch.transactionType = { $in: ['sale', 'purchase_return'] };
  } else if (transactionType === 'purchase') {
    baseMatch.transactionType = { $in: ['purchase', 'sales_return'] };
  }
  
  // Get debit/credit conditions
  const { debitCondition, creditCondition } = getDebitCreditConditions(transactionType);
  
  const ledgers = await AccountLedger.aggregate([
    { $match: baseMatch },
    
    
    // -------------------------------------------------------------------
    // $lookup: Join with adjustment_entries to get deltas
    // This is expensive! Only used when adjustments exist
    // -------------------------------------------------------------------
    {
      $lookup: {
        from: 'adjustment_entries',
        let: { 
          txnNum: '$transactionNumber', 
          company: '$company', 
          branch: '$branch', 
          account: '$account' 
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$company', '$$company'] },
                  { $eq: ['$branch', '$$branch'] },
                  { $eq: ['$originalTransactionNumber', '$$txnNum'] },
                  { $eq: ['$affectedAccount', '$$account'] },
                  { $eq: ['$status', 'active'] },
                  { $eq: ['$isReversed', false] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalAmountDelta: { $sum: '$amountDelta' }
            }
          }
        ],
        as: 'adjustments'
      }
    },
    
    // -------------------------------------------------------------------
    // Calculate effective values (original + adjustment deltas)
    // -------------------------------------------------------------------
    {
      $addFields: {
        totalAmountDelta: { $ifNull: [{ $arrayElemAt: ['$adjustments.totalAmountDelta', 0] }, 0] },
        
        // Effective amount = original + delta
        effectiveAmount: { $add: ['$amount', '$totalAmountDelta'] },
        
        // Signed amount for balance calculation: debit=+, credit=-
        signedAmount: {
          $multiply: [
            { $add: ['$amount', '$totalAmountDelta'] },
            { $cond: [{ $eq: ['$ledgerSide', 'debit'] }, 1, -1] }
          ]
        },
        
        hasAdjustment: { $gt: [{ $size: '$adjustments' }, 0] }
      }
    },
    
    // Remove adjustment array from output (heavy)
    { $project: { adjustments: 0 } },
    
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    
    // -------------------------------------------------------------------
    // Group by account to calculate summaries
    // -------------------------------------------------------------------
    {
      $group: {
        _id: '$account',
        transactions: { $push: '$$ROOT' }, // Keep all transactions
        totalDebit: {
          $sum: {
            $cond: [debitCondition, '$effectiveAmount', 0]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [creditCondition, '$effectiveAmount', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  // Convert to map
  const ledgerMap = {};
  
  ledgers.forEach(item => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty = openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);
    
    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0
      },
      transactions: item.transactions
    };
  });
  
  // Handle accounts with no transactions in the period
  accountIds.forEach(id => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0
        },
        transactions: []
      };
    }
  });
  
  return ledgerMap;
};

// =============================================================================
// REPORT PATHS
// =============================================================================

/**
 * PATH 1: FAST PATH (150-200ms)
 * 
 * Used when:
 * - Report starts on 1st of month
 * - All accounts have clean monthly balance for previous month
 * - No adjustments in report period
 * 
 * Process:
 * 1. Get opening directly from monthly balance (no calculation)
 * 2. Simple aggregation for ledger (NO $lookup to adjustments)
 * 3. Calculate summaries
 */
export const getSimpleLedgerReport = async (
  company, 
  branch, 
  startDate, 
  endDate, 
  transactionType = null, 
  page = 1, 
  limit = 50, 
  searchTerm = null,
  account = null
) => {
  console.log('getSimpleLedgerReport FAST PATH START');
  const reportStartTime = Date.now();
  
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};
  
  const baseMatch = { 
    company: companyId, 
    branch: branchId, 
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter
  };
  
  if (transactionType === 'sale') {
    baseMatch.transactionType = { $in: ['sale', 'purchase_return'] };
  } else if (transactionType === 'purchase') {
    baseMatch.transactionType = { $in: ['purchase', 'sales_return'] };
  }
  
  let searchStage = [];
  if (searchTerm && !account) { // Skip search for single account mode
    const regex = new RegExp(searchTerm, 'i');
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }
  
  // -----------------------------------------------------------------------
  // QUERY 1: Get paginated account list
  // -----------------------------------------------------------------------
  console.time('Query 1 - Account list');
  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$account', accountName: { $first: '$accountName' } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: 'totalItems' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    }
  ]);
  console.timeEnd('Query 1 - Account list');
  
  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];
  
  if (accountsPage.length === 0) {
    console.log('No accounts found, returning empty result');
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: { 
        company, 
        branch, 
        account: account ? account.toString() : null,
        startDate, 
        endDate, 
        transactionType: transactionType || 'all', 
        searchTerm: searchTerm || null 
      }
    };
  }
  
  const accountIds = accountsPage.map(row => row._id.toString());
  const accountIdObjs = accountIds.map(id => toObjectId(id));
  
  console.log('Processing', accountIds.length, 'accounts');
  
  // -----------------------------------------------------------------------
  // QUERY 2: Get opening balances DIRECTLY from monthly balance
  // No calculation needed! Just read closing balance from previous month
  // -----------------------------------------------------------------------
  console.time('Query 2 - Opening balances from monthly balance');
  const prevMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  
  const monthlyBalances = await AccountMonthlyBalance.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        account: { $in: accountIdObjs },
        year: prevYear,
        month: prevMonthNum,
        needsRecalculation: false
      }
    },
    { $project: { _id: 0, account: '$account', closingBalance: 1 } }
  ]);
  console.timeEnd('Query 2 - Opening balances from monthly balance');
  
  // Build opening balances map
  const openingBalances = {};
  monthlyBalances.forEach(mb => {
    openingBalances[mb.account.toString()] = mb.closingBalance || 0;
  });
  
  // Ensure all accounts have opening balance
  accountIdObjs.forEach(id => {
    const accountKey = id.toString();
    if (!openingBalances[accountKey]) {
      openingBalances[accountKey] = 0;
    }
  });
  
  console.log('Opening balances loaded for', Object.keys(openingBalances).length, 'accounts');
  
  // -----------------------------------------------------------------------
  // QUERY 3: Simple ledger aggregation (NO $lookup!)
  // This is the key difference - no adjustment lookups needed
  // -----------------------------------------------------------------------
  console.time('Query 3 - Simple ledger aggregation');
  
  // Get debit/credit conditions based on transactionType
  const { debitCondition, creditCondition } = getDebitCreditConditions(transactionType);
  
  const ledgers = await AccountLedger.aggregate([
    { $match: { ...baseMatch, account: { $in: accountIdObjs } } },
    // NO $lookup here! That's what makes this fast
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    // Group by account to calculate summaries
    {
      $group: {
        _id: '$account',
        transactions: { $push: '$$ROOT' },
        totalDebit: {
          $sum: {
            $cond: [debitCondition, '$amount', 0]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [creditCondition, '$amount', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  console.timeEnd('Query 3 - Simple ledger aggregation');
  console.log('Ledger data processed for', ledgers.length, 'accounts');
  
  // Build ledger map
  const ledgerMap = {};
  ledgers.forEach(item => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty = openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);
    
    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0
      },
      transactions: item.transactions
    };
  });
  
  // Handle accounts with no transactions in the period
  accountIds.forEach(id => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0
        },
        transactions: []
      };
    }
  });
  
  // Combine results
  const ledgersPerAccount = accountsPage.map(row => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    return {
      accountId: row._id,
      accountName: row.accountName,
      openingBalance: data.openingBalance,
      summary: data.summary,
      transactions: data.transactions
    };
  });
  
  const totalTime = Date.now() - reportStartTime;
  console.log(`getSimpleLedgerReport FAST PATH END - ${totalTime}ms`);
  
  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || 'all',
      searchTerm: searchTerm || null
    }
  };
};

/**
 * PATH 2: HYBRID PATH (220-280ms)
 * 
 * Used when:
 * - Report starts mid-month OR no clean monthly balance for all accounts
 * - BUT no adjustments in report period
 * 
 * Process:
 * 1. Calculate opening with dirty period (uses getBatchOpeningBalances)
 * 2. Simple aggregation for ledger (NO $lookup - no adjustments in period)
 * 3. Calculate summaries
 */
export const getHybridLedgerReport = async (
  company, 
  branch, 
  startDate, 
  endDate, 
  transactionType = null, 
  page = 1, 
  limit = 50, 
  searchTerm = null,
  account = null
) => {
  console.log('getHybridLedgerReport HYBRID PATH START');
  const reportStartTime = Date.now();
  
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};
  
  const baseMatch = { 
    company: companyId, 
    branch: branchId, 
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter
  };
  
  if (transactionType === 'sale') {
    baseMatch.transactionType = { $in: ['sale', 'purchase_return'] };
  } else if (transactionType === 'purchase') {
    baseMatch.transactionType = { $in: ['purchase', 'sales_return'] };
  }
  
  let searchStage = [];
  if (searchTerm && !account) {
    const regex = new RegExp(searchTerm, 'i');
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }
  
  // -----------------------------------------------------------------------
  // QUERY 1: Get paginated account list (same as fast path)
  // -----------------------------------------------------------------------
  console.time('Query 1 - Account list');
  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$account', accountName: { $first: '$accountName' } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: 'totalItems' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    }
  ]);
  console.timeEnd('Query 1 - Account list');
  
  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];
  
  if (accountsPage.length === 0) {
    console.log('No accounts found, returning empty result');
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: { 
        company, 
        branch, 
        account: account ? account.toString() : null,
        startDate, 
        endDate, 
        transactionType: transactionType || 'all', 
        searchTerm: searchTerm || null 
      }
    };
  }
  
  const accountIds = accountsPage.map(row => row._id.toString());
  const accountIdObjs = accountIds.map(id => toObjectId(id));
  
  console.log('Processing', accountIds.length, 'accounts');
  
  // -----------------------------------------------------------------------
  // QUERY 2: Calculate opening balances (dirty period)
  // Uses getBatchOpeningBalances which handles snapshots + movements
  // -----------------------------------------------------------------------
  console.time('Query 2 - Calculate opening balances');
  const openingBalances = await getBatchOpeningBalances(company, branch, accountIds, startDate);
  console.timeEnd('Query 2 - Calculate opening balances');
  
  // -----------------------------------------------------------------------
  // QUERY 3: Simple ledger for report period (NO adjustments)
  // Same as fast path - no $lookup needed since no adjustments
  // -----------------------------------------------------------------------
  console.time('Query 3 - Simple ledger for report period');
  const { debitCondition, creditCondition } = getDebitCreditConditions(transactionType);
  
  const ledgers = await AccountLedger.aggregate([
    { $match: { ...baseMatch, account: { $in: accountIdObjs } } },
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    {
      $group: {
        _id: '$account',
        transactions: { $push: '$$ROOT' },
        totalDebit: {
          $sum: {
            $cond: [debitCondition, '$amount', 0]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [creditCondition, '$amount', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  console.timeEnd('Query 3 - Simple ledger for report period');
  console.log('Ledger data processed for', ledgers.length, 'accounts');
  
  // Build ledger map
  const ledgerMap = {};
  ledgers.forEach(item => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty = openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);
    
    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0
      },
      transactions: item.transactions
    };
  });
  
  // Handle accounts with no transactions in the period
  accountIds.forEach(id => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0
        },
        transactions: []
      };
    }
  });
  
  // Combine results
  const ledgersPerAccount = accountsPage.map(row => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    return {
      accountId: row._id,
      accountName: row.accountName,
      openingBalance: data.openingBalance,
      summary: data.summary,
      transactions: data.transactions
    };
  });
  
  const totalTime = Date.now() - reportStartTime;
  console.log(`getHybridLedgerReport HYBRID PATH END - ${totalTime}ms`);
  
  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || 'all',
      searchTerm: searchTerm || null
    }
  };
};

/**
 * PATH 3: FULL REFOLD (300-350ms)
 * 
 * Used when:
 * - Accounts missing monthly balance data
 * - OR adjustments exist in report period
 * 
 * Process:
 * 1. Calculate opening balances (handles dirty period)
 * 2. Get ledger data WITH $lookup to adjustments (expensive!)
 * 3. Apply adjustment deltas to calculate effective values
 * 4. Calculate summaries
 */
export const refoldLedgersWithAdjustments = async (
  company, 
  branch, 
  startDate, 
  endDate, 
  transactionType = null, 
  page = 1, 
  limit = 50, 
  searchTerm = null,
  account = null
) => {
  console.log('refoldLedgersWithAdjustments FULL REFOLD START');
  const reportStartTime = Date.now();
  
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};
  
  const baseMatch = { 
    company: companyId, 
    branch: branchId, 
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter
  };
  
  if (transactionType === 'sale') {
    baseMatch.transactionType = { $in: ['sale', 'purchase_return'] };
  } else if (transactionType === 'purchase') {
    baseMatch.transactionType = { $in: ['purchase', 'sales_return'] };
  }
  
  let searchStage = [];
  if (searchTerm && !account) {
    const regex = new RegExp(searchTerm, 'i');
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }
  
  // -----------------------------------------------------------------------
  // QUERY 1: Get paginated account list (same as other paths)
  // -----------------------------------------------------------------------
  console.time('Query 1 - Account list');
  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$account', accountName: { $first: '$accountName' } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: 'totalItems' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    }
  ]);
  console.timeEnd('Query 1 - Account list');
  
  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];
  
  if (accountsPage.length === 0) {
    console.log('No accounts found, returning empty result');
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: { 
        company, 
        branch, 
        account: account ? account.toString() : null,
        startDate, 
        endDate, 
        transactionType: transactionType || 'all', 
        searchTerm: searchTerm || null 
      }
    };
  }
  
  const accountIds = accountsPage.map(row => row._id.toString());
  
  console.log('Processing', accountIds.length, 'accounts');
  
  // -----------------------------------------------------------------------
  // QUERY 2: Calculate opening balances
  // -----------------------------------------------------------------------
  console.time('Query 2 - Calculate opening balances');
  const openingBalances = await getBatchOpeningBalances(company, branch, accountIds, startDate);
  console.timeEnd('Query 2 - Calculate opening balances');
  
  // -----------------------------------------------------------------------
  // QUERY 3: Get adjusted ledger data (FULL lookup to adjustments)
  // This is expensive but necessary when adjustments exist
  // -----------------------------------------------------------------------
  console.time('Query 3 - Adjusted ledger data');
  const ledgerMap = await getBatchAdjustedLedgers(
    companyId,
    branchId,
    accountIds,
    startDate,
    endDate,
    openingBalances,
    transactionType
  );
  console.timeEnd('Query 3 - Adjusted ledger data');
  
  // Combine results
  const ledgersPerAccount = accountsPage.map(row => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    return {
      accountId: row._id,
      accountName: row.accountName,
      openingBalance: data.openingBalance,
      summary: data.summary,
      transactions: data.transactions
    };
  });
  
  const totalTime = Date.now() - reportStartTime;
  console.log(`refoldLedgersWithAdjustments FULL REFOLD END - ${totalTime}ms`);
  
  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || 'all',
      searchTerm: searchTerm || null
    }
  };
};
