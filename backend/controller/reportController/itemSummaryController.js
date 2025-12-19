// controllers/ItemLedgerController.js
import { 
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
} from "../../services/itemLedger/ItemLedgerService.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";

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

    // Validation
    if (!startDate || !endDate || !company || !branch) {
      return res.status(400).json({ 
        error: "Missing required parameters: startDate, endDate, company, branch" 
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    /* -----------------------------------------------------------------------
       STEP 2: Get item IDs for dirty check (quick query)
       Need to know which items before checking if dirty
       ----------------------------------------------------------------------- */
    const baseMatch = {
      company: company,
      branch: branch,
      transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate },
    };

    if (transactionType === "sale") {
      baseMatch.transactionType = { $in: ["sale", "sales_return"] };
    } else if (transactionType === "purchase") {
      baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
    }

    const itemIdsForCheck = await ItemLedger.distinct("item", baseMatch);

    // Handle empty result
    if (itemIdsForCheck.length === 0) {
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
        _debug: {
          executionTimeMs: Date.now() - startTime,
          pathUsed: "EMPTY"
        }
      });
    }

    /* -----------------------------------------------------------------------
       STEP 3: Check dirty period status
       Determines which path to use
       ----------------------------------------------------------------------- */
    const dirtyStatus = await checkIfDirtyPeriodExists({
      company,
      branch,
      itemIds: itemIdsForCheck.map(id => id.toString()),
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });

    let serviceResult;
    let pathUsed;

    /* -----------------------------------------------------------------------
       STEP 4: Route to appropriate service based on dirty status
       ----------------------------------------------------------------------- */
    if (!dirtyStatus.isDirty) {
      /* -------------------------------------------------------------------
         PATH 1: FAST PATH
         Conditions met:
         - Report starts on 1st of month
         - All items have clean monthly balance
         - No adjustments in report period
         ------------------------------------------------------------------- */
      console.log('🚀 Using FAST PATH');
      pathUsed = "FAST_PATH";
      
      serviceResult = await getSimpleLedgerReport({
        company,
        branch,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        transactionType: transactionType || null,
        page: pageNum,
        limit: limitNum,
        searchTerm: searchTerm?.trim() || null,
      });
      
    } else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
      /* -------------------------------------------------------------------
         PATH 2: HYBRID PATH
         Conditions:
         - Opening needs calculation (mid-month or other reason)
         - BUT no adjustments in report period
         ------------------------------------------------------------------- */
      console.log('⚡ Using HYBRID PATH (opening calc + simple ledger)');
      pathUsed = "HYBRID_PATH";
      
      serviceResult = await getHybridLedgerReport({
        company,
        branch,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        transactionType: transactionType || null,
        page: pageNum,
        limit: limitNum,
        searchTerm: searchTerm?.trim() || null,
      });
      
    } else {
      /* -------------------------------------------------------------------
         PATH 3: FULL REFOLD
         Conditions:
         - Items missing monthly balance
         - OR adjustments exist in report period
         ------------------------------------------------------------------- */
      console.log('🔄 Using FULL REFOLD');
      pathUsed = "FULL_REFOLD";
      
      serviceResult = await refoldLedgersWithAdjustments({
        company,
        branch,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        transactionType: transactionType || null,
        page: pageNum,
        limit: limitNum,
        searchTerm: searchTerm?.trim() || null,
      });
    }

    /* -----------------------------------------------------------------------
       STEP 5: Shape response (same format for all paths)
       Controller doesn't care which path was used - format is identical
       ----------------------------------------------------------------------- */
    const shapedItems = serviceResult.items.map((item) => {
      const { summary } = item;

      return {
        itemId: item._id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        openingQuantity: item.openingQuantity,
        totalIn: summary.totalIn,
        totalOut: summary.totalOut,
        amountIn: summary.amountIn,
        amountOut: summary.amountOut,
        closingQuantity: summary.closingQuantity,
        lastPurchaseRate: summary.lastPurchaseRate,
        closingBalance: summary.closingBalance,
        transactionCount: summary.transactionCount,
      };
    });

    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Item Summary Report - ${shapedItems.length} items in ${executionTime}ms (${pathUsed})`);

    /* -----------------------------------------------------------------------
       STEP 6: Send response
       ----------------------------------------------------------------------- */
    res.json({
      items: shapedItems,
      pagination: serviceResult.pagination,
      filters: serviceResult.filters,
      // Include debug info in development
      ...(process.env.NODE_ENV === 'development' && {
        _debug: { 
          executionTimeMs: executionTime,
          pathUsed: pathUsed,
          reason: dirtyStatus.reason
        }
      })
    });
  } catch (error) {
    console.error("❌ getItemSummaryReport error:", error);
    res.status(500).json({ 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    });
  }
};
