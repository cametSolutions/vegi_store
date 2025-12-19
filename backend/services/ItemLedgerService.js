// services/ItemLedgerService.js
import mongoose from "mongoose";
import ItemLedger from "../model/ItemsLedgerModel.js";
import ItemMonthlyBalance from "../model/ItemMonthlyBalanceModel.js";
import AdjustmentEntry from "../model/AdjustmentEntryModel.js";
import ItemMasterModel from "../model/masters/ItemMasterModel.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/* =========================================================================
   1️⃣ BATCHED Opening Balance (ALL items at once)
   ========================================================================= */

export const getBatchOpeningBalances = async (
  company,
  branch,
  itemIds,
  selectedDate
) => {
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const itemIdObjs = itemIds.map((id) => toObjectId(id));

  const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");

  if (
    !selectedDate ||
    isNaN(selectedDate.getTime()) ||
    selectedDate < BASE_START_DATE
  ) {
    return itemIds.reduce((acc, id) => ({ ...acc, [id.toString()]: 0 }), {});
  }

  const prevMonthDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() - 1,
    1
  );
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;

  // Step 1: Get monthly balances for ALL items in ONE query
  const monthlyBalances = await ItemMonthlyBalance.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        item: { $in: itemIdObjs },
        needsRecalculation: false,
        $or: [
          { year: { $lt: prevYear } },
          { year: prevYear, month: { $lte: prevMonthNum } },
        ],
      },
    },
    {
      $sort: { item: 1, year: -1, month: -1 },
    },
    {
      $group: {
        _id: "$item",
        closingStock: { $first: "$closingStock" },
        year: { $first: "$year" },
        month: { $first: "$month" },
      },
    },
  ]);

  // Step 2: Get item masters for items WITHOUT monthly balances
  const itemsWithBalances = monthlyBalances.map((m) => m._id.toString());
  const itemsNeedingMaster = itemIdObjs.filter(
    (id) => !itemsWithBalances.includes(id.toString())
  );

  let masterBalances = [];
  if (itemsNeedingMaster.length > 0) {
    masterBalances = await ItemMasterModel.aggregate([
      {
        $match: {
          _id: { $in: itemsNeedingMaster },
          company: companyId,
        },
      },
      { $unwind: "$stock" },
      {
        $match: {
          "stock.branch": branchId,
        },
      },
      {
        $project: {
          _id: 1,
          openingStock: "$stock.openingStock",
        },
      },
    ]);
  }

  // Step 3: Build base balances map
  const baseBalances = {};
  const dirtyPeriodStarts = {};

  monthlyBalances.forEach((mb) => {
    const itemKey = mb._id.toString();
    baseBalances[itemKey] = mb.closingStock || 0;
    dirtyPeriodStarts[itemKey] = new Date(mb.year, mb.month, 1);
  });

  masterBalances.forEach((master) => {
    const itemKey = master._id.toString();
    baseBalances[itemKey] = master.openingStock || 0;
    dirtyPeriodStarts[itemKey] = BASE_START_DATE;
  });

  // Initialize items with no data
  itemIdObjs.forEach((id) => {
    const itemKey = id.toString();
    if (!baseBalances[itemKey]) {
      baseBalances[itemKey] = 0;
      dirtyPeriodStarts[itemKey] = BASE_START_DATE;
    }
  });

  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);

  // Step 4: Get ledger movements for ALL items in ONE query
  const ledgerMovements = await ItemLedger.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        item: { $in: itemIdObjs },
        transactionDate: {
          $gte: BASE_START_DATE,
          $lt: dirtyPeriodEnd,
        },
      },
    },
    {
      $addFields: {
        signedQuantity: {
          $multiply: [
            "$quantity",
            { $cond: [{ $eq: ["$movementType", "out"] }, -1, 1] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$item",
        totalSignedQuantity: { $sum: "$signedQuantity" },
      },
    },
  ]);

  // Step 5: Get adjustments for ALL items in ONE query
  const adjustmentMovements = await AdjustmentEntry.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        status: "active",
        isReversed: false,
        originalTransactionDate: {
          $gte: BASE_START_DATE,
          $lt: dirtyPeriodEnd,
        },
      },
    },
    { $unwind: "$itemAdjustments" },
    {
      $match: {
        "itemAdjustments.item": { $in: itemIdObjs },
      },
    },
    {
      $addFields: {
        signedQuantityDelta: {
          $multiply: [
            "$itemAdjustments.quantityDelta",
            {
              $switch: {
                branches: [
                  {
                    case: {
                      $in: [
                        "$originalTransactionModel",
                        ["Sale", "PurchaseReturn"],
                      ],
                    },
                    then: -1,
                  },
                  {
                    case: {
                      $in: [
                        "$originalTransactionModel",
                        ["Purchase", "SalesReturn"],
                      ],
                    },
                    then: 1,
                  },
                ],
                default: 1,
              },
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$itemAdjustments.item",
        totalSignedQtyDelta: { $sum: "$signedQuantityDelta" },
      },
    },
  ]);

  // Step 6: Combine all data
  const finalBalances = {};

  itemIdObjs.forEach((id) => {
    const itemKey = id.toString();
    let balance = baseBalances[itemKey] || 0;

    const ledgerMove = ledgerMovements.find(
      (m) => m._id.toString() === itemKey
    );
    if (ledgerMove) {
      balance += ledgerMove.totalSignedQuantity;
    }

    const adjMove = adjustmentMovements.find(
      (m) => m._id.toString() === itemKey
    );
    if (adjMove) {
      balance += adjMove.totalSignedQtyDelta;
    }

    finalBalances[itemKey] = balance;
  });

  return finalBalances;
};

/* =========================================================================
   2️⃣ BATCHED Adjusted Ledger (ALL items at once)
   ========================================================================= */

export const getBatchAdjustedLedgers = async ({
  companyId,
  branchId,
  itemIds,
  startDate,
  endDate,
  openingBalances,
  transactionType = null,
}) => {
  const itemIdObjs = itemIds.map((id) => toObjectId(id));

  const baseMatch = {
    company: companyId,
    branch: branchId,
    item: { $in: itemIdObjs },
    transactionDate: { $gte: startDate, $lte: endDate },
  };

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  const ledgers = await ItemLedger.aggregate([
    { $match: baseMatch },

    {
      $lookup: {
        from: "adjustment_entries",
        let: {
          txnNum: "$transactionNumber",
          company: "$company",
          branch: "$branch",
          item: "$item",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$company", "$$company"] },
                  { $eq: ["$branch", "$$branch"] },
                  { $eq: ["$originalTransactionNumber", "$$txnNum"] },
                  { $eq: ["$status", "active"] },
                  { $eq: ["$isReversed", false] },
                  {
                    $in: [
                      "$originalTransactionModel",
                      ["Sale", "Purchase", "SalesReturn", "PurchaseReturn"],
                    ],
                  },
                ],
              },
            },
          },
          { $unwind: "$itemAdjustments" },
          {
            $match: {
              $expr: { $eq: ["$itemAdjustments.item", "$$item"] },
            },
          },
          {
            $group: {
              _id: null,
              totalQuantityDelta: { $sum: "$itemAdjustments.quantityDelta" },
              totalRateDelta: { $sum: "$itemAdjustments.rateDelta" },
              totalAmountDelta: { $sum: "$amountDelta" },
            },
          },
        ],
        as: "adjustments",
      },
    },

    {
      $addFields: {
        totalQuantityDelta: {
          $ifNull: [
            { $arrayElemAt: ["$adjustments.totalQuantityDelta", 0] },
            0,
          ],
        },
        totalRateDelta: {
          $ifNull: [{ $arrayElemAt: ["$adjustments.totalRateDelta", 0] }, 0],
        },
        totalAmountDelta: {
          $ifNull: [{ $arrayElemAt: ["$adjustments.totalAmountDelta", 0] }, 0],
        },

        effectiveQuantity: {
          $add: [
            "$quantity",
            {
              $ifNull: [
                { $arrayElemAt: ["$adjustments.totalQuantityDelta", 0] },
                0,
              ],
            },
          ],
        },
        effectiveRate: {
          $add: [
            "$rate",
            {
              $ifNull: [
                { $arrayElemAt: ["$adjustments.totalRateDelta", 0] },
                0,
              ],
            },
          ],
        },

        effectiveBaseAmount: {
          $multiply: [
            {
              $add: [
                "$quantity",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$adjustments.totalQuantityDelta", 0] },
                    0,
                  ],
                },
              ],
            },
            {
              $add: [
                "$rate",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$adjustments.totalRateDelta", 0] },
                    0,
                  ],
                },
              ],
            },
          ],
        },

        effectiveAmountAfterTax: {
          $add: [
            {
              $multiply: [
                {
                  $add: [
                    "$quantity",
                    {
                      $ifNull: [
                        {
                          $arrayElemAt: ["$adjustments.totalQuantityDelta", 0],
                        },
                        0,
                      ],
                    },
                  ],
                },
                {
                  $add: [
                    "$rate",
                    {
                      $ifNull: [
                        { $arrayElemAt: ["$adjustments.totalRateDelta", 0] },
                        0,
                      ],
                    },
                  ],
                },
              ],
            },
            "$taxAmount",
          ],
        },

        hasAdjustment: { $gt: [{ $size: "$adjustments" }, 0] },
      },
    },

    {
      $project: {
        adjustments: 0,
        __v: 0,
      },
    },

    { $sort: { item: 1, transactionDate: 1, createdAt: 1, _id: 1 } },

    // Group by item to calculate summaries
    {
      $group: {
        _id: "$item",
        transactions: { $push: "$$ROOT" },
        totalIn: {
          $sum: {
            $cond: [{ $eq: ["$movementType", "in"] }, "$effectiveQuantity", 0],
          },
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ["$movementType", "out"] }, "$effectiveQuantity", 0],
          },
        },
        amountIn: {
          $sum: {
            $cond: [
              { $eq: ["$movementType", "in"] },
              "$effectiveAmountAfterTax",
              0,
            ],
          },
        },
        amountOut: {
          $sum: {
            $cond: [
              { $eq: ["$movementType", "out"] },
              "$effectiveAmountAfterTax",
              0,
            ],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  // Convert to map for easy lookup
  const ledgerMap = {};

  ledgers.forEach((item) => {
    const itemKey = item._id.toString();
    const openingQty = openingBalances[itemKey] || 0;

    ledgerMap[itemKey] = {
      openingQuantity: openingQty,
      summary: {
        totalIn: item.totalIn,
        totalOut: item.totalOut,
        amountIn: item.amountIn,
        amountOut: item.amountOut,
        closingQuantity: openingQty + item.totalIn - item.totalOut,
        transactionCount: item.transactionCount,
      },
      transactions: item.transactions,
    };
  });

  // Handle items with no transactions in the period
  itemIds.forEach((id) => {
    const itemKey = id.toString();
    if (!ledgerMap[itemKey]) {
      ledgerMap[itemKey] = {
        openingQuantity: openingBalances[itemKey] || 0,
        summary: {
          totalIn: 0,
          totalOut: 0,
          amountIn: 0,
          amountOut: 0,
          closingQuantity: openingBalances[itemKey] || 0,
          transactionCount: 0,
        },
        transactions: [],
      };
    }
  });

  return ledgerMap;
};

/* =========================================================================
   3️⃣ Main BATCHED Refold Function
   ========================================================================= */

export const refoldLedgersWithAdjustments = async ({
  company,
  branch,
  startDate,
  endDate,
  item = null,
  transactionType = null,
  page = 1,
  limit = 50,
  searchTerm = null,
}) => {
  const companyId = toObjectId(company);
  const branchId = toObjectId(branch);
  const itemFilter = item ? toObjectId(item) : null;

  const baseMatch = {
    company: companyId,
    branch: branchId,
    transactionDate: { $gte: startDate, $lte: endDate },
  };
  if (itemFilter) baseMatch.item = itemFilter;

  if (transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  let searchStage = {};
  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");
    searchStage = {
      $or: [{ itemName: regex }, { itemCode: regex }],
    };
  }

  // QUERY 1: Get paginated item list
  const itemFacet = await ItemLedger.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: "$item",
        itemName: { $first: "$itemName" },
        itemCode: { $first: "$itemCode" },
        unit: { $first: "$unit" },
      },
    },
    ...(searchTerm ? [{ $match: searchStage }] : []),
    { $sort: { itemName: 1, itemCode: 1 } },
    {
      $facet: {
        meta: [{ $count: "totalItems" }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const itemsPage = itemFacet[0]?.data || [];

  if (itemsPage.length === 0) {
    return {
      items: [],
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 0,
      },
      filters: {
        company,
        branch,
        startDate,
        endDate,
        transactionType: transactionType || "all",
        searchTerm: searchTerm || null,
      },
    };
  }

  const itemIds = itemsPage.map((row) => row._id.toString());

  // QUERY 2: Get ALL opening balances at once
  const openingBalances = await getBatchOpeningBalances(
    companyId,
    branchId,
    itemIds,
    new Date(startDate)
  );

  // QUERY 3: Get ALL ledger data at once
  const ledgerData = await getBatchAdjustedLedgers({
    companyId,
    branchId,
    itemIds,
    startDate,
    endDate,
    openingBalances,
    transactionType,
  });

  // Combine results (no more queries!)
  const ledgersPerItem = itemsPage.map((row) => {
    const itemKey = row._id.toString();
    const data = ledgerData[itemKey];

    return {
      _id: row._id,
      itemName: row.itemName,
      itemCode: row.itemCode,
      unit: row.unit,
      openingQuantity: data.openingQuantity,
      summary: data.summary,
      transactions: data.transactions,
    };
  });

  return {
    items: ledgersPerItem,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
    filters: {
      company,
      branch,
      startDate,
      endDate,
      transactionType: transactionType || "all",
      searchTerm: searchTerm || null,
    },
  };
};

/* =========================================================================
   ⚠️ DEPRECATED - Keep for backward compatibility only
   ========================================================================= */

export const getOpeningBalance = async (
  company,
  branch,
  itemObj,
  selectedDate
) => {
  const result = await getBatchOpeningBalances(
    company,
    branch,
    [itemObj],
    selectedDate
  );
  return result[itemObj.toString()] || 0;
};

export const getAdjustedItemLedger = async ({
  companyId,
  branchId,
  itemId,
  startDate,
  endDate,
  openingQuantity,
  transactionType = null,
}) => {
  const openingBalances = { [itemId.toString()]: openingQuantity };
  const result = await getBatchAdjustedLedgers({
    companyId,
    branchId,
    itemIds: [itemId],
    startDate,
    endDate,
    openingBalances,
    transactionType,
  });

  return result[itemId.toString()];
};
