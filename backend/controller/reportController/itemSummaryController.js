// controllers/ItemLedgerController.js
import {
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists,
  getBatchOpeningBalances,
} from "../../services/itemLedger/ItemLedgerService.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import mongoose from "mongoose";

export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Get Item Summary Report
 *
 * Main controller that routes to appropriate service based on data conditions:
 *
 * PATH 1 (FAST): Report starts on 1st, all items clean, no adjustments
 *   → getSimpleLedgerReport() → ~150-200ms
 *
 * PATH 2 (HYBRID): Report mid-month but no adjustments in report period
 *   → getHybridLedgerReport() → ~220-280ms
 *
 * PATH 3 (FULL REFOLD): Missing data or adjustments in report period
 *   → refoldLedgersWithAdjustments() → ~300-350ms
 *
 * Item inclusion logic:
 * - Items WITH transactions in report period   → full service result (opening + movement)
 * - Items WITH transactions OUTSIDE period     → getBatchOpeningBalances + zero movement
 * - Items with NO transactions ever            → masterOpeningStock + zero everything
 *
 * Stock Movement Logic (when transactionType is NOT specified):
 * - INWARD:  Purchase + Sales Return  (stock coming in)
 * - OUTWARD: Sale + Purchase Return   (stock going out)
 *
 * @route GET /api/items/summary-report
 * @query {string} company        - Company ID (required)
 * @query {string} branch         - Branch ID (required)
 * @query {string} startDate      - Report start date ISO string (required)
 * @query {string} endDate        - Report end date ISO string (required)
 * @query {string} [transactionType] - Filter: 'sale' | 'purchase' | null
 * @query {number} [page=1]       - Page number for pagination
 * @query {number} [limit=50]     - Items per page (max 200)
 * @query {string} [searchTerm]   - Search items by name or code
 * @returns {Object} JSON response with items, pagination, filters
 */
export const getItemSummaryReport = async (req, res) => {
  const startTime = Date.now();

  try {
    /* -----------------------------------------------------------------------
       STEP 1: Extract and validate parameters
       ----------------------------------------------------------------------- */
    const {
      startDate,
      endDate,
      company,
      branch,
      transactionType,
      page = 1,
      limit = 50,
      searchTerm,
    } = req.query;

    if (!startDate || !endDate || !company || !branch) {
      return res.status(400).json({
        error: "Missing required parameters: startDate, endDate, company, branch",
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    /* -----------------------------------------------------------------------
       STEP 2: Paginate from ItemMaster (source of truth for pagination)
       ----------------------------------------------------------------------- */
    const masterMatch = {
      company: company,
      "stock.branch": toObjectId(branch),
      status: "active",
    };

    if (searchTerm?.trim()) {
      const regex = new RegExp(searchTerm.trim(), "i");
      masterMatch.$or = [
        { itemName: regex },
        { itemCode: regex },
      ];
    }

    const [totalMasterItems, itemMasterPage] = await Promise.all([
      ItemMasterModel.countDocuments(masterMatch),
      ItemMasterModel.find(masterMatch, {
        _id: 1,
        itemName: 1,
        itemCode: 1,
        unit: 1,
        stock: 1,
      })
        .sort({ itemName: 1, itemCode: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    if (totalMasterItems === 0) {
      return res.json({
        items: [],
        pagination: { page: pageNum, limit: limitNum, totalItems: 0, totalPages: 0 },
        filters: {
          company,
          branch,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          transactionType: transactionType || "all",
          searchTerm: searchTerm || null,
        },
        _debug: { executionTimeMs: Date.now() - startTime, pathUsed: "EMPTY" },
      });
    }

    // Build master maps (keyed by itemId string)
    const masterDataMap = {};
    const masterOpeningMap = {};
    itemMasterPage.forEach((im) => {
      const stockRow = (im.stock || []).find(
        (s) => s.branch.toString() === branch.toString()
      );
      masterOpeningMap[im._id.toString()] = stockRow?.openingStock || 0;
      masterDataMap[im._id.toString()] = im;
    });

    const pageItemIds = itemMasterPage.map((im) => im._id.toString());

    /* -----------------------------------------------------------------------
       STEP 3: Determine path using dirty check on ALL page items
       ----------------------------------------------------------------------- */
    const dirtyStatus = await checkIfDirtyPeriodExists({
      company,
      branch,
      itemIds: pageItemIds,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });

    /* -----------------------------------------------------------------------
       STEP 4: Call appropriate service — scoped to pageItemIds
       Services return only items that have transactions in the report period.
       Items with zero movement in this period are NOT returned by services.
       ----------------------------------------------------------------------- */
    const serviceParams = {
      company,
      branch,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      transactionType: transactionType || null,
      itemIds: pageItemIds,  // scope to current page
      page: 1,               // internal pagination not needed, already paged via master
      limit: limitNum,
      searchTerm: null,      // search already applied on ItemMaster
    };

    let serviceResult;
    let pathUsed;

    if (!dirtyStatus.isDirty) {
      console.log("🚀 Using FAST PATH");
      pathUsed = "FAST_PATH";
      serviceResult = await getSimpleLedgerReport(serviceParams);

    } else if (!dirtyStatus.needsFullRefold) {
      console.log("⚡ Using HYBRID PATH");
      pathUsed = "HYBRID_PATH";
      serviceResult = await getHybridLedgerReport(serviceParams);

    } else {
      console.log("🔄 Using FULL REFOLD");
      pathUsed = "FULL_REFOLD";
      serviceResult = await refoldLedgersWithAdjustments(serviceParams);
    }

    /* -----------------------------------------------------------------------
       STEP 5: Find which page items are missing from service result
       These are items with no transactions in the report period.
       ----------------------------------------------------------------------- */
    const serviceItemMap = {};
    serviceResult.items.forEach((item) => {
      serviceItemMap[item._id.toString()] = item;
    });

    const missingItemIds = pageItemIds.filter((id) => !serviceItemMap[id]);

    /* -----------------------------------------------------------------------
       STEP 6: For missing items, check if they have ANY transactions ever
       (across all dates — not just the report period)
       - If yes → item exists in ledger history, calculate correct opening
       - If no  → brand new item, zero everything
       ----------------------------------------------------------------------- */
    let correctOpeningsForMissing = {};
    let itemsWithAnyTxn = new Set();

    if (missingItemIds.length > 0) {
      // Single distinct query — no date filter, checks entire ledger history
      const txnCheck = await ItemLedger.distinct("item", {
        company: company,
        branch: branch,
        item: { $in: missingItemIds.map((id) => toObjectId(id)) },
      });

      itemsWithAnyTxn = new Set(txnCheck.map((id) => id.toString()));

      // For items with historical transactions, calculate correct opening
      // as of report start date (accounts for all prior movements)
      if (itemsWithAnyTxn.size > 0) {
        correctOpeningsForMissing = await getBatchOpeningBalances(
          company,
          branch,
          [...itemsWithAnyTxn],
          parsedStartDate,
        );
      }
    }

    /* -----------------------------------------------------------------------
       STEP 7: Build final items array — loop ItemMaster page to maintain
       alphabetical order (ItemMaster is the sort authority)
       ----------------------------------------------------------------------- */
    const items = pageItemIds.map((idStr) => {
      const master = masterDataMap[idStr];

      // Case 1: Has transactions in report period — full service result
      const serviceItem = serviceItemMap[idStr];
      if (serviceItem) {
        return {
          itemId: serviceItem._id,
          itemName: serviceItem.itemName,
          itemCode: serviceItem.itemCode,
          unit: serviceItem.unit,
          openingQuantity: serviceItem.openingQuantity,
          totalIn: serviceItem.summary.totalIn,
          totalOut: serviceItem.summary.totalOut,
          amountIn: serviceItem.summary.amountIn,
          amountOut: serviceItem.summary.amountOut,
          closingQuantity: serviceItem.summary.closingQuantity,
          lastPurchaseRate: serviceItem.summary.lastPurchaseRate,
          closingBalance: serviceItem.summary.closingBalance,
          transactionCount: serviceItem.summary.transactionCount,
        };
      }

      // Case 2: Has transactions in OTHER periods — correct opening, zero movement this period
      if (itemsWithAnyTxn.has(idStr)) {
        const openingQty = correctOpeningsForMissing[idStr] ?? masterOpeningMap[idStr] ?? 0;
        return {
          itemId: master._id,
          itemName: master.itemName,
          itemCode: master.itemCode,
          unit: master.unit,
          openingQuantity: openingQty,
          totalIn: 0,
          totalOut: 0,
          amountIn: 0,
          amountOut: 0,
          closingQuantity: openingQty,  // no movement in this period → closing = opening
          lastPurchaseRate: 0,
          closingBalance: 0,
          transactionCount: 0,
        };
      }

      // Case 3: No transactions ever — brand new item, zero everything
      const openingQty = masterOpeningMap[idStr] || 0;
      return {
        itemId: master._id,
        itemName: master.itemName,
        itemCode: master.itemCode,
        unit: master.unit,
        openingQuantity: openingQty,
        totalIn: 0,
        totalOut: 0,
        amountIn: 0,
        amountOut: 0,
        closingQuantity: openingQty,
        lastPurchaseRate: 0,
        closingBalance: 0,
        transactionCount: 0,
      };
    });

    /* -----------------------------------------------------------------------
       STEP 8: Send response
       ----------------------------------------------------------------------- */
    const executionTime = Date.now() - startTime;
    console.log(`✅ Item Summary Report - ${items.length} items in ${executionTime}ms (${pathUsed})`);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalMasterItems,
        totalPages: Math.ceil(totalMasterItems / limitNum),
      },
      filters: {
        company,
        branch,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        transactionType: transactionType || "all",
        searchTerm: searchTerm || null,
      },
      ...(process.env.NODE_ENV === "development" && {
        _debug: {
          executionTimeMs: executionTime,
          pathUsed,
          reason: dirtyStatus.reason,
          masterItemCount: totalMasterItems,
          serviceItemCount: serviceResult.items.length,
          missingItemCount: missingItemIds.length,
          itemsWithHistoricalTxn: itemsWithAnyTxn.size,
          trulyNewItems: missingItemIds.length - itemsWithAnyTxn.size,
        },
      }),
    });

  } catch (error) {
    console.error("❌ getItemSummaryReport error:", error);
    res.status(500).json({
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};
