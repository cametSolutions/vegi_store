import { SalesModel, PurchaseModel, SalesReturnModel, PurchaseReturnModel } from "../../model/TransactionModel.js";
import mongoose from "mongoose";

// Map transaction types to their respective models

const TRANSACTION_MODELS = {
  sale: SalesModel,
  purchase: PurchaseModel,
  sales_return: SalesReturnModel,
  purchase_return: PurchaseReturnModel,
};

const TRANSACTION_DISPLAY_NAMES = {
  sale: "Sales",
  purchase: "Purchase",
  sales_return: "Sales Return",
  purchase_return: "Purchase Return",
};
/**
 * Common controller for all transaction summaries
 */
export const getTransactionSummary = async (req, res) => {
  try {
    const { companyId, branchId, transactionType } = req.params;
    console.log("params",req.params)
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      search = "",
    } = req.query;

    // Validate transaction type
    if (!TRANSACTION_MODELS[transactionType]) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction type. Must be one of: ${Object.keys(TRANSACTION_MODELS).join(", ")}`,
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(companyId) || 
        !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch ID",
      });
    }

    // Get the appropriate model
    const Model = TRANSACTION_MODELS[transactionType];

    // Build query with ObjectId conversion
    const query = {
      company: new mongoose.Types.ObjectId(companyId),
      branch: new mongoose.Types.ObjectId(branchId),
      transactionType: transactionType,
    };

    // Date filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = endDateTime;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: "i" } },
        { accountName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch transactions with pagination
    const transactions = await Model.find(query)
      .select(
        "transactionNumber transactionDate accountName phone email netAmount totalAmountAfterTax status paymentStatus"
      )
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count
    const totalRecords = await Model.countDocuments(query);

    // Calculate total amount using aggregation
    const totalAmountResult = await Model.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$netAmount" },
        },
      },
    ]);

    const totalAmount = totalAmountResult[0]?.totalAmount || 0;

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit)),
        currentPage: Number(page),
        pageSize: Number(limit),
        totalAmount,
        transactionType,
        transactionTypeName: TRANSACTION_DISPLAY_NAMES[transactionType],
      },
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transaction summary",
    });
  }
};
