import AccountLedger from "../../model/AccountLedgerModel.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import AccountMaster from "../../model/masters/AccountMasterModel.js";


export const getAccountLedgerReport = async (req, res) => {
  try {
    const {
      companyId,
      branchId,
      accountId,
      startDate,
      endDate,
      page = 1,
      limit = 200,
    } = req.query;

    if (!companyId || !branchId ) {
      return res.status(400).json({
        success: false,
        message: "companyId, branchId and accountId are required",
      });
    }

    // Build query
    const query = {
      company: companyId,
      branch: branchId,
    //   account: accountId,
    };
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lt = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000); // End of day
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // 1. Get total count for pagination
    const totalCount = await AccountLedger.countDocuments(query);
    
    // 2. Fetch records with chronological sort
    const docs = await AccountLedger.find(query)
  .sort({ accountName: 1, account: 1, transactionDate: 1, createdAt: 1 }) // 👈       .skip(skip)
      .limit(Number(limit))
      .lean();

    // 3. GROUP same accounts together (add group info)
    const groupedData = [];
    let currentAccountGroup = null;
    let groupIndex = 0;

    docs.forEach((doc, index) => {
      const accountGroupKey = `${doc.accountName}-${doc.account}`;
      
      if (currentAccountGroup !== accountGroupKey) {
        // New account group
        currentAccountGroup = accountGroupKey;
        groupIndex++;
      }

      groupedData.push({
        ...doc,
        accountGroupKey, // For frontend grouping
        isGroupStart: index === 0 || docs[index-1]?.accountGroupKey !== accountGroupKey,
        groupIndex,
        totalCount,
      });
    });

    res.json({
      success: true,
      data: groupedData,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        currentRecords: groupedData.length,
      },
    });
  } catch (error) {
    console.error("Account Ledger report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account ledger",
      error: error.message,
    });
  }
};



export const getAccountMonthlySummary = async (req, res) => {
  try {
    const {
      companyId,
      branchId,
      accountId,
      year,
      page = 1,
      limit = 200,
    } = req.query;

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "companyId and branchId are required",
      });
    }

    // Build query
    const query = {
      company: companyId,
      branch: branchId,
    };

    if (accountId) {
      query.account = accountId;
    }
    if (year) {
      query.year = Number(year);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const totalCount = await AccountMonthlyBalance.countDocuments(query);

    const docs = await AccountMonthlyBalance.find(query)
      .populate({
        path: 'account',
        select: 'accountName accountCode',
        model: AccountMaster,
      })
      .sort({ account: 1, year: 1, month: 1 }) // 👈 GROUP BY ACCOUNT FIRST
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // 👈 ADD GROUPING LOGIC
    const enrichedData = [];
    let currentAccountGroup = null;
    let groupIndex = 0;

    docs.forEach((doc, index) => {
      const accountGroupKey = `${doc.accountName || doc.account?.accountName}-${doc.account}`;
      
      // New account group detected
      if (currentAccountGroup !== accountGroupKey) {
        currentAccountGroup = accountGroupKey;
        groupIndex++;
      }

      enrichedData.push({
        accountName: doc.accountName || doc.account?.accountName || "Unknown Account",
        accountCode: doc.account?.accountCode || "",
        accountId: doc.account?._id || doc.account,
        branchName: doc.branchName || "Main Branch",
        year: doc.year,
        month: doc.month,
        periodKey: doc.periodKey,
        openingBalance: doc.openingBalance || 0,
        totalDebit: doc.totalDebit || 0,
        totalCredit: doc.totalCredit || 0,
        closingBalance: doc.closingBalance || 0,
        transactionCount: doc.transactionCount || 0,
        needsRecalculation: doc.needsRecalculation || false,
        isClosed: doc.isClosed || false,
        lastUpdated: doc.lastUpdated,
        
        // 👈 GROUPING FIELDS FOR FRONTEND
        accountGroupKey,
        isGroupStart: index === 0 || docs[index-1]?.account !== doc.account,
        groupIndex,
        totalCount,
      });
    });

    res.json({
      success: true,
      data: enrichedData,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        currentRecords: enrichedData.length,
      },
    });
  } catch (error) {
    console.error("Account Monthly Summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account monthly summary",
      error: error.message,
    });
  }
};

