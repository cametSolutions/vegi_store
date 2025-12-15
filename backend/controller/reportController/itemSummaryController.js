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
   
    const { startDate, endDate,company, branch } = req.query;

    const result = await refoldLedgersWithAdjustments({
      company,
      branch,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      groupBy: 'item'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

