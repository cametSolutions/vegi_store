// controllers/ItemLedgerController.js
import { refoldLedgersWithAdjustments } from "../../services/ItemLedgerService.js";

export const getItemSummaryReport = async (req, res) => {
  const startTime = Date.now();
  
  try {
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

    const serviceResult = await refoldLedgersWithAdjustments({
      company,
      branch,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      transactionType: transactionType || null,
      page: pageNum,
      limit: limitNum,
      searchTerm: searchTerm?.trim() || null,
    });

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
    
    console.log(`✅ Item Summary Report - ${shapedItems.length} items in ${executionTime}ms`);

    res.json({
      items: shapedItems,
      pagination: serviceResult.pagination,
      filters: serviceResult.filters,
      ...(process.env.NODE_ENV === 'development' && {
        _debug: { executionTimeMs: executionTime }
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
