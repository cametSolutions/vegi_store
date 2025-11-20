/**
 * =============================================================================
 * ITEM LEDGER REFOLD - NIGHTLY RECALCULATION ENGINE
 * =============================================================================
 *
 * PURPOSE:
 * When users edit past transactions, we create "adjustment" records but don't
 * immediately recalculate all running balances (too slow for real-time).
 * Instead, we mark affected months as "dirty" (needsRecalculation: true).
 *
 * This nightly job "refolds" all dirty months by:
 * 1. Finding all items with dirty months
 * 2. For each item-branch combination, processing dirty months in chronological order
 * 3. Recalculating running stock balances from scratch
 * 4. Updating both ledger entries and monthly summaries
 *
 * ARCHITECTURE DIAGRAM:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ NIGHTLY JOB EXECUTION FLOW                                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  1. Find Dirty Items                                        │
 * │     └─> Query: ItemMonthlyBalance where needsRecalc=true   │
 * │     └─> Group by itemId + branchId                         │
 * │                                                             │
 * │  2. For Each Item-Branch (Sequential)                       │
 * │     ├─> START TRANSACTION                                   │
 * │     ├─> Get all dirty months                                │
 * │     ├─> Sort chronologically (Jan→Feb→Mar...)               │
 * │     │                                                       │
 * │     └─> For Each Month (Sequential, same transaction)       │
 * │         ├─> Get opening balance (prev month or Item Master) │
 * │         ├─> Fetch ALL ledger entries for this month         │
 * │         ├─> Fetch ALL adjustments for this month            │
 * │         ├─> Apply adjustment deltas to quantities           │
 * │         ├─> Recalculate running balances & financial fields │
 * │         ├─> Update ledger + monthly balance                 │
 * │         └─> Mark next month dirty (cascade)                 │
 * │                                                             │
 * │     ├─> COMMIT TRANSACTION (all months)                     │
 * │     └─> Or ROLLBACK if any month fails                      │
 * │                                                             │
 * │  3. Log Results                                             │
 * │     └─> Items processed, months refolded, errors            │
 * │                                                             │
 * └─────────────────────────────────────────────────────────────┘
 *
 * EXAMPLE SCENARIO:
 * - User edits Oct 20 transaction: changed qty from 10→15 KGS
 * - Adjustment created with quantityDelta: +5
 * - October marked needsRecalculation: true
 * - Nightly job runs:
 *   → Checks Sept closing: 100 KGS
 *   → If no Sept record, checks Item Master opening: 100 KGS
 *   → Fetches Oct ledger: 1 sale of 10 KGS
 *   → Applies adjustment: 10 + 5 = 15 KGS actual sale
 *   → Recalculates: 100 - 15 = 85 KGS closing
 *   → Updates ledger runningBalance and financial fields
 *   → Marks Nov as dirty (opening changed from 90→85)
 *   → Processes Nov in same transaction (reads Oct's new closing: 85)
 *
 * Author: Midhun Mohan
 * Last Updated: Nov 2025
 * =============================================================================
 */

import mongoose from "mongoose";
import ItemMonthlyBalance from "../../../model/ItemMonthlyBalanceModel.js";
import ItemLedger from "../../../model/ItemsLedgerModel.js";
import Adjustment from "../../../model/AdjustmentEntryModel.js";
import ItemMaster from "../../../model/masters/ItemMasterModel.js";
import {
  getPreviousMonth,
  getNextMonth,
  getMonthDateRange,
  formatYearMonth,
  sortMonthsChronologically,
} from "../utils/dateHelpers.js";

/**
 * =============================================================================
 * MAIN ENTRY POINT
 * =============================================================================
 */

/**
 * Process all items that have dirty months
 * Returns summary statistics
 */
export const processAllDirtyItems = async () => {
  console.log("📋 Finding all dirty items...");

  const workMap = await findDirtyItems();
  const workKeys = Object.keys(workMap);

  console.log(
    `📊 Found ${workKeys.length} item-branch combinations with dirty months`
  );

  if (workKeys.length === 0) {
    console.log("✨ No dirty items found. Database is clean!");
    return { itemsProcessed: 0, monthsRefolded: 0, errors: [] };
  }

  // Statistics tracking
  let itemsProcessed = 0;
  let monthsRefolded = 0;
  const errors = [];

  // Process each item-branch combination sequentially
  // We do this sequentially (not parallel) to avoid overwhelming the database
  for (const key of workKeys) {
    const { itemId, branchId, itemName, itemCode, months } = workMap[key];

    try {
      console.log(
        `\n🔧 Processing: ${itemName} (${itemCode}) - Branch: ${branchId}`
      );
      console.log(
        `   Dirty months: ${months
          .map((m) => formatYearMonth(m.year, m.month))
          .join(", ")}`
      );

      const result = await processOneItem(itemId, branchId, months);

      itemsProcessed++;
      monthsRefolded += result.monthsProcessed;

      console.log(`   ✅ Success: ${result.monthsProcessed} months refolded`);
    } catch (error) {
      console.error(
        `   ❌ Error processing ${itemName} (Branch: ${branchId}):`,
        error.message
      );
      errors.push({
        itemId,
        branchId,
        itemName,
        itemCode,
        error: error.message,
        stack: error.stack,
      });
      // Continue with next item (isolation - one item's failure doesn't stop others)
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 NIGHTLY RECALCULATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Items processed successfully: ${itemsProcessed}`);
  console.log(`📅 Total months refolded: ${monthsRefolded}`);
  console.log(`❌ Errors encountered: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n⚠️  ERROR DETAILS:");
    errors.forEach((e) => {
      console.log(
        `   ${e.itemName} (${e.itemCode}) - Branch ${e.branchId}: ${e.error}`
      );
    });
  }

  return {
    itemsProcessed,
    monthsRefolded,
    errors,
    success: errors.length === 0,
  };
};

/**
 * =============================================================================
 * STEP 1: FIND ALL DIRTY ITEMS
 * =============================================================================
 */

/**
 * Find all items with dirty months and group them by item + branch
 * Returns: { "itemId_branchId": { itemId, branchId, itemName, itemCode, months: [{year, month}] }, ... }
 *
 * Example return:
 * {
 *   "6901eb718b233f2c46712a51_68f9e9701a6049ffd6242950": {
 *     itemId: "6901eb718b233f2c46712a51",
 *     branchId: "68f9e9701a6049ffd6242950",
 *     itemName: "Tomato",
 *     itemCode: "T",
 *     months: [{year: 2025, month: 10}, {year: 2025, month: 11}]
 *   }
 * }
 */
export const findDirtyItems = async () => {
  // Query all monthly balance records that need recalculation
  const dirtyRecords = await ItemMonthlyBalance.find({
    needsRecalculation: true,
  })
    .select("item branch year month itemName itemCode") // Include branch
    .lean(); // Return plain JS objects (faster)

  // Group by item AND branch (composite key)
  const workMap = {};

  dirtyRecords.forEach((record) => {
    const itemId = record.item.toString();
    const branchId = record.branch.toString();
    const key = `${itemId}_${branchId}`; // Composite key

    if (!workMap[key]) {
      workMap[key] = {
        itemId,
        branchId,
        itemName: record.itemName,
        itemCode: record.itemCode,
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
 * STEP 2: PROCESS ONE ITEM-BRANCH COMBINATION
 * =============================================================================
 */

/**
 * Process all dirty months for a single item in a single branch
 * IMPORTANT:
 * - Months MUST be processed in chronological order
 * - All months processed in ONE transaction for consistency
 * - If any month fails, ALL months rollback
 *
 * FLOW DIAGRAM:
 *
 *   Sept (clean)  →  Oct (dirty)  →  Nov (dirty)
 *   closing: 100     opening: 100     opening: 85 (reads Oct's new closing)
 *                    closing: 85      closing: 65
 *
 * @param {String} itemId - MongoDB ObjectId as string
 * @param {String} branchId - MongoDB ObjectId as string
 * @param {Array} dirtyMonths - Array of {year, month} objects
 */
export const processOneItem = async (itemId, branchId, dirtyMonths) => {
  // Sort months chronologically (oldest first)
  // This is CRITICAL - we must process Jan before Feb, Feb before Mar, etc.
  dirtyMonths.sort(sortMonthsChronologically);

  let monthsProcessed = 0;

  // =========================================================================
  // START TRANSACTION FOR ALL MONTHS
  // =========================================================================
  // All months for this item-branch are processed in ONE transaction
  // This ensures November can read October's newly calculated closing
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Process each month sequentially within the same transaction
    for (const { year, month } of dirtyMonths) {
      const monthKey = formatYearMonth(year, month);
      console.log(`   🔄 Refolding ${monthKey}...`);

      try {
        await refoldMonth(itemId, branchId, year, month, session);
        monthsProcessed++;
        console.log(`      ✓ ${monthKey} completed`);
      } catch (error) {
        // If one month fails, we stop processing this item
        // because subsequent months depend on this month's closing
        console.error(`      ✗ ${monthKey} failed:`, error.message);
        throw new Error(`Failed at ${monthKey}: ${error.message}`);
      }
    }

    // =========================================================================
    // COMMIT TRANSACTION - All months succeed together
    // =========================================================================
    await session.commitTransaction();
    console.log(`   💾 All ${monthsProcessed} months committed successfully`);
  } catch (error) {
    // =========================================================================
    // ROLLBACK TRANSACTION - If any month fails, revert all changes
    // =========================================================================
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
 * STEP 3: REFOLD ONE MONTH (THE CORE ALGORITHM)
 * =============================================================================
 */

/**
 * Refold a single month for a single item in a single branch
 * This is where the magic happens!
 *
 * ALGORITHM:
 * 1. Get opening balance:
 *    a. Try previous month's closing (within same transaction)
 *    b. If no previous month, check Item Master opening stock
 *    c. If not in Item Master, default to 0
 * 2. Fetch all ledger entries for this month (chronologically)
 * 3. Fetch all adjustments for this month
 * 4. Build adjustment delta map (transactionId → total delta)
 * 5. Loop through ledger entries:
 *    a. Get base quantity from ledger
 *    b. Apply adjustment delta if exists
 *    c. Recalculate financial fields (baseAmount, taxAmount, amountAfterTax)
 *    d. Calculate new running balance
 *    e. Track totalIn and totalOut
 * 6. Update database (within passed transaction):
 *    a. Update all ledger entries with new balances and amounts
 *    b. Update monthly balance summary
 *    c. Cascade to next month if needed
 *
 * @param {String} itemId - MongoDB ObjectId as string
 * @param {String} branchId - MongoDB ObjectId as string
 * @param {Number} year - Year (e.g., 2025)
 * @param {Number} month - Month (1-12)
 * @param {Object} session - MongoDB session (transaction context)
 */
export const refoldMonth = async (itemId, branchId, year, month, session) => {
  const monthKey = formatYearMonth(year, month);

  // =========================================================================
  // STEP 3.1: Get opening balance (previous month's closing OR Item Master)
  // =========================================================================
  const prevMonth = getPreviousMonth(year, month);
  const prevMonthRecord = await ItemMonthlyBalance.findOne({
    item: itemId,
    branch: branchId,
    year: prevMonth.year,
    month: prevMonth.month,
  })
    .select("closingStock")
    .session(session) // ✨ Read within transaction to get latest data
    .lean();

  let openingStock = 0; // Default fallback

  if (prevMonthRecord) {
    // Previous month exists - use its closing as this month's opening
    openingStock = prevMonthRecord.closingStock;
    console.log(`      📊 Opening from previous month: ${openingStock}`);
  } else {
    // No previous month - this is the first month for this item in this branch
    // Check Item Master for configured opening stock
    console.log(`      ℹ️  No previous month, checking Item Master...`);

    try {
      const itemMaster = await ItemMaster.findOne({
        _id: itemId,
        "stock.branch": branchId,
      })
        .select("itemName itemCode stock")
        .lean();

      if (itemMaster && itemMaster.stock) {
        const branchStock = itemMaster.stock.find(
          (s) => s.branch.toString() === branchId.toString()
        );

        if (branchStock && branchStock.openingStock !== undefined) {
          openingStock = branchStock.openingStock;
          console.log(
            `      📦 Opening from Item Master (${itemMaster.itemName}): ${openingStock}`
          );
        } else {
          console.log(
            `      ⚠️  Branch not found in Item Master stock array, using 0`
          );
        }
      } else {
        console.log(
          `      ⚠️  Item not found in Item Master or no stock data, using 0`
        );
      }
    } catch (error) {
      console.error(`      ❌ Error fetching Item Master:`, error.message);
      console.log(`      ℹ️  Defaulting to 0 as opening balance`);
      // Keep openingStock = 0 (already set)
    }
  }

  console.log(`      ✅ Final opening balance: ${openingStock}`);

  // =========================================================================
  // STEP 3.2: Fetch all ledger entries for this month
  // =========================================================================
  const { startDate, endDate } = getMonthDateRange(year, month);

  const ledgerEntries = await ItemLedger.find({
    item: itemId,
    branch: branchId,
    transactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
  })
    .sort({ transactionDate: 1, createdAt: 1 }) // Chronological order
    .lean();

  console.log(`      📝 Found ${ledgerEntries.length} ledger entries`);

  // =========================================================================
  // STEP 3.3: Fetch all adjustments for this month
  // =========================================================================
  const adjustments = await Adjustment.find({
    "itemAdjustments.item": itemId,
    branch: branchId,
    originalTransactionDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: "active", // Only active adjustments
    isReversed: false, // Ignore reversed adjustments
  }).lean();

  console.log(`      🔧 Found ${adjustments.length} adjustments`);

  // =========================================================================
  // STEP 3.4: Build adjustment delta map
  // =========================================================================
  // Structure: { transactionId: totalQuantityDelta }
  // If same transaction adjusted multiple times, we sum all deltas
  const adjustmentMap = buildAdjustmentDeltaMap(adjustments, itemId);

  if (Object.keys(adjustmentMap).length > 0) {
    console.log(
      `      📊 Adjustments affect ${
        Object.keys(adjustmentMap).length
      } transactions`
    );
  }

  // =========================================================================
  // STEP 3.5: Recalculate running balances AND financial fields
  // =========================================================================
  // Important: When quantity changes via adjustment, all financial fields
  // must be recalculated: baseAmount, taxAmount, amountAfterTax
  let runningBalance = openingStock;
  let totalStockIn = 0;
  let totalStockOut = 0;
  const ledgerUpdates = []; // Store updates for batch processing

  for (const entry of ledgerEntries) {
    // Get base quantity from ledger entry
    let effectiveQuantity = entry.quantity;
    let effectiveRate = entry.rate || 0; // Original rate per unit

    // Apply adjustment delta if this transaction was adjusted
    const txId = entry.transactionId.toString();
    if (adjustmentMap[txId]) {
      const delta = adjustmentMap[txId];
      effectiveQuantity += delta;
      console.log(
        `🔧 Tx ${entry.transactionNumber}: ${entry.quantity} + ${delta} = ${effectiveQuantity}`
      );
    }

    // =========================================================================
    // Recalculate financial fields based on effective quantity
    // =========================================================================
    // Formula: baseAmount = rate × effectiveQuantity
    // Use Math.abs() because amount is always positive (quantity can be negative for returns)
    const recalculatedBaseAmount = effectiveRate * Math.abs(effectiveQuantity);

    // Tax calculations (preserve original tax rate)
    const taxRate = entry.taxRate || 0;
    const recalculatedTaxAmount = (recalculatedBaseAmount * taxRate) / 100;
    const recalculatedAmountAfterTax =
      recalculatedBaseAmount + recalculatedTaxAmount;

    // Calculate stock movement based on type (in vs out)
    if (entry.movementType === "in") {
      // Purchase, sales return, credit note, etc. - stock increases
      runningBalance += effectiveQuantity;
      totalStockIn += effectiveQuantity;
    } else {
      // Sale, purchase return, debit note, etc. - stock decreases
      runningBalance -= effectiveQuantity;
      totalStockOut += effectiveQuantity;
    }

    // Store update for this ledger entry (including all recalculated fields)
    ledgerUpdates.push({
      _id: entry._id,
      quantity: effectiveQuantity, // ✨ Updated quantity (base + delta)
      runningStockBalance: runningBalance,
      baseAmount: recalculatedBaseAmount, // ✨ Recalculated
      taxAmount: recalculatedTaxAmount, // ✨ Recalculated
      amountAfterTax: recalculatedAmountAfterTax, // ✨ Recalculated
    });

    // Enhanced logging for financial changes
    if (adjustmentMap[txId]) {
      console.log(
        `         💰 Amount: ${entry.baseAmount.toFixed(
          2
        )} → ${recalculatedBaseAmount.toFixed(2)} (Δ: ${(
          recalculatedBaseAmount - entry.baseAmount
        ).toFixed(2)})`
      );
    }
  }

  const closingStock = runningBalance;

  console.log(
    `      📊 Closing balance: ${closingStock} (In: ${totalStockIn}, Out: ${totalStockOut})`
  );

  // =========================================================================
  // STEP 3.6: Update database (within passed transaction)
  // =========================================================================
  // Note: We don't start a new transaction here - we use the one passed from processOneItem
  // This ensures all months are updated atomically
  try {
    // Update all ledger entries with new running balances AND financial fields
    for (const update of ledgerUpdates) {
      await ItemLedger.updateOne(
        { _id: update._id },
        {
          quantity: update.quantity, // ✨ Updated quantity (base + delta)
          runningStockBalance: update.runningStockBalance,
          baseAmount: update.baseAmount, // ✨ Recalculated based on new quantity
          taxAmount: update.taxAmount, // ✨ Recalculated
          amountAfterTax: update.amountAfterTax, // ✨ Recalculated
        },
        { session } // ✨ Use passed session
      );
    }

    // Update monthly balance summary
    await ItemMonthlyBalance.updateOne(
      {
        item: itemId,
        branch: branchId,
        year: year,
        month: month,
      },
      {
        openingStock: openingStock,
        closingStock: closingStock,
        totalStockIn: totalStockIn,
        totalStockOut: totalStockOut,
        needsRecalculation: false, // Mark as clean
        lastUpdated: new Date(),
      },
      { session } // ✨ Use passed session
    );

    // =========================================================================
    // STEP 3.7: Cascade to next month
    // =========================================================================
    // If this month's closing changed, next month's opening is affected
    // Mark next month as dirty so it gets reprocessed
    const nextMonth = getNextMonth(year, month);

    const nextMonthExists = await ItemMonthlyBalance.findOne({
      item: itemId,
      branch: branchId,
      year: nextMonth.year,
      month: nextMonth.month,
    }).session(session); // ✨ Use passed session

    if (nextMonthExists) {
      await ItemMonthlyBalance.updateOne(
        {
          item: itemId,
          branch: branchId,
          year: nextMonth.year,
          month: nextMonth.month,
        },
        { needsRecalculation: true },
        { session } // ✨ Use passed session
      );
      console.log(
        `      ⚠️  Marked ${formatYearMonth(
          nextMonth.year,
          nextMonth.month
        )} as dirty (cascade)`
      );
    }

    console.log(`      ✅ Month data updated`);
  } catch (error) {
    console.error(`      ❌ Update failed:`, error.message);
    throw error; // Propagate error to processOneItem for rollback
  }
};

/**
 * =============================================================================
 * HELPER FUNCTION: Build Adjustment Delta Map
 * =============================================================================
 */

/**
 * Build a map of transaction adjustments
 * Handles multiple adjustments to the same transaction
 *
 * @param {Array} adjustments - Array of adjustment documents
 * @param {String} itemId - Item we're processing
 * @returns {Object} - Map of { transactionId: totalDelta }
 *
 * Example:
 * Transaction ABC adjusted twice:
 * - First adjustment: +5 KGS
 * - Second adjustment: +3 KGS
 * Result: { "ABC": 8 }
 */
function buildAdjustmentDeltaMap(adjustments, itemId) {
  const deltaMap = {};

  adjustments.forEach((adjustment) => {
    const txId = adjustment.originalTransaction.toString();

    // Find the item adjustment within this adjustment record
    const itemAdjustment = adjustment.itemAdjustments.find(
      (ia) => ia.item.toString() === itemId
    );

    if (itemAdjustment && itemAdjustment.quantityDelta) {
      // If this transaction already has deltas, sum them
      if (!deltaMap[txId]) {
        deltaMap[txId] = 0;
      }
      deltaMap[txId] += itemAdjustment.quantityDelta;
    }
  });

  return deltaMap;
}
