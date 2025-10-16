import mongoose from "mongoose";
import { getTransactionModel } from "../../helpers/FundTransactionHelper/FundTransactionHelper.js";
import { createFundTransaction } from "../../services/fundTransactionService.js";

/**
 * Create a new cash transaction (Receipt or Payment)
 * Handles the complete flow:
 * 1. Validate input data
 * 2. Create transaction record for party account
 * 3. Update account outstanding balance
 * 4. Settle outstanding records using FIFO
 * 5. Get Cash/Bank account from AccountMaster
 * 6. Create Cash/Bank ledger entry
 */
export const createFundTransactionController = async (req, res) => {
  try {

    const { transactionType } = req.params;

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token. Please login again.",
      });
    }

    const result = await createFundTransaction({
      ...req.body,
      transactionType: transactionType.toLowerCase(),
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: `${
        transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
      } created successfully`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (req, res) => {
  try {
    const { id, transactionType } = req.params;

    if (
      !transactionType ||
      !["receipt", "payment"].includes(transactionType.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction type (receipt/payment) is required in URL",
      });
    }

    const TransactionModel = getTransactionModel(transactionType);
    const transaction = await TransactionModel.findById(id)
      .populate("account", "accountName accountType phoneNo")
      .populate("settlementDetails.outstandingTransaction")
      .populate("company", "name")
      .populate("branch", "name");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message,
    });
  }
};

/**
 * Get all transactions with filters
 */
export const getTransactions = async (req, res) => {
  try {
    const { transactionType } = req.params;

    // Validate transaction type first
    if (
      !transactionType ||
      !["receipt", "payment"].includes(transactionType.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction type (receipt/payment) is required in URL",
      });
    }

    const TransactionModel = getTransactionModel(transactionType);

    // Get query parameters with proper defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
        const searchTerm = req.query.searchTerm || "";
    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder || "desc";
    const accountId = req.query.accountId || req.query.account;
    const company = req.query.company;
    const branch = req.query.branch;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const paymentMode = req.query.paymentMode;

    // Build sort object
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sort = {
      [sortBy]: sortDirection,
      _id: sortDirection, // Secondary sort for consistency
    };

    // Build query
    const filter  = {};


     if (searchTerm) {
      filter.$or = [
        { accountName: { $regex: searchTerm, $options: "i" } },
        { transactionNumber: { $regex: searchTerm, $options: "i" } },
      ];
    }
    if (accountId) query.account = accountId;
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (paymentMode) query.paymentMode = paymentMode;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
const result = await TransactionModel.getPaginatedTransactions(
      filter,
      page,
      limit,
      sort
    );
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      TransactionModel.find(filter)
        .select(
          "transactionNumber transactionDate amount previousBalanceAmount closingBalanceAmount settlementDetails"
        )
        .populate("account", "accountName")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TransactionModel.countDocuments(filter),
    ]);

    // Transform data for frontend table
    const formattedTransactions = transactions.map((transaction) => ({
      billNo: transaction.transactionNumber || "N/A",
      transactionDate: transaction.transactionDate,
      accountName: transaction.account?.accountName || "N/A",
      previousBalanceAmount: transaction.previousBalanceAmount || 0,
      amount: transaction.amount || 0,
      closingBalanceAmount: transaction.closingBalanceAmount || 0,
      status: (transaction.closingBalanceAmount || 0) === 0 ? "paid" : "unpaid",
    }));

    res.status(200).json({
      success: true,
      data: formattedTransactions,
       pagination: result.pagination
      
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};
/**
 * Delete/Cancel transaction
 */
export const deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, transactionType } = req.params;

    if (
      !transactionType ||
      !["receipt", "payment"].includes(transactionType.toLowerCase())
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Valid transaction type (receipt/payment) is required in URL",
      });
    }

    const TransactionModel = getTransactionModel(transactionType);
    const transaction = await TransactionModel.findById(id).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Reverse outstanding settlements
    const { reverseOutstandingSettlement } = await import(
      "../../Helper/OutstandingSettlement.js"
    );
    await reverseOutstandingSettlement({
      transactionId: id,
      settlementDetails: transaction.settlementDetails,
      accountId: transaction.account,
      amount: transaction.amount,
      transactionType: transactionType.toLowerCase(),
      userId: req.user?._id,
      session,
    });

    // Reverse cash/bank ledger entry
    const { reverseCashBankLedgerEntry } = await import(
      "../../Helper/CashBankLedgerHelper.js"
    );
    await reverseCashBankLedgerEntry({
      transactionId: id,
      userId: req.user?._id,
      reason: "Transaction deleted",
      session,
    });

    // Delete transaction
    await TransactionModel.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
