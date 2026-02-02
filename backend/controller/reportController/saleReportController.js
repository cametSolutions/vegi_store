import {
  SalesModel,
  PurchaseModel,
  SalesReturnModel,
  PurchaseReturnModel,
} from "../../model/TransactionModel.js";
import {
  ReceiptModel,
  PaymentModel
} from "../../model/FundTransactionMode.js";

import mongoose from "mongoose";

// Map transaction types to their respective models
const TRANSACTION_MODELS = {
  sale: SalesModel,
  purchase: PurchaseModel,
  sales_return: SalesReturnModel,
  purchase_return: PurchaseReturnModel,
  receipt: ReceiptModel,
  payment: PaymentModel,
};

const TRANSACTION_DISPLAY_NAMES = {
  sale: "Sales",
  purchase: "Purchase",
  sales_return: "Sales Return",
  purchase_return: "Purchase Return",
  receipt: "Receipt",
  payment: "Payment",
};

// Define which transactions use 'amount' instead of 'netAmount'
const FUND_TRANSACTION_TYPES = ['receipt', 'payment'];

/**
 * Common controller for all transaction summaries
 */
export const getTransactionSummary = async (req, res) => {
  try {
    const { companyId, branchId, transactionType } = req.params;
    console.log("params", req.params);
    const { page = 1, limit = 50, startDate, endDate, search = "" } = req.query;

    // Validate transaction type
    if (!TRANSACTION_MODELS[transactionType]) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction type. Must be one of: ${Object.keys(TRANSACTION_MODELS).join(", ")}`,
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(companyId) ||
      !mongoose.Types.ObjectId.isValid(branchId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch ID",
      });
    }

    // Get the appropriate model
    const Model = TRANSACTION_MODELS[transactionType];
    
    // Determine if this is a fund transaction (receipt/payment)
    const isFundTransaction = FUND_TRANSACTION_TYPES.includes(transactionType);
    const amountField = isFundTransaction ? 'amount' : 'netAmount';

    // Build query with ObjectId conversion
    const query = {
      company: new mongoose.Types.ObjectId(companyId),
      branch: new mongoose.Types.ObjectId(branchId),
      transactionType: transactionType,
      // isCancelled: false,
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

    // Build select fields dynamically
    const selectFields = `transactionNumber transactionDate accountName phone email ${amountField} status paymentStatus isCancelled`;

    // Fetch transactions with pagination
    const rawTransactions = await Model.find(query)
      .select(selectFields)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Normalize transactions to always have 'netAmount' field
    const transactions = rawTransactions.map(txn => {
      if (isFundTransaction) {
        return {
          ...txn,
          netAmount: txn.amount,
          amount: undefined, // Remove the original 'amount' field
        };
      }
      return txn;
    });

    // Get total count
    const totalRecords = await Model.countDocuments(query);

    // Calculate total amount using aggregation
    const totalAmountResult = await Model.aggregate([
      {
        $match: {
          ...query,
          isCancelled: false,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: `$${amountField}` },
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
