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

  console.log("\n🚀 ========== OPENING BALANCE CALCULATION START ==========");
  console.log("📥 Input:", {
    company: companyId.toString().slice(-4),
    branch: branchId.toString().slice(-4),
    item: itemId.toString().slice(-4),
    selectedDate: selectedDate?.toISOString?.().split("T")[0],
  });

  if (!selectedDate || isNaN(selectedDate.getTime())) {
    console.error("❌ Invalid selectedDate");
    return 0;
  }

  const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");
  if (selectedDate < BASE_START_DATE) {
    console.log("⚠️ Selected date before base start (Apr 1 2025) → opening = 0");
    return 0;
  }

  // 1️⃣ Previous month
  const prevMonthDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() - 1,
    1
  );
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  console.log(
    "\n📅 STEP 1: Previous month:",
    `${prevYear}-${String(prevMonthNum).padStart(2, "0")}`
  );

  // 2️⃣ Last clean monthly
  console.log("\n🔍 STEP 2: Find last clean monthly balance...");
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
    console.log("  ✅ Clean month found:");
    console.log("     periodKey:", lastCleanMonthly.periodKey);
    console.log("     closingStock:", baseQuantity, "kg");
    console.log(
      "     dirty period starts from:",
      dirtyPeriodStartDate.toISOString().split("T")[0]
    );
  } else {
    console.log("  ❌ No clean month found, using ItemMaster fallback...");
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
      console.log("  ✅ ItemMaster found:");
      console.log("     openingStock:", baseQuantity, "kg");
    } else {
      console.log("  ⚠️ No ItemMaster found → baseQuantity = 0");
    }

    dirtyPeriodStartDate = new Date("2025-04-01T00:00:00.000Z");
    console.log(
      "     dirty period starts from BASE:",
      dirtyPeriodStartDate.toISOString().split("T")[0]
    );
  }

  // 3️⃣ Dirty period end
  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);

  console.log("\n📊 STEP 3: Dirty period range");
  console.log(
    "     from",
    dirtyPeriodStartDate.toISOString().split("T")[0],
    "to",
    dirtyPeriodEnd.toISOString().split("T")[0]
  );

  // 4️⃣ Original ledgers with movement sign
  console.log("\n💾 STEP 4: Original ledgers (movement-aware)");
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
        count: { $sum: 1 },
        totalIn: {
          $sum: {
            $cond: [{ $eq: ["$movementType", "in"] }, "$quantity", 0],
          },
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ["$movementType", "out"] }, "$quantity", 0],
          },
        },
      },
    },
  ]);

  const origSignedQty = originalLedgers[0]?.totalSignedQuantity || 0;
  console.log("  ledgers count:", originalLedgers[0]?.count || 0);
  console.log("  totalIn:", originalLedgers[0]?.totalIn || 0, "kg");
  console.log("  totalOut:", originalLedgers[0]?.totalOut || 0, "kg");
  console.log("  totalSignedQuantity:", origSignedQty, "kg");

  // 5️⃣ Adjustments with correct movement logic
  console.log("\n⚙️ STEP 5: Adjustments (movement-aware)");

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
        movementType: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$originalTransactionModel", "Sale"] },
                then: "out",
              },
              {
                case: { $eq: ["$originalTransactionModel", "PurchaseReturn"] },
                then: "out",
              },
              {
                case: { $eq: ["$originalTransactionModel", "Purchase"] },
                then: "in",
              },
              {
                case: { $eq: ["$originalTransactionModel", "SalesReturn"] },
                then: "in",
              },
            ],
            default: "in",
          },
        },

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
        count: { $sum: 1 },
        breakdown: {
          $push: {
            txnModel: "$originalTransactionModel",
            txnNum: "$originalTransactionNumber",
            rawDelta: "$itemAdjustments.quantityDelta",
            movementType: "$movementType",
            signedDelta: "$signedQuantityDelta",
          },
        },
      },
    },
  ]);

  const adjSignedQty = adjustments[0]?.totalSignedQtyDelta || 0;
  console.log("  adjustments count:", adjustments[0]?.count || 0);
  console.log("  totalSignedQtyDelta:", adjSignedQty, "kg");
  if (adjustments[0]?.breakdown?.length) {
    console.log(
      "  breakdown:",
      JSON.stringify(adjustments[0].breakdown, null, 2)
    );
  }

  // 6️⃣ Final opening
  console.log("\n🧮 STEP 6: Final opening calculation");
  console.log("  baseQuantity:", baseQuantity, "kg");
  console.log("  + origSignedQty:", origSignedQty, "kg");
  console.log("  + adjSignedQty:", adjSignedQty, "kg");

  const openingQuantity = baseQuantity + origSignedQty + adjSignedQty;

  console.log("👉 FINAL OPENING:", openingQuantity, "kg");
  console.log(
    "🔚 ========== OPENING BALANCE CALCULATION END ==========\n"
  );

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
}) => {
  const ledgers = await ItemLedger.aggregate([
    {
      $match: {
        company: companyId,
        branch: branchId,
        item: itemId,
        transactionDate: { $gte: startDate, $lte: endDate },
      },
    },

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

  const enriched = ledgers.map((doc) => {
    const movementSign = doc.movementType === "out" ? -1 : 1;
    const effectiveMovement = doc.effectiveQuantity * movementSign;
    runningQty += effectiveMovement;

    if (movementSign === 1) {
      totalIn += doc.effectiveQuantity;
    } else {
      totalOut += doc.effectiveQuantity;
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
      closingQuantity: runningQty,
      transactionCount: enriched.length,
    },
  };
};

/* =========================================================================
   3️⃣ refoldLedgersWithAdjustments – item summary using the above
   ========================================================================= */

export const refoldLedgersWithAdjustments = async ({
  company: companyIdStr,
  branch: branchIdStr,
  item: itemIdStr = null,
  startDate,
  endDate,
  groupBy = "item", // for now only 'item' is supported
}) => {
  const companyId = toObjectId(companyIdStr);
  const branchId = toObjectId(branchIdStr);
  const itemFilter = itemIdStr ? toObjectId(itemIdStr) : null;

  const match = {
    company: companyId,
    branch: branchId,
    transactionDate: { $gte: startDate, $lte: endDate },
  };
  if (itemFilter) match.item = itemFilter;

  console.log("🔍 refoldLedgersWithAdjustments match:", match);

  // 1️⃣ Get raw ledgers in range
  const rawLedgers = await ItemLedger.aggregate([
    { $match: match },
    {
      $project: {
        item: 1,
        itemName: 1,
        itemCode: 1,
      },
    },
    { $group: {
        _id: "$item",
        itemName: { $first: "$itemName" },
        itemCode: { $first: "$itemCode" },
      }
    },
  ]);

  console.log("📊 Distinct items in range:", rawLedgers.length);

  const result = [];

  // 2️⃣ Process per item (could be parallel with Promise.all if needed)
  for (const row of rawLedgers) {
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
    });

    result.push({
      _id: itemId,
      itemName: row.itemName,
      itemCode: row.itemCode,
      openingBalance: adjusted.openingQuantity,
      transactions: adjusted.transactions,
      summary: adjusted.summary,
    });
  }

  return {
    ledgers: result,
    debug: {
      itemCount: result.length,
      startDate,
      endDate,
    },
    timestamp: new Date(),
  };
};
