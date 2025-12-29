// services/accountLedgerService.js
import mongoose from "mongoose";
import AccountLedger from "../../model/AccountLedgerModel.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import AdjustmentEntry from "../../model/AdjustmentEntryModel.js";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// =============================================================================
// CORE UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate opening balances for multiple accounts at once (BATCHED)
 */
export const getBatchOpeningBalances = async (
  company,
  branch,
  accountIds,
  selectedDate
) => {
  console.log("getBatchOpeningBalances START", {
    company,
    branch,
    accountIdsCount: accountIds.length,
    selectedDate: selectedDate?.toISOString(),
  });

  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");

  if (
    !selectedDate ||
    isNaN(selectedDate.getTime()) ||
    selectedDate < BASE_START_DATE
  ) {
    console.log("Early return: Invalid or pre-base date detected");
    return accountIds.reduce((acc, id) => ({ ...acc, [id.toString()]: 0 }), {});
  }

  const prevMonthDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() - 1,
    1
  );
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;

  console.log("Calculated previous month:", { prevYear, prevMonthNum });

  // STEP 1: Get last CLEAN monthly balance
  console.time("Step 1 - Monthly balances query");
  const monthlyBalances = await AccountMonthlyBalance.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        account: { $in: accountIdObjs },
        needsRecalculation: false,
        $or: [
          { year: { $lt: prevYear } },
          { year: prevYear, month: { $lte: prevMonthNum } },
        ],
      },
    },
    { $sort: { account: 1, year: -1, month: -1 } },
    {
      $group: {
        _id: "$account",
        closingBalance: { $first: "$closingBalance" },
        year: { $first: "$year" },
        month: { $first: "$month" },
      },
    },
  ]);
  console.timeEnd("Step 1 - Monthly balances query");
  console.log("Monthly balances found:", monthlyBalances.length);

  // STEP 2: Fallback to AccountMaster
  const accountsWithBalances = monthlyBalances.map((m) => m._id.toString());
  const accountsNeedingMaster = accountIdObjs.filter(
    (id) => !accountsWithBalances.includes(id.toString())
  );

  console.log("Accounts needing master lookup:", accountsNeedingMaster.length);

  let masterBalances = [];
  if (accountsNeedingMaster.length > 0) {
    console.time("Step 2 - Account master query");
    masterBalances = await AccountMasterModel.aggregate([
      { $match: { _id: { $in: accountsNeedingMaster }, company: companyId } },
      { $project: { _id: 1, openingBalance: 1 } },
    ]);
    console.timeEnd("Step 2 - Account master query");
    console.log("Master balances found:", masterBalances.length);
  }

  // STEP 3: Build base balances
  console.log("Step 3: Building base balances map");
  const baseBalances = {};
  const dirtyPeriodStarts = {};

  monthlyBalances.forEach((mb) => {
    const accountKey = mb._id.toString();
    baseBalances[accountKey] = mb.closingBalance || 0;
    dirtyPeriodStarts[accountKey] = new Date(mb.year, mb.month, 1);
  });

  masterBalances.forEach((master) => {
    const accountKey = master._id.toString();
    baseBalances[accountKey] = master.openingBalance || 0;
    dirtyPeriodStarts[accountKey] = BASE_START_DATE;
  });

  accountIdObjs.forEach((id) => {
    const accountKey = id.toString();
    if (!baseBalances[accountKey]) {
      baseBalances[accountKey] = 0;
      dirtyPeriodStarts[accountKey] = BASE_START_DATE;
    }
  });

  console.log("Base balances initialized:", Object.keys(baseBalances).length);

  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);

  // STEP 4: Get ledger movements
  console.time("Step 4 - Ledger movements query");
  const ledgerMatchConditions = accountIdObjs.map((id) => {
    const accountKey = id.toString();
    const startDate = dirtyPeriodStarts[accountKey] || BASE_START_DATE;
    return {
      account: id,
      transactionDate: {
        $gte: startDate,
        $lt: dirtyPeriodEnd,
      },
    };
  });

  const ledgerMovements = await AccountLedger.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        $or: ledgerMatchConditions,
      },
    },
    {
      $addFields: {
        signedAmount: {
          $multiply: [
            "$amount",
            { $cond: [{ $eq: ["$ledgerSide", "debit"] }, 1, -1] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$account",
        totalSignedAmount: { $sum: "$signedAmount" },
        transactionCount: { $sum: 1 },
      },
    },
  ]);
  console.timeEnd("Step 4 - Ledger movements query");
  console.log("Ledger movements found:", ledgerMovements.length);

  // STEP 5: Get adjustments
  console.time("Step 5 - Adjustment movements query");
  const adjustmentMatchConditions = accountIdObjs.map((id) => ({
    affectedAccount: id,
    originalTransactionDate: {
      $gte: BASE_START_DATE,
      $lt: selectedDate,
    },
  }));

  const adjustmentMovements = await AdjustmentEntry.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        $or: adjustmentMatchConditions,
        status: "active",
        isReversed: false,
      },
    },
    {
      $group: {
        _id: "$affectedAccount",
        totalAmountDelta: { $sum: "$amountDelta" },
      },
    },
  ]);
  console.timeEnd("Step 5 - Adjustment movements query");
  console.log("Adjustment movements found:", adjustmentMovements.length);

  // STEP 6: Combine all data
  console.log("Step 6: Combining all data");
  const finalBalances = {};

  accountIdObjs.forEach((id) => {
    const accountKey = id.toString();
    let balance = baseBalances[accountKey] || 0;

    const ledgerMove = ledgerMovements.find(
      (l) => l._id.toString() === accountKey
    );
    if (ledgerMove) balance += ledgerMove.totalSignedAmount;

    const adjMove = adjustmentMovements.find(
      (a) => a._id.toString() === accountKey
    );
    if (adjMove) balance += adjMove.totalAmountDelta;

    finalBalances[accountKey] = balance;
  });

  console.log("Final balances computed:", Object.keys(finalBalances).length);
  console.log("getBatchOpeningBalances END");

  return finalBalances;
};

/**
 * Check if dirty period exists
 */
export const checkIfDirtyPeriodExists = async (
  company,
  branch,
  accountIds,
  startDate,
  endDate
) => {
  console.log("Checking dirty period status");

  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const reportStartDate = new Date(startDate);
  const prevMonthDate = new Date(
    reportStartDate.getFullYear(),
    reportStartDate.getMonth() - 1,
    1
  );
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;

  const cleanMonthlyBalances = await AccountMonthlyBalance.countDocuments({
    company: companyId,
    branch: branchId,
    account: { $in: accountIdObjs },
    year: prevYear,
    month: prevMonthNum,
    needsRecalculation: false,
  });

  if (cleanMonthlyBalances !== accountIds.length) {
    return {
      isDirty: true,
      needsFullRefold: true,
      reason: "Missing or dirty monthly balances",
    };
  }

  const adjustmentsInPeriod = await AdjustmentEntry.countDocuments({
    company: companyId,
    branch: branchId,
    originalTransactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    status: "active",
    isReversed: false,
  });

  if (adjustmentsInPeriod > 0) {
    return {
      isDirty: true,
      needsFullRefold: true,
      reason: "Adjustments in report period",
    };
  }

  if (reportStartDate.getDate() !== 1) {
    return { isDirty: true, needsFullRefold: false, reason: "Mid-month start" };
  }

  return { isDirty: false, needsFullRefold: false, reason: "Clean path" };
};

/**
 * Get adjusted ledgers with adjustments (FULL REFOLD)
 */
export const getBatchAdjustedLedgers = async (
  companyId,
  branchId,
  accountIds,
  startDate,
  endDate,
  openingBalances,
  transactionType = null,
  summaryOnly = false
) => {
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const baseMatch = {
    company: companyId,
    branch: branchId,
    account: { $in: accountIdObjs },
    transactionDate: { $gte: startDate, $lte: endDate },
  };

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  const ledgers = await AccountLedger.aggregate([
    { $match: baseMatch },
    {
      $lookup: {
        from: "adjustment_entries",
        let: {
          txnNum: "$transactionNumber",
          company: "$company",
          branch: "$branch",
          account: "$account",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$company", "$$company"] },
                  { $eq: ["$branch", "$$branch"] },
                  { $eq: ["$originalTransactionNumber", "$$txnNum"] },
                  { $eq: ["$affectedAccount", "$$account"] },
                  { $eq: ["$status", "active"] },
                  { $eq: ["$isReversed", false] },
                ],
              },
            },
          },
          { $group: { _id: null, totalAmountDelta: { $sum: "$amountDelta" } } },
        ],
        as: "adjustments",
      },
    },
    {
      $addFields: {
        totalAmountDelta: {
          $ifNull: [{ $arrayElemAt: ["$adjustments.totalAmountDelta", 0] }, 0],
        },
        effectiveAmount: {
          $add: [
            "$amount",
            {
              $ifNull: [
                { $arrayElemAt: ["$adjustments.totalAmountDelta", 0] },
                0,
              ],
            },
          ],
        },
        signedAmount: {
          $multiply: [
            {
              $add: [
                "$amount",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$adjustments.totalAmountDelta", 0] },
                    0,
                  ],
                },
              ],
            },
            { $cond: [{ $eq: ["$ledgerSide", "debit"] }, 1, -1] },
          ],
        },
      },
    },
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    {
      $group: {
        _id: "$account",
        ...(summaryOnly ? {} : { transactions: { $push: "$$ROOT" } }),

        totalSale: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "sale"] },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalPurchase: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "purchase"] },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalSalesReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "sales_return"] },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalPurchaseReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "purchase_return"] },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalPayment: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "payment"] },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalReceipt: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "receipt"] },
              "$effectiveAmount",
              0,
            ],
          },
        },

        totalDebit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["sale", "purchase_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["sale", "purchase_return", "payment"],
                    ],
                  },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["purchase", "sales_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["purchase", "sales_return", "receipt"],
                    ],
                  },
              "$effectiveAmount",
              0,
            ],
          },
        },
      },
    },
  ]);

  console.log("sldfledgers", ledgers);

  const ledgerMap = {};

  ledgers.forEach((item) => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty =
      openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);

    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0,
        breakdown: {
          sale: item.totalSale || 0,
          purchase: item.totalPurchase || 0,
          salesReturn: item.totalSalesReturn || 0,
          purchaseReturn: item.totalPurchaseReturn || 0,
          payment: item.totalPayment || 0,
          receipt: item.totalReceipt || 0,
        },
      },
      ...(summaryOnly ? {} : { transactions: item.transactions }),
    };
  });

  accountIds.forEach((id) => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0,
          breakdown: {
            sale: 0,
            purchase: 0,
            salesReturn: 0,
            purchaseReturn: 0,
            payment: 0,
            receipt: 0,
          },
        },
        ...(summaryOnly ? {} : { transactions: [] }),
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
  account = null,
  summaryOnly = false
) => {
  console.log("getSimpleLedgerReport FAST PATH START");
  const reportStartTime = Date.now();

  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};

  const baseMatch = {
    company: companyId,
    branch: branchId,
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter,
  };

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  let searchStage = [];
  if (searchTerm && !account) {
    const regex = new RegExp(searchTerm, "i");
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }

  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: "$account", accountName: { $first: "$accountName" } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: "totalItems" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];

  if (accountsPage.length === 0) {
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: {
        company,
        branch,
        account: account ? account.toString() : null,
        startDate,
        endDate,
        transactionType: transactionType || "all",
        searchTerm: searchTerm || null,
        summaryOnly,
      },
    };
  }

  const accountIds = accountsPage.map((row) => row._id.toString());
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const accountContacts = await AccountMasterModel.aggregate([
    { $match: { _id: { $in: accountIdObjs }, company: companyId } },
    { $project: { _id: 1, email: 1, phoneNo: 1 } },
  ]);

  const contactMap = {};
  accountContacts.forEach((ac) => {
    contactMap[ac._id.toString()] = {
      email: ac.email || null,
      phoneNo: ac.phoneNo || null,
    };
  });

  const prevMonthDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() - 1,
    1
  );
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
        needsRecalculation: false,
      },
    },
    { $project: { _id: 0, account: "$account", closingBalance: 1 } },
  ]);

  const openingBalances = {};
  monthlyBalances.forEach((mb) => {
    openingBalances[mb.account.toString()] = mb.closingBalance || 0;
  });
  accountIdObjs.forEach((id) => {
    const accountKey = id.toString();
    if (!openingBalances[accountKey]) openingBalances[accountKey] = 0;
  });

  const ledgers = await AccountLedger.aggregate([
    { $match: { ...baseMatch, account: { $in: accountIdObjs } } },
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    {
      $group: {
        _id: "$account",
        ...(summaryOnly ? {} : { transactions: { $push: "$$ROOT" } }),

        totalSale: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "sale"] }, "$amount", 0],
          },
        },
        totalPurchase: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "purchase"] }, "$amount", 0],
          },
        },
        totalSalesReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "sales_return"] },
              "$amount",
              0,
            ],
          },
        },
        totalPurchaseReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "purchase_return"] },
              "$amount",
              0,
            ],
          },
        },
        totalPayment: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "payment"] }, "$amount", 0],
          },
        },
        totalReceipt: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "receipt"] }, "$amount", 0],
          },
        },

        totalDebit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["sale", "purchase_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["sale", "purchase_return", "payment"],
                    ],
                  },
              "$amount",
              0,
            ],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["purchase", "sales_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["purchase", "sales_return", "receipt"],
                    ],
                  },
              "$amount",
              0,
            ],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const ledgerMap = {};
  ledgers.forEach((item) => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty =
      openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);

    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0,
        breakdown: {
          sale: item.totalSale || 0,
          purchase: item.totalPurchase || 0,
          salesReturn: item.totalSalesReturn || 0,
          purchaseReturn: item.totalPurchaseReturn || 0,
          payment: item.totalPayment || 0,
          receipt: item.totalReceipt || 0,
        },
      },
      ...(summaryOnly ? {} : { transactions: item.transactions }),
    };
  });

  accountIds.forEach((id) => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0,
          breakdown: {
            sale: 0,
            purchase: 0,
            salesReturn: 0,
            purchaseReturn: 0,
            payment: 0,
            receipt: 0,
          },
        },
        ...(summaryOnly ? {} : { transactions: [] }),
      };
    }
  });

  const ledgersPerAccount = accountsPage.map((row) => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    const contact = contactMap[accountKey] || { email: null, phoneNo: null };

    return {
      accountId: row._id,
      accountName: row.accountName,
      email: contact.email,
      phoneNo: contact.phoneNo,
      openingBalance: data.openingBalance,
      summary: data.summary,
      ...(summaryOnly ? {} : { transactions: data.transactions }),
    };
  });

  const totalTime = Date.now() - reportStartTime;
  console.log(`FAST PATH END - ${totalTime}ms`);

  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || "all",
      searchTerm: searchTerm || null,
      summaryOnly,
    },
  };
};

/**
 * PATH 2: HYBRID PATH (220-280ms)
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
  account = null,
  summaryOnly = false
) => {
  console.log("getHybridLedgerReport HYBRID PATH START");
  const reportStartTime = Date.now();

  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};

  const baseMatch = {
    company: companyId,
    branch: branchId,
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter,
  };

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  let searchStage = [];
  if (searchTerm && !account) {
    const regex = new RegExp(searchTerm, "i");
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }

  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: "$account", accountName: { $first: "$accountName" } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: "totalItems" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];

  if (accountsPage.length === 0) {
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: {
        company,
        branch,
        account: account ? account.toString() : null,
        startDate,
        endDate,
        transactionType: transactionType || "all",
        searchTerm: searchTerm || null,
        summaryOnly,
      },
    };
  }

  const accountIds = accountsPage.map((row) => row._id.toString());
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const accountContacts = await AccountMasterModel.aggregate([
    { $match: { _id: { $in: accountIdObjs }, company: companyId } },
    { $project: { _id: 1, email: 1, phoneNo: 1 } },
  ]);

  const contactMap = {};
  accountContacts.forEach((ac) => {
    contactMap[ac._id.toString()] = {
      email: ac.email || null,
      phoneNo: ac.phoneNo || null,
    };
  });

  const openingBalances = await getBatchOpeningBalances(
    company,
    branch,
    accountIds,
    startDate
  );

  const ledgers = await AccountLedger.aggregate([
    { $match: { ...baseMatch, account: { $in: accountIdObjs } } },
    { $sort: { account: 1, transactionDate: 1, createdAt: 1 } },
    {
      $group: {
        _id: "$account",
        ...(summaryOnly ? {} : { transactions: { $push: "$$ROOT" } }),

        totalSale: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "sale"] }, "$amount", 0],
          },
        },
        totalPurchase: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "purchase"] }, "$amount", 0],
          },
        },
        totalSalesReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "sales_return"] },
              "$amount",
              0,
            ],
          },
        },
        totalPurchaseReturn: {
          $sum: {
            $cond: [
              { $eq: ["$transactionType", "purchase_return"] },
              "$amount",
              0,
            ],
          },
        },
        totalPayment: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "payment"] }, "$amount", 0],
          },
        },
        totalReceipt: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "receipt"] }, "$amount", 0],
          },
        },

        totalDebit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["sale", "purchase_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["sale", "purchase_return", "payment"],
                    ],
                  },
              "$effectiveAmount",
              0,
            ],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [
              transactionType
                ? { $in: ["$transactionType", ["purchase", "sales_return"]] }
                : {
                    $in: [
                      "$transactionType",
                      ["purchase", "sales_return", "receipt"],
                    ],
                  },
              "$effectiveAmount",
              0,
            ],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const ledgerMap = {};
  ledgers.forEach((item) => {
    const accountKey = item._id.toString();
    const openingQty = openingBalances[accountKey] || 0;
    const closingQty =
      openingQty + (item.totalDebit || 0) - (item.totalCredit || 0);

    ledgerMap[accountKey] = {
      openingBalance: openingQty,
      summary: {
        totalDebit: item.totalDebit || 0,
        totalCredit: item.totalCredit || 0,
        closingBalance: closingQty,
        transactionCount: item.transactionCount || 0,
        breakdown: {
          sale: item.totalSale || 0,
          purchase: item.totalPurchase || 0,
          salesReturn: item.totalSalesReturn || 0,
          purchaseReturn: item.totalPurchaseReturn || 0,
          payment: item.totalPayment || 0,
          receipt: item.totalReceipt || 0,
        },
      },
      ...(summaryOnly ? {} : { transactions: item.transactions }),
    };
  });

  accountIds.forEach((id) => {
    const accountKey = id.toString();
    if (!ledgerMap[accountKey]) {
      const openingQty = openingBalances[accountKey] || 0;
      ledgerMap[accountKey] = {
        openingBalance: openingQty,
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: openingQty,
          transactionCount: 0,
          breakdown: {
            sale: 0,
            purchase: 0,
            salesReturn: 0,
            purchaseReturn: 0,
            payment: 0,
            receipt: 0,
          },
        },
        ...(summaryOnly ? {} : { transactions: [] }),
      };
    }
  });

  const ledgersPerAccount = accountsPage.map((row) => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    const contact = contactMap[accountKey] || { email: null, phoneNo: null };

    return {
      accountId: row._id,
      accountName: row.accountName,
      email: contact.email,
      phoneNo: contact.phoneNo,
      openingBalance: data.openingBalance,
      summary: data.summary,
      ...(summaryOnly ? {} : { transactions: data.transactions }),
    };
  });

  const totalTime = Date.now() - reportStartTime;
  console.log(`HYBRID PATH END - ${totalTime}ms`);

  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || "all",
      searchTerm: searchTerm || null,
      summaryOnly,
    },
  };
};

/**
 * PATH 3: FULL REFOLD (350-450ms)
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
  account = null,
  summaryOnly = false
) => {
  console.log("refoldLedgersWithAdjustments FULL REFOLD START");
  const reportStartTime = Date.now();

  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const singleAccountFilter = account ? { account } : {};

  const baseMatch = {
    company: companyId,
    branch: branchId,
    transactionDate: { $gte: startDate, $lte: endDate },
    ...singleAccountFilter,
  };

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  let searchStage = [];
  if (searchTerm && !account) {
    const regex = new RegExp(searchTerm, "i");
    searchStage = [{ $match: { $or: [{ accountName: regex }] } }];
  }

  const itemFacet = await AccountLedger.aggregate([
    { $match: baseMatch },
    { $group: { _id: "$account", accountName: { $first: "$accountName" } } },
    ...searchStage,
    { $sort: { accountName: 1 } },
    {
      $facet: {
        meta: [{ $count: "totalItems" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const accountsPage = itemFacet[0]?.data || [];

  if (accountsPage.length === 0) {
    return {
      items: [],
      pagination: { page, limit, totalItems: 0, totalPages: 0 },
      filters: {
        company,
        branch,
        account: account ? account.toString() : null,
        startDate,
        endDate,
        transactionType: transactionType || "all",
        searchTerm: searchTerm || null,
        summaryOnly,
      },
    };
  }

  const accountIds = accountsPage.map((row) => row._id.toString());
  const accountIdObjs = accountIds.map((id) => toObjectId(id));

  const accountContacts = await AccountMasterModel.aggregate([
    { $match: { _id: { $in: accountIdObjs }, company: companyId } },
    { $project: { _id: 1, email: 1, phoneNo: 1 } },
  ]);

  const contactMap = {};
  accountContacts.forEach((ac) => {
    contactMap[ac._id.toString()] = {
      email: ac.email || null,
      phoneNo: ac.phoneNo || null,
    };
  });

  const openingBalances = await getBatchOpeningBalances(
    company,
    branch,
    accountIds,
    startDate
  );

  const ledgerMap = await getBatchAdjustedLedgers(
    companyId,
    branchId,
    accountIds,
    startDate,
    endDate,
    openingBalances,
    transactionType,
    summaryOnly
  );

  const ledgersPerAccount = accountsPage.map((row) => {
    const accountKey = row._id.toString();
    const data = ledgerMap[accountKey];
    const contact = contactMap[accountKey] || { email: null, phoneNo: null };

    return {
      accountId: row._id,
      accountName: row.accountName,
      email: contact.email,
      phoneNo: contact.phoneNo,
      openingBalance: data.openingBalance,
      summary: data.summary,
      ...(summaryOnly ? {} : { transactions: data.transactions }),
    };
  });

  const totalTime = Date.now() - reportStartTime;
  console.log(`FULL REFOLD END - ${totalTime}ms`);

  return {
    items: ledgersPerAccount,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
    filters: {
      company,
      branch,
      account: account ? account.toString() : null,
      startDate,
      endDate,
      transactionType: transactionType || "all",
      searchTerm: searchTerm || null,
      summaryOnly,
    },
  };
};
