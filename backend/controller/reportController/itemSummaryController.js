import { refoldLedgersWithAdjustments } from "../../services/ItemLedgerService.js";




// Item ledger report (single item)
export const getSingleItemSummaryReport = async (req, res) => {
  try {
    const { company, branch } = req.user; // From auth middleware
    const { itemId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await refoldLedgersWithAdjustments({
      company,
      branch,
      item: itemId,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Item summary (all items grouped)


export const getItemSummaryReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      company,
      branch,
      transactionType,  // optional: 'sale' | 'purchase'
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200); // cap limit

    const serviceResult = await refoldLedgersWithAdjustments({
      company,
      branch,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      transactionType: transactionType || null, // still used for filtering
      page: pageNum,
      limit: limitNum,
    });

    // Always generic UI shape
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
        transactionCount: summary.transactionCount,
      };
    });

    res.json({
      items: shapedItems,
      pagination: serviceResult.pagination,
      filters: serviceResult.filters,
    });
  } catch (error) {
    console.error("getItemSummaryReport error:", error);
    res.status(500).json({ error: error.message });
  }
};
