import mongoose from "mongoose";
import { processTransaction } from "../../helpers/transactionHelpers/transactionProcessor.js";
import { determinePaymentStatus } from "../../helpers/transactionHelpers/calculationHelper.js";
import {
  getTransactionModel,
  transactionTypeToModelName,
} from "../../helpers/transactionHelpers/transactionMappers.js";
import { sleep } from "../../../shared/utils/delay.js";

import { createFundTransaction } from "../../services/fundTransactionService.js";

/**
 * Create transaction (handles sales, purchase, credit_note, debit_note)
 */
export const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transactionData = req.body;
    const userId = req.user.id;

    transactionData.createdBy = userId;

    // Validate transaction type
    const validTypes = ["sale", "purchase", "credit_note", "debit_note"];
    if (!validTypes.includes(transactionData.transactionType)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    // Validate required fields
    if (!transactionData.company || !transactionData.branch) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Company and branch are required",
      });
    }

    if (!transactionData.account) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Account is required",
      });
    }

    if (!transactionData.items || transactionData.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Calculate and validate totals
    const { netAmount, paidAmount } = transactionData;
    const paymentStatus = determinePaymentStatus(netAmount, paidAmount);

    transactionData.paymentStatus = paymentStatus;

    // Determine payment method
    if (paidAmount >= netAmount) {
      transactionData.paymentMethod = "cash";
    } else if (paidAmount > 0) {
      transactionData.paymentMethod = "credit";
    } else {
      transactionData.paymentMethod = "credit";
    }

    // Process transaction using helper
    const result = await processTransaction(transactionData, userId, session);

    // Create receipt if paid amount > 0
    let receiptResult = null;
    if (paidAmount > 0) {
      const receiptType =
        transactionData.transactionType === "sale" ||
        transactionData.transactionType === "credit_note"
          ? "receipt"
          : "payment";



      const {previousBalanceAmount,netAmount,paidAmount} = transactionData;

      console.log("transactionData",transactionData);
      
      const totalAmountForReceipt= netAmount+previousBalanceAmount;
      const closingBalanceAmountForReceipt= totalAmountForReceipt-paidAmount;
      

      receiptResult = await createFundTransaction(
        {
          transactionType: receiptType,
          account: transactionData.account,
          accountName: transactionData.accountName,
          amount: paidAmount,
          previousBalanceAmount: totalAmountForReceipt,
          closingBalanceAmount: closingBalanceAmountForReceipt,
          company: transactionData.company,
          branch: transactionData.branch,
          paymentMode: "cash",
          reference: result.transaction._id,
          referenceModel:
            transactionTypeToModelName[transactionData.transactionType] ||"Sale",
          referenceType: transactionData.transactionType,
          date: transactionData.date || new Date(),
          user: req.user,
        },
        session
      );
    }


    // Commit transaction
    await session.commitTransaction();

    // Query using the same session
    // const receiptInTransaction = await getTransactionModel("receipt").findById(
    //   receiptResult.transaction._id
    // ).session(session);
    // console.log("Receipt visible in transaction:", receiptInTransaction);

    // Send success response
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        transaction: result.transaction,
        outstanding: result.outstanding,
        accountLedger: result.accountLedger,
        itemLedgers: result.itemLedgers,
        ...(receiptResult && {
          receipt: {
            transactionNumber: receiptResult.transaction.transactionNumber,
            amount: receiptResult.transaction.amount,
            settlementsCount: receiptResult.settlementsCount,
          },
        }),
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Transaction creation error:", error);

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

    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  } finally {
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
    const sortBy = req.query.sortBy || "transactionDate";
    const sortOrder = req.query.sortOrder || "desc";

    // Convert 'desc' to -1, 'asc' to 1
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const sort = {
      [sortBy]: sortDirection,
      _id: sortDirection, // Secondary sort for consistency
    };

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
      sort
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
