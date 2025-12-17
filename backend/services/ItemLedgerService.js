// services/ItemLedgerService.js
import mongoose from "mongoose";
import ItemLedger from "../model/ItemsLedgerModel.js";
import ItemMonthlyBalance from "../model/ItemMonthlyBalanceModel.js";
import AdjustmentEntry from "../model/AdjustmentEntryModel.js";
import ItemMasterModel from "../model/masters/ItemMasterModel.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/* =========================================================================
   1️⃣ Opening Balance (per item) – quantity only
   ========================================================================= */

export const getOpeningBalance = async (company, branch, itemObj, selectedDate) => {
  const companyId = company;
  const branchId = branch;
  const itemId = itemObj;

  if (!selectedDate || isNaN(selectedDate.getTime())) {
    return 0;
  }

  const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");
  if (selectedDate < BASE_START_DATE) {
    return 0;
  }

  // Previous month of selectedDate
  const prevMonthDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() - 1,
    1
  );
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;

  // Last clean monthly <= previous month
  const lastCleanMonthly = await ItemMonthlyBalance.findOne({
    company: companyId,
    branch: branchId,
    item: itemId,
    needsRecalculation: false,
    $or: [
      { year: { $lt: prevYear } },
      { year: prevYear, month: { $lte: prevMonthNum } },
    ],
  })
    .sort({ year: -1, month: -1 })
    .lean();

  let baseQuantity = 0;
  let dirtyPeriodStartDate = new Date("2025-04-01T00:00:00.000Z");

  if (lastCleanMonthly) {
    baseQuantity = lastCleanMonthly.closingStock || 0;
    dirtyPeriodStartDate = new Date(
      lastCleanMonthly.year,
      lastCleanMonthly.month,
      1
    );
  } else {
    // ItemMaster fallback
    const itemMaster = await ItemMasterModel.findOne({
      _id: itemId,
      company: companyId,
      "stock.branch": branchId,
    }).lean();

    if (itemMaster) {
      const branchStock = itemMaster.stock.find(
        (s) => s.branch.toString() === branchId.toString()
      );
      baseQuantity = branchStock?.openingStock || 0;
    }
    dirtyPeriodStartDate = new Date("2025-04-01T00:00:00.000Z");
  }

  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);

  // Original ledgers in dirty period (movement-aware)
  const originalLedgers = await ItemLedger.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        item: itemId,
        transactionDate: {
          $gte: dirtyPeriodStartDate,
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
        _id: null,
        totalSignedQuantity: { $sum: "$signedQuantity" },
      },
    },
  ]);

  const origSignedQty = originalLedgers[0]?.totalSignedQuantity || 0;

  // Adjustments in dirty period (movement-aware)
  const adjustments = await AdjustmentEntry.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        status: "active",
        isReversed: false,
        originalTransactionDate: {
          $gte: dirtyPeriodStartDate,
          $lt: dirtyPeriodEnd,
        },
        "itemAdjustments.item": itemId,
      },
    },
    { $unwind: "$itemAdjustments" },
    { $match: { "itemAdjustments.item": itemId } },
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
        _id: null,
        totalSignedQtyDelta: { $sum: "$signedQuantityDelta" },
      },
    },
  ]);

  const adjSignedQty = adjustments[0]?.totalSignedQtyDelta || 0;

  const openingQuantity = baseQuantity + origSignedQty + adjSignedQty;

  return openingQuantity;
};

/* =========================================================================
   2️⃣ Per-item refold: adjusted ledger + running balance
   ========================================================================= */

export const getAdjustedItemLedger = async ({
  companyId,
  branchId,
  itemId,
  startDate,
  endDate,
  openingQuantity,
  transactionType = null, // 'sale' | 'purchase' | null
}) => {
  const baseMatch = {
    company: companyId,
    branch: branchId,
    item: itemId,
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
          $ifNull: [{ $arrayElemAt: ["$adjustments.totalQuantityDelta", 0] }, 0],
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
              $ifNull: [{ $arrayElemAt: ["$adjustments.totalQuantityDelta", 0] }, 0],
            },
          ],
        },
        effectiveRate: {
          $add: [
            "$rate",
            {
              $ifNull: [{ $arrayElemAt: ["$adjustments.totalRateDelta", 0] }, 0],
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

    { $sort: { transactionDate: 1, createdAt: 1, _id: 1 } },
  ]);

  let runningQty = openingQuantity;
  let totalIn = 0;
  let totalOut = 0;
  let amountIn = 0;
  let amountOut = 0;

  const enriched = ledgers.map((doc) => {
    const movementSign = doc.movementType === "out" ? -1 : 1;
    const effectiveMovement = doc.effectiveQuantity * movementSign;
    runningQty += effectiveMovement;

    if (movementSign === 1) {
      totalIn += doc.effectiveQuantity;
      amountIn += doc.effectiveAmountAfterTax;
    } else {
      totalOut += doc.effectiveQuantity;
      amountOut += doc.effectiveAmountAfterTax;
    }

    return {
      ...doc,
      openingQuantity,
      effectiveMovement,
      runningBalance: runningQty,
    };
  });

  return {
    openingQuantity,
    transactions: enriched,
    summary: {
      totalIn,
      totalOut,
      amountIn,
      amountOut,
      closingQuantity: runningQty,
      transactionCount: enriched.length,
    },
  };
};

/* =========================================================================
   3️⃣ Generic multi-item refold (service-level, no view shaping)
   ========================================================================= */

export const refoldLedgersWithAdjustments = async ({
  company,
  branch,
  startDate,
  endDate,
  item = null,
  transactionType = null, // 'sale' | 'purchase' | null
  page = 1,
  limit = 50,
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

  // Distinct item list (for pagination)
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
    {
      $sort: { itemName: 1, itemCode: 1 },
    },
    {
      $facet: {
        meta: [{ $count: "totalItems" }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
      },
    },
  ]);

  const totalItems = itemFacet[0]?.meta[0]?.totalItems || 0;
  const itemsPage = itemFacet[0]?.data || [];

  const ledgersPerItem = [];

  // Process only paginated items
  for (const row of itemsPage) {
    const itemId = row._id;

    const openingQty = await getOpeningBalance(
      companyId,
      branchId,
      itemId,
      new Date(startDate)
    );

    const adjusted = await getAdjustedItemLedger({
      companyId,
      branchId,
      itemId,
      startDate,
      endDate,
      openingQuantity: openingQty,
      transactionType,
    });

    ledgersPerItem.push({
      _id: itemId,
      itemName: row.itemName,
      itemCode: row.itemCode,
      unit: row.unit,
      openingQuantity: adjusted.openingQuantity,
      summary: adjusted.summary,
      transactions: adjusted.transactions, // controller can omit if not needed
    });
  }

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
    },
  };
};
