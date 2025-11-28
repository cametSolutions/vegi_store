import mongoose from "mongoose";
import ItemLedger from "../../model/ItemsLedgerModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";


// Replace getItemLedgerDashboard with this - shows ALL individual ledgers
export const getItemLedgerReport = async (req, res) => {
  try {
    const { companyId, branchId, itemId, startDate, endDate, page = 1, limit = 100 } = req.query;
    
    const match = { 
      company: new mongoose.Types.ObjectId(companyId), // companyId,
      transactionDate: { $exists: true }
    };
    
    if (branchId) match.branch = new mongoose.Types.ObjectId(branchId); // branchId;
    if (itemId) match.item = itemId;
    if (startDate && endDate) {
      match.transactionDate = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const pipeline = [
      { $match: match },
      // Lookup ItemMaster and Branch details
      {
        $lookup: {
          from: "itemmasters",
          localField: "item",
          foreignField: "_id",
          as: "itemMaster",
          pipeline: [{ $project: { itemName: 1, itemCode: 1 } }]
        }
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchMaster",
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: "$itemMaster", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$branchMaster", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          itemId: "$item",
          itemName: { 
            $ifNull: ["$itemMaster.itemName", "$itemName", "Unknown"] 
          },
          itemCode: { 
            $ifNull: ["$itemMaster.itemCode", "$itemCode", "UNK"] 
          },
          branchName: { $ifNull: ["$branchMaster.name", "Unknown"] },
          transactionNumber: 1,
          transactionDate: 1,
          transactionType: 1,
          movementType: 1,
          quantity: { $round: ["$quantity", 3] },
          rate: { $round: ["$rate", 2] },
          baseAmount: { $round: ["$baseAmount", 2] },
          amountAfterTax: { $round: ["$amountAfterTax", 2] },
          runningStockBalance: { $round: ["$runningStockBalance", 3] },
          unit: 1
        }
      },
      { $sort: { 
        itemName: 1, 
        itemCode: 1, 
        branchName: 1,
        transactionDate: 1  // Chronological order within item
      } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const [ledgers, total] = await Promise.all([
      ItemLedger.aggregate(pipeline),
      ItemLedger.countDocuments(match)
    ]);

    res.json({
      success: true,
      data: ledgers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getItemMonthlyReport = async (req, res) => {
  try {
    const { companyId, branchId, itemId, year, page = 1, limit = 200 } = req.query;
    
    const match = { company: new mongoose.Types.ObjectId(companyId) }; // company: companyId };
    
    if (branchId) match.branch =  new mongoose.Types.ObjectId(branchId); // branchId;
    if (itemId) match.item = itemId;
    if (year) match.year = parseInt(year);

    const pipeline = [
      { $match: match },
      // Lookup ItemMaster and Branch
      {
        $lookup: {
          from: "itemmasters",
          localField: "item",
          foreignField: "_id",
          as: "itemMaster",
          pipeline: [{ $project: { itemName: 1, itemCode: 1 } }]
        }
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchMaster",
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: "$itemMaster", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$branchMaster", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          itemId: "$item",
          itemName: { $ifNull: ["$itemMaster.itemName", "$itemName", "Unknown"] },
          itemCode: { $ifNull: ["$itemMaster.itemCode", "$itemCode", "UNK"] },
          branchName: { $ifNull: ["$branchMaster.name", "Unknown"] },
          year: 1,
          month: 1,
          periodKey: 1,
          openingStock: { $round: ["$openingStock", 3] },
          totalStockIn: { $round: ["$totalStockIn", 3] },
          totalStockOut: { $round: ["$totalStockOut", 3] },
          closingStock: { $round: ["$closingStock", 3] },
          transactionCount: 1,
          needsRecalculation: 1,
          lastUpdated: 1
        }
      },
      { 
        $sort: { 
          itemName: 1, 
          itemCode: 1,
          branchName: 1,
          year: -1,    // Latest year first
          month: -1    // Latest month first within year
        } 
      },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const [monthlyData, total] = await Promise.all([
      ItemMonthlyBalance.aggregate(pipeline),
      ItemMonthlyBalance.countDocuments(match)
    ]);

    res.json({
      success: true,
      data: monthlyData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
