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
import StockAdjustment from "../../model/StockAdjustmentModel.js";
import mongoose from "mongoose";

// Map transaction types to their respective models
const TRANSACTION_MODELS = {
  sale: SalesModel,
  purchase: PurchaseModel,
  sales_return: SalesReturnModel,
  purchase_return: PurchaseReturnModel,
  receipt: ReceiptModel,
  payment: PaymentModel,
  stock_adjustment: StockAdjustment,
};

const TRANSACTION_DISPLAY_NAMES = {
  sale: "Sales",
  purchase: "Purchase",
  sales_return: "Sales Return",
  purchase_return: "Purchase Return",
  receipt: "Receipt",
  payment: "Payment",
  stock_adjustment: "Stock Adjustment",
};

// Define which transactions use specific amount fields
const FUND_TRANSACTION_TYPES = ['receipt', 'payment'];
const STOCK_ADJUSTMENT_TYPE = 'stock_adjustment';

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
    
    // Determine the field name for the amount
    let amountField = 'netAmount'; // Default for sales/purchase
    if (FUND_TRANSACTION_TYPES.includes(transactionType)) {
      amountField = 'amount';
    } else if (transactionType === STOCK_ADJUSTMENT_TYPE) {
      amountField = 'totalAmount';
    }

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
      const searchConditions = [
        { transactionNumber: { $regex: search, $options: "i" } },
      ];
      
      // Stock adjustment doesn't have accountName/email usually, so conditionally add those
      if (transactionType !== STOCK_ADJUSTMENT_TYPE) {
        searchConditions.push(
          { accountName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        );
      }
      
      query.$or = searchConditions;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build select fields dynamically
    let selectFields = `transactionNumber transactionDate ${amountField} status isCancelled`;
    
    // Add extra fields only if NOT stock adjustment
    if (transactionType !== STOCK_ADJUSTMENT_TYPE) {
      selectFields += ' accountName phone email paymentStatus';
    }

    // Fetch transactions with pagination
    const rawTransactions = await Model.find(query)
      .select(selectFields)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Normalize transactions
    const transactions = rawTransactions.map(txn => {
      const normalizedTxn = { ...txn };

      // 1. Normalize Amount Field -> 'netAmount'
      if (transactionType === STOCK_ADJUSTMENT_TYPE) {
        normalizedTxn.netAmount = txn.totalAmount;
        delete normalizedTxn.totalAmount;
        
        // 2. Set Account Name for Stock Adjustment
        normalizedTxn.accountName = "Stock Adjustment";
        
      } else if (FUND_TRANSACTION_TYPES.includes(transactionType)) {
        normalizedTxn.netAmount = txn.amount;
        delete normalizedTxn.amount;
      }
      
      return normalizedTxn;
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
