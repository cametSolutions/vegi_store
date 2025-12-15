// services/ItemLedgerService.js
/**
 * 🚀 VEGETABLE BILLING LEDGER RECALCULATION ENGINE
 * Handles transaction edits via adjustment entries with smart combining
 * Calculates effective quantities/rates/amounts + chained running balances
 * Supports clean/dirty months with ItemMaster fallback
 */

import ItemLedger from "../model/ItemsLedgerModel.js";
import ItemMonthlyBalance from "../model/ItemMonthlyBalanceModel.js";
import AdjustmentEntry from "../model/AdjustmentEntryModel.js";
import mongoose from "mongoose";
import ItemMasterModel from "../model/masters/ItemMasterModel.js";

// 🔧 Convert string IDs to ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// 📅 Parse date to year/month for monthly balance lookup
const parseDate = (date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
});

// ========================================
// 🔥 MAIN EXPORT: Universal Ledger Refold Function
// ========================================
/**
 * @param {Object} params
 * @param {string} params.company - Company ID (string)
 * @param {string} params.branch - Branch ID (string)
 * @param {string|null} params.item - Item ID (null = all items)
 * @param {Date} params.startDate - Report start date
 * @param {Date} params.endDate - Report end date
 * @param {string|null} params.groupBy - 'item' or null
 * @returns {Promise<Object>} Ledgers with effective values + running balances
 */
export const refoldLedgersWithAdjustments = async ({
  company: companyId, // Company ID (string)
  branch: branchId, // Branch ID (string)
  item: itemId = null, // Item ID (null = all items)
  startDate, // Date
  endDate, // Date
  groupBy = null, // 'item' or null
}) => {
  // 🔄 Convert string IDs to ObjectId
  const company = toObjectId(companyId);
  const branch = toObjectId(branchId);
  const item = itemId ? toObjectId(itemId) : null;

  // 📋 Build query match
  const match = {
    company,
    branch,
    transactionDate: { $gte: startDate, $lte: endDate },
  };
  if (item) match.item = item;

  console.log("🔍 Match query:", JSON.stringify(match, null, 2));

  // 🚀 STEP 1: Aggregation - Get ledgers + adjustments (parallel lookup!)
  const rawLedgers = await ItemLedger.aggregate([
    // 📊 Filter ledgers by date/company/branch/item
    { $match: match },

    // 🔥 PARALLEL LOOKUP: Find adjustments for ALL ledgers simultaneously
    {
      $lookup: {
        from: "adjustment_entries", // Adjustment collection
        let: {
          // 📦 Variables from CURRENT ledger
          txnNum: "$transactionNumber", // "SAL-T5MZ"
          txnType: "$transactionType", // "sale"
          company: "$company", // Pass explicitly!
          branch: "$branch", // Pass explicitly!
        },
        pipeline: [
          // 🔍 Sub-pipeline INSIDE adjustment_entries
          {
            $match: {
              $expr: {
                // 🧠 Complex matching with variables
                $and: [
                  { $eq: ["$company", "$$company"] }, // Match company
                  { $eq: ["$branch", "$$branch"] }, // Match branch
                  { $eq: ["$originalTransactionNumber", "$$txnNum"] }, // "SAL-T5MZ" match
                  { $eq: ["$status", "active"] }, // Active only
                  { $eq: ["$isReversed", false] }, // Not reversed
                ],
              },
            },
          },
          // 📈 Calculate totals for this adjustment
          {
            $addFields: {
              totalQuantityDelta: {
                $ifNull: [{ $sum: "$itemAdjustments.quantityDelta" }, 0], // +5kg
              },
              totalRateDelta: {
                $ifNull: [{ $sum: "$itemAdjustments.rateDelta" }, 0], // +5₹/kg
              },
            },
          },
        ],
        as: "adjustments", // 📎 Attach to ledger
      },
    },

    // 💰 CALCULATE EFFECTIVE VALUES (Quantity + Rate + Amounts)
    {
      $addFields: {
        // 📏 Effective Quantity: original + adjustment delta
        effectiveQuantity: {
          $add: [
            "$quantity", // Original 10kg
            { $ifNull: [{ $sum: "$adjustments.totalQuantityDelta" }, 0] }, // +5kg
          ],
        },
        // 💲 Effective Rate: original + adjustment delta
        effectiveRate: {
          $add: [
            "$rate", // Original 100₹/kg
            { $ifNull: [{ $sum: "$adjustments.totalRateDelta" }, 0] }, // +5₹/kg
          ],
        },
        // 📊 Deltas (for display)
        adjustmentDelta: {
          $ifNull: [{ $sum: "$adjustments.totalQuantityDelta" }, 0],
        },
        rateAdjustmentDelta: {
          $ifNull: [{ $sum: "$adjustments.totalRateDelta" }, 0],
        },
        // ✅ Adjustment flag
        hasAdjustment: { $gt: [{ $size: "$adjustments" }, 0] },
        // 💵 Effective Base Amount: qty × rate (both effective)
        effectiveBaseAmount: {
          $multiply: [
            {
              $add: [
                "$quantity",
                { $ifNull: [{ $sum: "$adjustments.totalQuantityDelta" }, 0] },
              ],
            },
            {
              $add: [
                "$rate",
                { $ifNull: [{ $sum: "$adjustments.totalRateDelta" }, 0] },
              ],
            },
          ],
        },
        // 🧾 Effective Amount After Tax
        effectiveAmountAfterTax: {
          $add: [
            {
              $multiply: [
                {
                  $add: [
                    "$quantity",
                    {
                      $ifNull: [{ $sum: "$adjustments.totalQuantityDelta" }, 0],
                    },
                  ],
                },
                {
                  $add: [
                    "$rate",
                    { $ifNull: [{ $sum: "$adjustments.totalRateDelta" }, 0] },
                  ],
                },
              ],
            },
            "$taxAmount", // Tax usually unchanged
          ],
        },
      },
    },

    // 🧹 Clean response - remove heavy data
    {
      $project: {
        adjustments: 0, // Don't return 10KB adjustment docs
        __v: 0,
      },
    },

    // ⏱️ Sort chronologically (CRITICAL for running balance)
    { $sort: { transactionDate: 1, createdAt: 1 } },
  ]);

  console.log("📊 Raw ledgers count:", rawLedgers.length);

  // 📦 STEP 2: Group transactions by item
  const groupedByItem = {};
  rawLedgers.forEach((ledger) => {
    const itemKey = ledger.item.toString();
    if (!groupedByItem[itemKey]) {
      groupedByItem[itemKey] = {
        item: ledger.item,
        itemName: ledger.itemName,
        itemCode: ledger.itemCode,
        transactions: [],
        totalIn: 0,
        totalOut: 0,
        transactionCount: 0,
      };
    }
    groupedByItem[itemKey].transactions.push(ledger);
  });

  // ⚙️ STEP 3: Calculate opening + running balance PER ITEM
  const result = [];
  for (const [itemKey, group] of Object.entries(groupedByItem)) {
    const itemObj = toObjectId(itemKey);

    // 💰 Get opening balance for THIS item
    const openingBalance = await getOpeningBalance(
      company,
      branch,
      itemObj,
      new Date(endDate)
    );
    console.log(`💰 Item ${group.itemName}: opening=${openingBalance}`);

    // // 🔄 Calculate chained running balance
    // let runningTotal = 0;
    // const transactionsWithBalance = group.transactions.map((ledger) => {
    //   // 🎯 MOVEMENT LOGIC: "out" = negative, "in" = positive
    //   const movementMultiplier = ledger.movementType === 'out' ? -1 : 1;
    //   runningTotal += ledger.effectiveQuantity * movementMultiplier;

    //   return {
    //     ...ledger,
    //     openingBalance,                    // 📊 This item's opening
    //     effectiveMovement: ledger.effectiveQuantity * movementMultiplier,  // Debug
    //     finalRunningBalance: openingBalance + runningTotal,  // ✅ CHAINED!
    //     runningBalanceDelta: (openingBalance + runningTotal) - ledger.runningStockBalance
    //   };
    // });

    // // 📈 Calculate summary totals
    // const totalIn = transactionsWithBalance
    //   .filter(t => t.movementType === 'in')
    //   .reduce((sum, t) => sum + t.effectiveQuantity, 0);
    // const totalOut = transactionsWithBalance
    //   .filter(t => t.movementType === 'out')
    //   .reduce((sum, t) => sum + t.effectiveQuantity, 0);
    // const closingBalance = openingBalance + totalIn - totalOut;

    // result.push({
    //   _id: group.item,
    //   itemName: group.itemName,
    //   itemCode: group.itemCode,
    //   openingBalance,
    //   transactions: transactionsWithBalance,
    //   summary: {
    //     totalIn,
    //     totalOut,
    //     transactionCount: transactionsWithBalance.length,
    //     closingBalance
    //   }
    // });
  }

  // console.log("✅ Final result count:", result.length);

  // return {
  //   // 🔍 Debug info
  //   debug: {
  //     openingBalances: result.map(r => ({ item: r._id.toString(), opening: r.openingBalance })),
  //     rawLedgerCount: rawLedgers.length,
  //     groupedItems: Object.keys(groupedByItem).length
  //   },
  //   ledgers: result,
  //   isDirty: result.some(r => r.transactions.some(t => t.hasAdjustment)),
  //   timestamp: new Date()
  // };
};

// ========================================
// 💰 PERFECT OPENING BALANCE LOGIC (5 Fallbacks)
// ========================================
// const getOpeningBalance = async (company, branch, item, startDate) => {
//   if (!item) return 0;

//   const { year, month } = parseDate(startDate);

//   console.log("🎯 Opening balance lookup:", {
//     year, month,
//     item: item.toString().slice(-4),
//     branch: branch.toString().slice(-4)
//   });

//   // 1️⃣ PRIORITY 1: Current month clean?
//   const targetMonthly = await ItemMonthlyBalance.findOne({
//     company, branch, item, year, month
//   }).lean();

//   if (targetMonthly && !targetMonthly.needsRecalculation) {
//     const opening = await ItemMonthlyBalance.getOpeningStock(item, branch, company, year, month);
//     console.log("✅ 1️⃣ Current month clean");
//     return opening;
//   }

//   // 2️⃣ PRIORITY 2: Previous month clean?
//   const prevYear = month === 1 ? year - 1 : year;
//   const prevMonth = month === 1 ? 12 : month - 1;

//   const prevMonthly = await ItemMonthlyBalance.findOne({
//     company, branch, item, year: prevYear, month: prevMonth
//   }).lean();

//   if (prevMonthly && !prevMonthly.needsRecalculation) {
//     console.log("✅ 2️⃣ Previous month clean:", prevMonthly.closingStock);
//     return prevMonthly.closingStock;
//   }

//   // 3️⃣ PRIORITY 3: Any clean monthly balance?
//   const anyMonthly = await ItemMonthlyBalance.findOne({
//     company, branch, item
//   }).sort({ year: -1, month: -1 }).lean();

//   if (anyMonthly && !anyMonthly.needsRecalculation) {
//     console.log("✅ 3️⃣ Any monthly clean:", anyMonthly.closingStock);
//     return anyMonthly.closingStock;
//   }

//   // 4️⃣ PRIORITY 4: ItemMaster fallback
//   console.log("🏪 4️⃣ ItemMaster lookup");
//   const itemMaster = await ItemMasterModel.findOne({
//     _id: item,
//     company,
//     'stock.branch': branch
//   }).lean();

//   if (itemMaster?.stock) {
//     const branchStock = itemMaster.stock.find(s =>
//       s.branch.toString() === branch.toString()
//     );
//     const openingStock = branchStock?.openingStock || 0;
//     console.log("✅ 4️⃣ ItemMaster:", openingStock);
//     return openingStock;
//   }

//   // 5️⃣ FINAL FALLBACK
//   console.log("⚠️  5️⃣ Zero fallback");
//   return 0;
// };

// ========================================
// 🧹 Helper Functions
// ========================================
const isPeriodDirty = async (company, branch, item, startDate) => {
  if (!item) return false;
  const { year, month } = parseDate(startDate);
  const monthly = await ItemMonthlyBalance.findOne({
    company,
    branch,
    item,
    year,
    month,
  }).lean();
  return monthly?.needsRecalculation || false;
};

// const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");

/**
 * 🚀 Get item opening QUANTITY only as of selectedDate
 */

export const getOpeningBalance = async (company, branch, itemObj, selectedDate) => {
  const companyId = company;
  const branchId = branch; 
  const itemId = itemObj;

  if (!selectedDate || isNaN(selectedDate.getTime())) return 0;

  const BASE_START_DATE = new Date("2025-04-01T00:00:00.000Z");
  if (selectedDate < BASE_START_DATE) return 0;

  // 1️⃣ Previous month (unchanged)
  const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;

  // 2️⃣ Last clean monthly (FIXED: only past months)
  const lastCleanMonthly = await ItemMonthlyBalance.findOne({
    company: companyId, branch: branchId, item: itemId,
    needsRecalculation: false,
    $or: [
      { year: { $lt: prevYear } },
      { year: prevYear, month: { $lte: prevMonthNum } }
    ]
  })
  .sort({ year: -1, month: -1 })
  .lean();

  let baseQuantity = 0;
  let adjustmentStartDate = new Date("2025-04-01T00:00:00.000Z");

  if (lastCleanMonthly) {
    baseQuantity = lastCleanMonthly.closingStock || 0;
    // adjustmentStartDate = new Date(lastCleanMonthly.year, lastCleanMonthly.month, 1);
    console.log("✅ Using monthly:", lastCleanMonthly.periodKey, baseQuantity);
  } else {

    const itemMaster = await ItemMasterModel.findOne({
      _id: itemId,
      company: companyId,
      "stock.branch": branchId
    }).lean();

    if (itemMaster) {
      const branchStock = itemMaster.stock.find(s => 
        s.branch.toString() === branchId.toString()
      );
      baseQuantity = branchStock?.openingStock || 0;
      console.log("✅ Using ItemMaster fallback:", baseQuantity);
    } else {
      console.log("⚠️ No ItemMaster found, base=0");
    }
    
    // ItemMaster fallback → start adjustments from BASE date
    adjustmentStartDate = new Date("2025-04-01T00:00:00.000Z");
  }

  // 3️⃣ Dirty period calculations (unchanged from previous fix)
  const dirtyPeriodEnd = new Date(selectedDate);
  dirtyPeriodEnd.setHours(0, 0, 0, 0);


  console.log("sd",adjustmentStartDate);
  
  // Original ledgers with movement sign
  const originalLedgers = await ItemLedger.aggregate([
    { $match: {
      company: companyId, branch: branchId, item: itemId,
      transactionDate: { 
        $gte: adjustmentStartDate,
         $lt: dirtyPeriodEnd
         }
    }},
    {
      $addFields: {
        signedQuantity: {
          $multiply: ["$quantity", { $cond: [{ $eq: ["$movementType", "out"] }, -1, 1] }]
        }
      }
    },
    { $group: { _id: null, totalSignedQuantity: { $sum: "$signedQuantity" } }}
  ]);

  // console.log("all",originalLedgers);
  
  
  const origSignedQty = originalLedgers[0]?.totalSignedQuantity || 0;

  // Adjustments with movement sign (using previous $switch fix)
  const adjustments = await AdjustmentEntry.aggregate([
    { $match: {
      company: companyId, branch: branchId,
      status: "active", isReversed: false,
      originalTransactionDate: { $gte: adjustmentStartDate, $lt: dirtyPeriodEnd },
      "itemAdjustments.item": itemId
    }},
    { $unwind: "$itemAdjustments" },
    { $match: { "itemAdjustments.item": itemId } },
    {
      $addFields: {
        originalTransactionType: {
          $switch: {
            branches: [
              { case: { $eq: ["$originalTransactionModel", "Sale"] }, then: "sale" },
              { case: { $eq: ["$originalTransactionModel", "Purchase"] }, then: "purchase" },
              { case: { $eq: ["$originalTransactionModel", "SalesReturn"] }, then: "sales_return" },
              { case: { $eq: ["$originalTransactionModel", "PurchaseReturn"] }, then: "purchase_return" }
            ],
            default: "unknown"
          }
        }
      }
    },
    {
      $lookup: {
        from: "itemsledgers",
        let: { txnNum: "$originalTransactionNumber", txnType: "$originalTransactionType" },
        pipeline: [{
          $match: {
            $expr: {
              $and: [
                { $eq: ["$transactionNumber", "$$txnNum"] },
                { $eq: ["$transactionType", "$$txnType"] },
                { $eq: ["$company", companyId] },
                { $eq: ["$branch", branchId] },
                { $eq: ["$item", itemId] }
              ]
            }
          }
        }],
        as: "originalLedger"
      }
    },
    { $unwind: { path: "$originalLedger", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        signedQuantityDelta: {
          $multiply: [
            "$itemAdjustments.quantityDelta",
            { $cond: [{ $eq: ["$originalLedger.movementType", "out"] }, -1, 1] }
          ]
        }
      }
    },
    { $group: { _id: null, totalSignedQtyDelta: { $sum: "$signedQuantityDelta" } }}
  ]);

  const adjSignedQty = adjustments[0]?.totalSignedQtyDelta || 0;

  const openingQuantity = baseQuantity + origSignedQty + adjSignedQty;

  console.log("📊 COMPLETE Opening:", {
    source: lastCleanMonthly ? "Monthly" : "ItemMaster",
    baseQuantity, origSignedQty, adjSignedQty, total: openingQuantity
  });

  return openingQuantity;
};

