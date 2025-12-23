// controllers/AccountLedgerController.js
import {
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
} from '../../services/accountLeger/accountLegerService.js';
import AccountLedger from '../../model/AccountLedgerModel.js';


const toObjectId = (id) => new mongoose.Types.ObjectId(id);

export const getAccountSummaryReport = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // STEP 1: Extract and validate parameters
    const { 
      startDate, 
      endDate, 
      company, 
      branch, 
      account,        // ✅ NEW: Single account ID (optional)
      transactionType, 
      page = 1, 
      limit = 50, 
      searchTerm 
    } = req.query;
    
    if (!startDate || !endDate || !company || !branch) {
      return res.status(400).json({ error: 'Missing required parameters: startDate, endDate, company, branch' });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const singleAccount = account ? toObjectId(account) : null; // ✅ Single account mode

    // STEP 2: Get account IDs for dirty check
    const baseMatch = { 
      company, 
      branch,
      transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate }
    };
    
    if (singleAccount) {
      baseMatch.account = singleAccount; // ✅ Single account filter
    }
    if (transactionType === 'sale') baseMatch.transactionType = { $in: ['sale', 'purchase_return'] };
    else if (transactionType === 'purchase') baseMatch.transactionType = { $in: ['purchase', 'sales_return'] };

    const accountIdsForCheck = await AccountLedger.distinct('account', baseMatch);
    
    if (accountIdsForCheck.length === 0) {
      return res.json({
        items: [],
        pagination: { page: pageNum, limit: limitNum, totalItems: 0, totalPages: 0 },
        filters: { 
          company, 
          branch, 
          account: singleAccount ? singleAccount.toString() : null,
          startDate: parsedStartDate, 
          endDate: parsedEndDate, 
          transactionType: transactionType || 'all', 
          searchTerm: searchTerm || null 
        }
      });
    }

    // STEP 3: Check dirty period status
    const dirtyStatus = await checkIfDirtyPeriodExists(
      company, 
      branch, 
      accountIdsForCheck.map(id => id.toString()),
      parsedStartDate, 
      parsedEndDate
    );

    let serviceResult;
    let pathUsed;

    // STEP 4: Route to appropriate service PATH
    if (!dirtyStatus.isDirty) {
      console.log('Using FAST PATH');
      pathUsed = 'FASTPATH';
      serviceResult = await getSimpleLedgerReport(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, pageNum, limitNum, searchTerm?.trim() || null,
        singleAccount // ✅ Pass single account
      );
    } 
    else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
      console.log('Using HYBRID PATH (opening calc + simple ledger)');
      pathUsed = 'HYBRIDPATH';
      serviceResult = await getHybridLedgerReport(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, pageNum, limitNum, searchTerm?.trim() || null,
        singleAccount
      );
    } 
    else {
      console.log('Using FULL REFOLD');
      pathUsed = 'FULLREFOLD';
      serviceResult = await refoldLedgersWithAdjustments(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, pageNum, limitNum, searchTerm?.trim() || null,
        singleAccount
      );
    }

    // STEP 5: Shape response
    const shapedItems = serviceResult.items.map(item => ({
      accountId: item.accountId,
      accountName: item.accountName,
      openingBalance: item.openingBalance,
      summary: {
        totalDebit: item.summary.totalDebit,
        totalCredit: item.summary.totalCredit,
        closingBalance: item.summary.closingBalance,
        transactionCount: item.summary.transactionCount
      },
      transactions: item.transactions
    }));

    const executionTime = Date.now() - startTime;
    console.log(`Account Summary Report - ${shapedItems.length} accounts in ${executionTime}ms [${pathUsed}]${singleAccount ? ' (SINGLE)' : ''}`);

    res.json({
      items: shapedItems,
      pagination: serviceResult.pagination,
      filters: {
        ...serviceResult.filters,
        account: singleAccount ? singleAccount.toString() : null
      },
      ...(process.env.NODE_ENV === 'development' && {
        debug: { executionTimeMs: executionTime, pathUsed, reason: dirtyStatus.reason }
      })
    });

  } catch (error) {
    console.error('getAccountSummaryReport error:', error);
    res.status(500).json({ 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

