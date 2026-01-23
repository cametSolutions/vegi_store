import mongoose, { set } from "mongoose";
import { processTransaction } from "../../helpers/transactionHelpers/transactionProcessor.js";
import {
  calculateTransactionDeltas,
  determinePaymentStatus,
} from "../../helpers/transactionHelpers/calculationHelper.js";
import {
  getTransactionModel,
  transactionTypeToModelName,
} from "../../helpers/transactionHelpers/transactionMappers.js";
import { sleep } from "../../../shared/utils/delay.js";
fetchOriginalTransaction;
import {
  createFundTransaction,
  handleReceiptOnEdit,
} from "../../services/fundTransactionService.js";
import { fetchOriginalTransaction } from "../../helpers/transactionHelpers/modelFindHelper.js";
import { applyStockDeltas } from "../../helpers/transactionHelpers/stockManager.js";
import {
  createAdjustmentEntries,
  // createCashAccountAdjustment,
} from "../../helpers/transactionHelpers/adjustmentEntryHelper.js";
import {
  handleAccountTypeChangeOnEdit,
  // updateOutstandingOnEdit,
} from "../../helpers/transactionHelpers/outstandingService.js";
import {
  markMonthlyBalancesForRecalculation,
  updateOriginalTransactionRecord,
} from "../../helpers/transactionHelpers/transactionEditHelper.js";
import { triggerOffsetAfterEdit } from "../../helpers/transactionHelpers/offsetTriggerHooks.js";
import OutstandingSettlementModel from "../../model/OutstandingSettlementModel.js";
import OutstandingModel from "../../model/OutstandingModel.js";
import { validateAccountChangeOnEdit } from "../../helpers/FundTransactionHelper/FundTransactionHelper.js";

/**
 * get transactions (handles sales, purchase, sales_return, purchase_return)
 */

export const getTransactions = async (req, res) => {
  try {
    // sleep(10000);
    // throw new Error("sleep");
    const transactionType = req.query.transactionType;

    // Validate transaction type
    const validTypes = ["sale", "purchase", "sales_return", "purchase_return"];
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

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

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

    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Use the static method for pagination
    const result = await transactionModel.getPaginatedTransactions(
      filter,
      page,
      limit,
      sort,
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

/**
 * Create transaction (handles sales, purchase, sales_return, purchase_return)
 */
export const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transactionData = req.body;
    const userId = req.user.id;

    transactionData.createdBy = userId;

    // Validate transaction type
    const validTypes = ["sale", "purchase", "sales_return", "purchase_return"];
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
        transactionData.transactionType === "sales_return"
          ? "receipt"
          : "payment";

      const { previousBalanceAmount, netAmount, paidAmount } = transactionData;

      console.log("transactionData", transactionData);

      const totalAmountForReceipt = netAmount + previousBalanceAmount;
      const closingBalanceAmountForReceipt = totalAmountForReceipt - paidAmount;

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
            transactionTypeToModelName[transactionData.transactionType] ||
            "Sale",
          referenceType: transactionData.transactionType,
          date: transactionData.date || new Date(),
          user: req.user,
        },
        session,
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
 * get transaction details (handles sales, purchase, sales_return, purchase_return)
 */

export const getTransactionDetail = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { companyId, branchId, transactionType, isEdit } = req.query;
    const TransactionModel = getTransactionModel(transactionType);

    const transaction = await TransactionModel.findOne({
      _id: transactionId,
      company: companyId,
      branch: branchId,
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // Handle isEdit logic
    if (isEdit === "true") {
      // Case 1: Receipt or Payment
      if (transactionType === "receipt" || transactionType === "payment") {
        // Fetch sum of closingBalanceAmount for pending outstandings
        const outstandings = await OutstandingModel.find({
          account: transaction.account,
          company: companyId,
          branch: branchId,
          status: {$in: ["pending", "partial"]},
        }).lean();

        const sumOfClosingBalance = outstandings.reduce(
          (sum, outstanding) => sum + (outstanding.closingBalanceAmount || 0),
          0,
        );
        console.log("outstandings", outstandings);

        // console.log("sumOfClosingBalance", sumOfClosingBalance);
        console.log({
          account: transaction.account,
          company: companyId,
          branch: branchId,
          status: "pending",
        });

        // Tweak previousBalanceAmount
        transaction.previousBalanceAmount =
          sumOfClosingBalance + (transaction.amount || 0);
      }

      // Case 2: Sale
      if (transactionType === "sale") {
        // Find outstanding for this sale
        const outstanding = await OutstandingModel.findOne({
          sourceTransaction: transactionId,
        }).lean();

        if (outstanding) {
          // Tweak paidAmount
          transaction.paidAmount = outstanding.paidAmount || 0;
        }
      }
    }

    // Find settlement count for sale (original logic - runs always)
    if (transactionType === "sale") {
      const outstanding = await OutstandingModel.findOne({
        sourceTransaction: transactionId,
      });

      let settlementCount = 0;

      if (outstanding) {
        settlementCount = await OutstandingSettlementModel.countDocuments({
          outstanding: outstanding._id,
          settlementStatus: "active",
        });
      }

      transaction.settlementCount = settlementCount || 0;
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);

    return res.status(500).json({
      message: "Failed to fetch transaction",
      error: error?.message || "Internal server error",
    });
  }
};

/**
 * Edit transaction - Adjustment-Only Approach
 * Pattern: Calculate Delta → Create Adjustment Entries → Update Outstanding
 */
export const editTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;
    const updatedData = req.body;
    const userId = req.user.id;

    // ========================================
    // STEP 1: Fetch Original Transaction
    // ========================================
    const originalTransaction = await fetchOriginalTransaction(
      transactionId,
      updatedData.transactionType,
      session,
    );

    const oldAccount = originalTransaction.account;

    // ========================================
    // ✅ NEW: STEP 1.5: Validate Account Change
    // ========================================
    try {
      await validateAccountChangeOnEdit({
        originalTransaction,
        updatedData,
        session,
      });
    } catch (validationError) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    if (!originalTransaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // console.log("originalTransaction", originalTransaction);

    // Validate company/branch cannot change
    if (
      originalTransaction.company.toString() !== updatedData.company ||
      originalTransaction.branch.toString() !== updatedData.branch
    ) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Cannot change company or branch during edit",
      });
    }

    // ========================================
    // STEP 2: Calculate Deltas (Differences)
    // ========================================
    const deltas = calculateTransactionDeltas(originalTransaction, updatedData);

    // console.log("deltas", deltas);

    // ========================================
    // STEP 3: Update Stock with Delta Only
    // ========================================
    if (deltas.stockDelta.length > 0) {
      await applyStockDeltas(
        deltas.stockDelta,
        originalTransaction.branch,
        session,
      );
    }

    // ========================================
    // STEP 4: Create Adjustment Entries
    // ========================================
    const adjustmentResult = await createAdjustmentEntries(
      originalTransaction,
      updatedData,
      deltas,
      userId,
      session,
    );

    // console.log("adjustment entries", adjustmentResult);
    // console.log(
    //   "adjustment entries itemAdjustments",
    //   adjustmentResult.adjustmentEntry.itemAdjustments
    // );

    // ========================================
    // 5. Handle Outstanding & Cash/Bank Changes
    // ========================================
    const accountTypeResult = await handleAccountTypeChangeOnEdit(
      originalTransaction,
      updatedData,
      deltas,
      userId,
      session,
    );

    // ========================================
    // STEP 6: Mark Monthly Balances as Dirty
    // ========================================
    await markMonthlyBalancesForRecalculation(
      originalTransaction,
      updatedData,
      session,
    );

    // ========================================
    // ✅ NEW: STEP 7: Handle Receipt/Payment Management
    // ========================================
    let receiptHandlingResult = null;

    // Check if paid amount changed
    const oldPaidAmount = originalTransaction.paidAmount || 0;
    const newPaidAmount = updatedData.paidAmount || 0;

    if (oldPaidAmount !== newPaidAmount) {
      console.log("\n💰 Paid amount changed, handling receipt/payment...");

      receiptHandlingResult = await handleReceiptOnEdit({
        transactionId: originalTransaction._id,
        transactionType: updatedData.transactionType,
        oldPaidAmount,
        newPaidAmount,
        accountId: updatedData.account,
        accountName: updatedData.accountName,
        company: updatedData.company,
        branch: updatedData.branch,
        transactionDate: updatedData.transactionDate,
        netAmount: updatedData.netAmount,
        previousBalanceAmount: updatedData.previousBalanceAmount,
        user: req.user,
        session,
      });

      console.log(
        "✅ Receipt/payment handling completed:",
        receiptHandlingResult.action,
      );
    } else {
      console.log("⏭️ Paid amount unchanged, skipping receipt handling");
    }

    // console.log("deltas",deltas);

    // ========================================
    // STEP 8: Update Original Transaction Document
    // ========================================
    const updatedTransaction = await updateOriginalTransactionRecord(
      originalTransaction,
      updatedData,
      userId,
      session,
    );

    // Step 9: ✅ ADD THIS - Trigger offset after edit
    await triggerOffsetAfterEdit(
      oldAccount,
      updatedTransaction,
      userId,
      session,
    );

    // Commit transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Transaction edited successfully",
      data: {
        transaction: updatedTransaction,
        adjustment: adjustmentResult.adjustmentEntry,
        accountTypeChanges: {
          outstandingDeleted: accountTypeResult.outstandingDeleted,
          outstandingCreated: accountTypeResult.outstandingCreated,
          cashBankDeleted: accountTypeResult.cashBankDeleted,
          cashBankCreated: accountTypeResult.cashBankCreated,
        },
        note: "Ledger will be recalculated in nightly job",
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Transaction edit error:", error);

    if (error.message.includes("Insufficient stock")) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to edit transaction",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
