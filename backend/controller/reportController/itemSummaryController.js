// / controllers/ItemLedgerController.js
import { 
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
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
 * Stock Movement Logic (when transactionType is NOT specified):
 * - INWARD: Purchase + Sales Return (stock coming in)
 * - OUTWARD: Sale + Purchase Return (stock going out)
 * 
 * @route GET /api/items/summary-report
 * @query {string} company - Company ID (required)
 * @query {string} branch - Branch ID (required)
 * @query {string} startDate - Report start date ISO string (required)
 * @query {string} endDate - Report end date ISO string (required)
 * @query {string} [transactionType] - Filter: 'sale' | 'purchase' | null
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Items per page (max 200)
 * @query {string} [searchTerm] - Search items by name or code
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

    // Build openingStock map from ItemMaster for this branch
    // Used as fallback for items with no ledger entries
    const masterOpeningMap = {};
    const masterDataMap = {};   // full master row keyed by id
    itemMasterPage.forEach((im) => {
      const stockRow = (im.stock || []).find(
        (s) => s.branch.toString() === branch.toString()
      );
      masterOpeningMap[im._id.toString()] = stockRow?.openingStock || 0;
      masterDataMap[im._id.toString()] = im;
    });

    const pageItemIds = itemMasterPage.map((im) => im._id.toString());

    /* -----------------------------------------------------------------------
       STEP 3: Check which of these page items exist in ledger for this period
       ----------------------------------------------------------------------- */
    const baseMatch = {
      company: company,
      branch: branch,
      transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate },
      item: { $in: pageItemIds.map((id) => toObjectId(id)) },  // scoped to page
    };

    if (transactionType === "sale") {
      baseMatch.transactionType = { $in: ["sale", "sales_return"] };
    } else if (transactionType === "purchase") {
      baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
    }

    const itemIdsForCheck = await ItemLedger.distinct("item", baseMatch);

    /* -----------------------------------------------------------------------
       STEP 4: Route to service only if any page items have ledger entries
       ----------------------------------------------------------------------- */
    let ledgerItemMap = {};  // keyed by itemId string → shaped item
    let pathUsed = "MASTER_ONLY";
    let dirtyStatus = { isDirty: false, needsFullRefold: false, reason: "no_ledger_items_on_page" };

    if (itemIdsForCheck.length > 0) {
      dirtyStatus = await checkIfDirtyPeriodExists({
        company,
        branch,
        itemIds: itemIdsForCheck.map((id) => id.toString()),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      });

      let serviceResult;

      if (!dirtyStatus.isDirty) {
        console.log("🚀 Using FAST PATH");
        pathUsed = "FAST_PATH";
        serviceResult = await getSimpleLedgerReport({
          company,
          branch,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          transactionType: transactionType || null,
          page: 1,           // ⚠️ always page 1 — we're paginating via ItemMaster
          limit: limitNum,   // same limit to cover all page items
          searchTerm: null,  // search already applied on ItemMaster
        });

      } else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
        console.log("⚡ Using HYBRID PATH");
        pathUsed = "HYBRID_PATH";
        serviceResult = await getHybridLedgerReport({
          company,
          branch,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          transactionType: transactionType || null,
          page: 1,
          limit: limitNum,
          searchTerm: null,
        });

      } else {
        console.log("🔄 Using FULL REFOLD");
        pathUsed = "FULL_REFOLD";
        serviceResult = await refoldLedgersWithAdjustments({
          company,
          branch,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          transactionType: transactionType || null,
          page: 1,
          limit: limitNum,
          searchTerm: null,
        });
      }

      // Build ledger map from service result keyed by itemId
      serviceResult.items.forEach((item) => {
        ledgerItemMap[item._id.toString()] = item;
      });
    }

    /* -----------------------------------------------------------------------
       STEP 5: Merge ItemMaster page with ledger results
       For every item on this page:
         - If ledger data exists → use it (openingQuantity + summary from service)
         - If not → use openingStock from ItemMaster, zero movement
       ----------------------------------------------------------------------- */
    const mergedItems = pageItemIds.map((idStr) => {
      const master = masterDataMap[idStr];
      const ledgerItem = ledgerItemMap[idStr];

      if (ledgerItem) {
        // Has ledger entries — use service result directly
        return {
          itemId: ledgerItem._id,
          itemName: ledgerItem.itemName,
          itemCode: ledgerItem.itemCode,
          unit: ledgerItem.unit,
          openingQuantity: ledgerItem.openingQuantity,
          totalIn: ledgerItem.summary.totalIn,
          totalOut: ledgerItem.summary.totalOut,
          amountIn: ledgerItem.summary.amountIn,
          amountOut: ledgerItem.summary.amountOut,
          closingQuantity: ledgerItem.summary.closingQuantity,
          lastPurchaseRate: ledgerItem.summary.lastPurchaseRate,
          closingBalance: ledgerItem.summary.closingBalance,
          transactionCount: ledgerItem.summary.transactionCount,
        };
      }

      // No ledger entries — opening from ItemMaster, zero movement
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
        closingQuantity: openingQty,  // no movement → closing = opening
        lastPurchaseRate: 0,
        closingBalance: 0,
        transactionCount: 0,
      };
    });

    /* -----------------------------------------------------------------------
       STEP 6: Send response
       ----------------------------------------------------------------------- */
    const executionTime = Date.now() - startTime;
    console.log(`✅ Item Summary Report - ${mergedItems.length} items in ${executionTime}ms (${pathUsed})`);

    res.json({
      items: mergedItems,
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
          ledgerItemCount: Object.keys(ledgerItemMap).length,
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

