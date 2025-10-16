import mongoose from "mongoose";
import { processTransaction } from "../../helpers/transactionHelpers/transactionProcessor.js";
import { determinePaymentStatus } from "../../helpers/transactionHelpers/calculationHelper.js";
import {
  getTransactionModel,
  transactionTypeToModelName,
} from "../../helpers/transactionHelpers/transactionMappers.js";
import { sleep } from "../../../shared/utils/delay.js";

/**
 * Create transaction (handles sales, purchase, credit_note, debit_note)
 */
export const createTransaction = async (req, res) => {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract data from request
    const transactionData = req.body;
    const userId = req.user.id; // From authentication middleware

    // Add audit fields
    transactionData.createdBy = userId;

    // Validate transaction type
    const validTypes = ["sale", "purchase", "credit_note", "debit_note"];
    if (!validTypes.includes(transactionData.transactionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    // Validate required fields
    if (!transactionData.company || !transactionData.branch) {
      return res.status(400).json({
        success: false,
        message: "Company and branch are required",
      });
    }

    if (!transactionData.account) {
      return res.status(400).json({
        success: false,
        message: "Account is required",
      });
    }

    if (!transactionData.items || transactionData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Calculate and validate totals
    const { netAmount, paidAmount } = transactionData;
    const paymentStatus = determinePaymentStatus(netAmount, paidAmount);
    //// add some extra fields
    transactionData.paymentStatus = paymentStatus;

    // Determine payment method
    if (paidAmount >= netAmount) {
      transactionData.paymentMethod = "cash";
    } else if (paidAmount > 0) {
      transactionData.paymentMethod = "credit"; // Partial payment
    } else {
      transactionData.paymentMethod = "credit"; // Full credit
    }

    // console.log("transactionData", transactionData);

    // Process transaction using helper (orchestrates all steps)
    const result = await processTransaction(transactionData,userId, session);

    // Commit transaction
    await session.commitTransaction();

    // Send success response
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        transaction: result.transaction,
        outstanding: result.outstanding,
        accountLedger: result.accountLedger,
        itemLedgers: result.itemLedgers,
      },
    });
  } catch (error) {
    // Abort transaction on error (automatic rollback)
    await session.abortTransaction();

    console.error("Transaction creation error:", error);

    // Handle specific errors
    if (error.message.includes("Insufficient stock")) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * get transactions (handles sales, purchase, credit_note, debit_note)
 */

export const getTransactions = async (req, res) => {
  try {

    // sleep(10000);
    // throw new Error("sleep");
    const transactionType = req.query.transactionType;

    // Validate transaction type
    const validTypes = ["sale", "purchase", "credit_note", "debit_note"];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    const transactionModel = getTransactionModel(transactionType);

    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchTerm = req.query.searchTerm || "";
    const companyId = req.query.companyId;
    const branchId = req.query.branchId;

    // Build filter - MUST include transactionType
    const filter = { transactionType };

    if (searchTerm) {
      filter.$or = [
        { accountName: { $regex: searchTerm, $options: "i" } },
        { transactionNumber: { $regex: searchTerm, $options: "i" } },
      ];
    }
    if (companyId) filter.company = companyId;
    if (branchId) filter.branch = branchId;

    // Use the static method for pagination
    const result = await transactionModel.getPaginatedTransactions(
      filter,
      page,
      limit,
      { transactionDate: 1 }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};
