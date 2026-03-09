import mongoose from "mongoose";
import {
  validateTransactionData,
  getTransactionModel,
  prepareTransactionData,
  validateEditRequest,
} from "../helpers/FundTransactionHelper/FundTransactionHelper.js";
import {
  deleteOutstandingSettlements,
  reverseOutstandingSettlements,
  settleOutstandingFIFO,
} from "../helpers/FundTransactionHelper/OutstandingSettlementHelper.js";
import {
  createCashBankLedgerEntry,
  deleteCashBankLedger,
} from "../helpers/CommonTransactionHelper/CashBankLedgerHelper.js";
import { getCashBankAccountForPayment } from "../helpers/CommonTransactionHelper/CashBankAccountHelper.js";
import {
  createAccountLedger,
  updateLedgerDates,
} from "../helpers/CommonTransactionHelper/ledgerService.js";
import {
  markMonthlyBalanceDirtyForFundTransaction,
  updateAccountMonthlyBalance,
} from "../helpers/CommonTransactionHelper/monthlyBalanceService.js";
import AccountMaster from "../model/masters/AccountMasterModel.js";
import { calculateFundTransactionDeltas } from "../helpers/transactionHelpers/calculationHelper.js";
import {
  createFundTransactionAdjustmentEntry,
  createFundTransactionCancellationAdjustmentEntry,
} from "../helpers/transactionHelpers/adjustmentEntryHelper.js";
import { transactionTypeToModelName } from "../helpers/transactionHelpers/transactionMappers.js";
import CashBankLedgerModel from "../model/CashBankLedgerModel.js";
import { lockFinancialYearFormat } from "../controller/companyController/companyController.js";
import { createPastDateAdjustmentEntry } from "./pastDateAdjustmentService.js";
import { markMonthlyBalancesForRecalculation } from "../helpers/transactionHelpers/transactionEditHelper.js";
// import { createFundTransactionAdjustmentEntry } from "../helpers/transactionHelpers/adjustmentEntryHelper.js";

/**
 * Creates a fund transaction (receipt or payment)
 * @param {Object} data - Transaction data
 * @param {String} data.transactionType - 'receipt' or 'payment'
 * @param {Object} data.user - User object with _id
 * @param {mongoose.ClientSession} [session] - Optional MongoDB session
 * @returns {Promise<Object>} Transaction result
 */
export const createFundTransaction = async (data, session = null) => {
  const shouldManageSession = !session;
  const activeSession = session || (await mongoose.startSession());

  if (shouldManageSession) {
    activeSession.startTransaction();
  }

  try {
    const { transactionType, user, isPastDated = false, ...requestData } = data;

    console.log("Fund Transaction Data:", requestData);

    // Validate transaction type
    if (
      !transactionType ||
      !["receipt", "payment"].includes(transactionType.toLowerCase())
    ) {
      throw new Error(
        'Invalid transaction type. Must be "receipt" or "payment"',
      );
    }

    // Validate user
    if (!user?._id) {
      throw new Error("User ID not found. Please login again.");
    }

    // Merge transaction type
    const transactionData = {
      ...requestData,
      transactionType: transactionType.toLowerCase(),
    };

    // Step 1: Validate transaction data
    const validationError = await validateTransactionData(
      transactionData,
      activeSession,
    );
    if (validationError) {
      throw new Error(validationError.message);
    }

    const { account, amount } = transactionData;
    const finalAccountId = account;

    if (!finalAccountId) {
      throw new Error("accountId or account field is required");
    }

    // Step 2: Get party account details
    const partyAccount =
      await AccountMaster.findById(finalAccountId).session(activeSession);

    if (!partyAccount) {
      throw new Error("Party account not found");
    }

    // Step 3: Get transaction model
    const TransactionModel = getTransactionModel(transactionType);

    // Step 4: Prepare transaction data
    const preparedData = prepareTransactionData(transactionData, user);

    // Step 5: Create transaction record
    const newTransaction = new TransactionModel(preparedData);
    await newTransaction.save({ session: activeSession });

    console.log("New Transaction:", newTransaction);

    // Step 6: Settle outstanding records using FIFO
    const settlementDetails = await settleOutstandingFIFO({
      accountId: finalAccountId,
      amount,
      type: transactionType.toLowerCase(),
      transactionId: newTransaction._id,
      transactionNumber: newTransaction.transactionNumber,
      transactionDate: newTransaction.transactionDate,
      company: transactionData.company,
      branch: transactionData.branch,
      createdBy: user._id,
      session: activeSession,
    });

    // Step 7: Update transaction with settlement details
    newTransaction.settlementDetails = settlementDetails;
    await newTransaction.save({ session: activeSession });

    // Step 8: Get Cash/Bank account
    const cashBankAccount = await getCashBankAccountForPayment({
      paymentMode: transactionData.paymentMode || "cash",
      companyId: transactionData.company,
      branchId: transactionData.branch,
      session: activeSession,
    });

    // Step 9: Create Cash/Bank ledger entry
    const ledgerEntry = await createCashBankLedgerEntry({
      transactionId: newTransaction._id,
      transactionType: transactionType.toLowerCase(),
      transactionNumber: newTransaction.transactionNumber,
      transactionDate: newTransaction.transactionDate,
      accountId: finalAccountId,
      accountName: partyAccount.accountName,
      amount: amount,
      paymentMode: transactionData.paymentMode || "cash",
      cashBankAccountId: cashBankAccount.accountId,
      cashBankAccountName: cashBankAccount.accountName,
      isCash: cashBankAccount.isCash,
      chequeNumber: transactionData.chequeNumber,
      chequeDate: transactionData.chequeDate,
      narration: transactionData.narration,
      company: transactionData.company,
      branch: transactionData.branch,
      createdBy: user._id,
      session: activeSession,
    });

    // Step 10: Create party account ledger
    const partyLedgerSide =
      transactionType.toLowerCase() === "receipt" ? "credit" : "debit";

    const partyLedger = await createAccountLedger(
      {
        company: transactionData.company,
        branch: transactionData.branch,
        account: finalAccountId,
        accountName: partyAccount.accountName,
        transactionId: newTransaction._id,
        transactionNumber: newTransaction.transactionNumber,
        transactionDate: newTransaction.transactionDate,
        transactionType: transactionType.toLowerCase(),
        ledgerSide: partyLedgerSide,
        amount: isPastDated ? 0 : amount, // ✅ zero for past-dated
        narration:
          transactionData.narration || `${transactionType} transaction`,
        createdBy: user._id,
      },
      activeSession,
    );

    // Step 11: Update monthly balance
    const monthlyBalance = await updateAccountMonthlyBalance(
      {
        company: transactionData.company,
        branch: transactionData.branch,
        account: finalAccountId,
        accountName: partyAccount.accountName,
        transactionDate: newTransaction.transactionDate,
        ledgerSide: partyLedgerSide,
        amount: isPastDated ? 0 : amount, // ✅ zero for past-dated
      },
      activeSession,
    );

    // Lock FY format
    if (transactionData.company) {
      await lockFinancialYearFormat(transactionData.company, activeSession);
    }

    // Commit only if this function owns the session
    if (shouldManageSession) {
      await activeSession.commitTransaction();

      // ✅ Adjustment entry only for pastDateAdjustmentEntry (shouldManageSession = true)
      // When called from sale controller, parent handles this after its own commit
      if (isPastDated) {
        await createPastDateAdjustmentEntry(
          newTransaction,
          user._id,
          null,
          true,
        );
      }
    }

    return {
      transaction: newTransaction,
      settlementsCount: settlementDetails.length,
      totalSettled: settlementDetails.reduce(
        (sum, s) => sum + s.settledAmount,
        0,
      ),
      cashBankEntry: {
        id: ledgerEntry._id,
        accountUsed: cashBankAccount.accountName,
        entryType: ledgerEntry.entryType,
        amount: ledgerEntry.amount,
      },
      partyLedger: {
        id: partyLedger._id,
        side: partyLedgerSide,
        runningBalance: partyLedger.runningBalance,
      },
      monthlyBalance: {
        month: monthlyBalance.month,
        year: monthlyBalance.year,
        closingBalance: monthlyBalance.closingBalance,
      },
    };
  } catch (error) {
    if (shouldManageSession) {
      await activeSession.abortTransaction();
    }
    throw error;
  } finally {
    if (shouldManageSession) {
      activeSession.endSession();
    }
  }
};

/**
 * Main service function to edit a receipt/payment
 * Handles all database operations in a transaction
 */
export const editFundTransaction = async ({
  transactionId,
  transactionType,
  updateData,
  user,
  skipMonthlyBalance = false,
}) => {
  console.log("\n🔄 ===== STARTING FUND TRANSACTION EDIT =====");
  console.log("Transaction ID:", transactionId);
  console.log("Transaction Type:", transactionType);
  console.log("Update Data:", updateData);

  // Start database session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ========================================
    // STEP 1: FETCH ORIGINAL TRANSACTION
    // ========================================
    console.log("\n📋 STEP 1: Fetching original transaction...");
    const TransactionModel = getTransactionModel(transactionType);
    const originalTx =
      await TransactionModel.findById(transactionId).session(session);

      const originalTnsCopy= JSON.parse(JSON.stringify(originalTx));

    if (!originalTx) {
      throw new Error("Transaction not found");
    }

    // Check if transaction is cancelled
    if (originalTx.status === "cancelled" || originalTx.isCancelled) {
      throw new Error("Cannot edit a cancelled transaction");
    }

    console.log("✅ Original transaction found:", {
      number: originalTx.transactionNumber,
      amount: originalTx.amount,
      account: originalTx.account,
    });

    // ========================================
    // STEP 2: VALIDATE EDIT REQUEST
    // ========================================
    console.log("\n🔍 STEP 2: Validating edit request...");
    await validateEditRequest(originalTx, updateData, transactionType, session);
    console.log("✅ Validation passed");

    // ========================================
    // STEP 3: CALCULATE DELTAS
    // ========================================
    console.log("\n📊 STEP 3: Calculating deltas...");
    const deltas = calculateFundTransactionDeltas(originalTx, updateData);
    console.log("Deltas:", deltas);

    // ========================================
    // STEP 4: REVERSE OUTSTANDING SETTLEMENTS (✅ UPDATED)
    // ========================================
    console.log("\n🔄 STEP 4: Reversing outstanding settlements...");
    const reversedSettlementsResult = await reverseOutstandingSettlements({
      transactionId: originalTx._id,
      transactionType,
      transactionNumber: originalTx.transactionNumber,
      accountId: originalTx.account,
      amount: originalTx.amount,
      userId: user._id,
      reason: "Transaction edited",
      session,
    });
    console.log(`✅ Reversed ${reversedSettlementsResult.count} settlement(s)`);

    // ========================================
    // STEP 5: DELETE CASH/BANK LEDGER (for tracking - will be zeroed by nightly job)
    // ========================================
    console.log("\n💰 STEP 5: Deleting cash/bank ledger entry...");
    const deletedCashBankEntry = await deleteCashBankLedger({
      transactionId: originalTx._id,
      transactionType,
      session,
    });
    console.log("✅ Cash/Bank ledger entry deleted:", deletedCashBankEntry._id);

    // ========================================
    // STEP 6: UPDATE TRANSACTION RECORD
    // ========================================
    console.log("\n📝 STEP 6: Updating transaction record...");

    // Update only allowed fields
    if (updateData.amount !== undefined) {
      originalTx.amount = updateData.amount;
    }
    if (updateData.paymentMode !== undefined) {
      originalTx.paymentMode = updateData.paymentMode;
    }
    if (updateData.chequeNumber !== undefined) {
      originalTx.chequeNumber = updateData.chequeNumber;
    }
    if (updateData.chequeDate !== undefined) {
      originalTx.chequeDate = updateData.chequeDate;
    }
    if (updateData.narration !== undefined) {
      originalTx.narration = updateData.narration;
    }
    if (updateData.description !== undefined) {
      originalTx.description = updateData.description;
    }
    if (updateData.transactionDate !== undefined) {
      originalTx.transactionDate = updateData.transactionDate;
    }

    if (updateData.closingBalanceAmount !== undefined) {
      originalTx.closingBalanceAmount = updateData.closingBalanceAmount;
    }

    // Clear old settlement details (will be repopulated)
    originalTx.settlementDetails = [];

    await originalTx.save({ session });
    console.log("✅ Transaction record updated");

    // ========================================
    // STEP 7: GET PARTY ACCOUNT DETAILS
    // ========================================
    const partyAccount = await AccountMaster.findById(
      originalTx.account,
    ).session(session);

    if (!partyAccount) {
      throw new Error("Party account not found");
    }

    // ========================================
    // STEP 8: RE-RUN FIFO SETTLEMENT
    // ========================================
    console.log("\n🎯 STEP 8: Re-running FIFO settlement with new amount...");
    const newSettlements = await settleOutstandingFIFO({
      accountId: originalTx.account,
      amount: originalTx.amount,
      type: transactionType,
      transactionId: originalTx._id,
      transactionNumber: originalTx.transactionNumber,
      transactionDate: originalTx.transactionDate,
      company: originalTx.company,
      branch: originalTx.branch,
      createdBy: user._id,
      session,
    });

    // Update transaction with new settlement details
    originalTx.settlementDetails = newSettlements;
    await originalTx.save({ session });

    console.log(`✅ Created ${newSettlements.length} new settlement(s)`);

    // ========================================
    // STEP 9: GET CASH/BANK ACCOUNT
    // ========================================
    console.log("\n🏦 STEP 9: Getting cash/bank account...");
    const cashBankAccount = await getCashBankAccountForPayment({
      paymentMode: originalTx.paymentMode || "cash",
      companyId: originalTx.company,
      branchId: originalTx.branch,
      session,
    });
    console.log("✅ Cash/Bank account:", cashBankAccount.accountName);

    // ========================================
    // STEP 10: CREATE NEW CASH/BANK LEDGER ENTRY
    // ========================================
    console.log("\n💰 STEP 10: Creating new cash/bank ledger entry...");
    const newCashBankEntry = await createCashBankLedgerEntry({
      transactionId: originalTx._id,
      transactionType,
      transactionNumber: originalTx.transactionNumber,
      transactionDate: originalTx.transactionDate,
      accountId: originalTx.account,
      accountName: partyAccount.accountName,
      amount: originalTx.amount,
      paymentMode: originalTx.paymentMode || "cash",
      cashBankAccountId: cashBankAccount.accountId,
      cashBankAccountName: cashBankAccount.accountName,
      isCash: cashBankAccount.isCash,
      chequeNumber: originalTx.chequeNumber,
      chequeDate: originalTx.chequeDate,
      narration: originalTx.narration,
      company: originalTx.company,
      branch: originalTx.branch,
      createdBy: user._id,
      session,
    });
    console.log("✅ New cash/bank ledger entry created");

    // ========================================
    // STEP 11: MARK MONTHLY BALANCE AS DIRTY
    // ========================================
    if (!skipMonthlyBalance) {
      // ✅ NEW check
      console.log("\n📅 STEP 11: Marking monthly balance as dirty...");
      const dirtyTaggingResult =
        // await markMonthlyBalanceDirtyForFundTransaction({
        //   accountId: originalTx.account,
        //   transactionDate: originalTx.transactionDate,
        //   company: originalTx.company,
        //   branch: originalTx.branch,
        //   session,
        // });

        await markMonthlyBalancesForRecalculation(
          originalTnsCopy,
          updateData,
          session,
          true, /// NEW PARAM TO MARK ITEM WITH OUT CHECK IF IT IS CHANGED OR NOT
        );

      console.log("✅ Monthly balance marked for recalculation");
    } else {
      console.log(
        "\n⏭️ STEP 11: Skipping monthly balance (handled by parent transaction)",
      );
    }

    // ========================================
    // STEP 12: CREATE ADJUSTMENT ENTRY (✅ UPDATED)
    // ========================================
    console.log("\n📋 STEP 12: Creating adjustment entry...");
    const adjustmentEntry = await createFundTransactionAdjustmentEntry({
      originalTransaction: originalTx,
      transactionType,
      deltas,
      reversedSettlements: reversedSettlementsResult.settlements, // ✅ UPDATED
      newSettlements,
      deletedCashBankEntry,
      newCashBankEntry,
      cashBankAccount,
      editedBy: user._id,
      session,
    });
    console.log("✅ Adjustment entry created");

    // ========================================
    // STEP 13: Update the ledger dates if date is changed
    // ========================================
    /// if date is changed then we need to update the date in account ledger and item ledger as well as it will affect the monthly balance and also the stock report and outstanding report

    if (deltas.dateChanged) {
      const updateLedgers = await updateLedgerDates(
        updateData.company,
        updateData.branch,
        updateData._id,
        updateData.transactionDate,
        session,
      );
    }

    // ========================================
    // COMMIT TRANSACTION
    // ========================================
    await session.commitTransaction();
    console.log("\n✅ ===== TRANSACTION EDIT COMPLETED SUCCESSFULLY =====\n");

    return {
      transaction: originalTx,
      adjustmentEntry: {
        id: adjustmentEntry._id,
        adjustmentNumber: adjustmentEntry.adjustmentNumber,
        amountDelta: adjustmentEntry.amountDelta,
      },
      settlements: {
        reversed: reversedSettlementsResult.count, // ✅ UPDATED
        created: newSettlements.length,
        totalSettled: newSettlements.reduce(
          (sum, s) => sum + s.settledAmount,
          0,
        ),
      },
      cashBankUpdate: {
        reversedEntry: deletedCashBankEntry._id,
        newEntry: newCashBankEntry._id,
        accountUsed: cashBankAccount.accountName,
      },
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    console.error("\n❌ Edit failed, transaction rolled back:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel a fund transaction (Receipt/Payment) - SOFT DELETE
 * Marks transaction as cancelled, reverses settlements, creates adjustment entry
 *
 * Used when editing Sale/Purchase and setting paidAmount to 0
 */
export const cancelFundTransaction = async ({
  transactionId,
  transactionType,
  userId,
  reason = "Payment removed during transaction edit",
  session,
  skipMonthlyBalance = false, // ✅ NEW parameter
}) => {
  console.log("\n❌ ===== CANCELLING FUND TRANSACTION =====");
  console.log("Transaction ID:", transactionId);
  console.log("Transaction Type:", transactionType);

  try {
    // ========================================
    // STEP 1: FETCH ORIGINAL TRANSACTION
    // ========================================
    console.log("\n📋 STEP 1: Fetching original transaction...");
    const TransactionModel = getTransactionModel(transactionType);
    const originalTx =
      await TransactionModel.findById(transactionId).session(session);

    if (!originalTx) {
      throw new Error("Fund transaction not found");
    }

    // Check if already cancelled
    if (originalTx.status === "cancelled" || originalTx.isCancelled) {
      console.log("⚠️ Transaction already cancelled");
      return {
        transaction: originalTx,
        alreadyCancelled: true,
      };
    }

    console.log("✅ Original transaction found:", {
      number: originalTx.transactionNumber,
      amount: originalTx.amount,
      account: originalTx.account,
    });

    // ========================================
    // STEP 2: REVERSE OUTSTANDING SETTLEMENTS
    // ========================================
    console.log("\n🔄 STEP 2: Reversing outstanding settlements...");
    const reversedSettlementsResult = await reverseOutstandingSettlements({
      transactionId: originalTx._id,
      transactionType,
      transactionNumber: originalTx.transactionNumber,
      accountId: originalTx.account,
      amount: originalTx.amount,
      userId,
      reason,
      session,
    });

    console.log(`✅ Reversed ${reversedSettlementsResult.count} settlement(s)`);

    // ========================================
    // STEP 3: GET CASH/BANK LEDGER ENTRY (for adjustment tracking)
    // ========================================
    console.log("\n💰 STEP 3: Getting cash/bank ledger entry...");
    const cashBankEntry = await CashBankLedgerModel.findOne({
      transaction: originalTx._id,
      transactionType: transactionType.toLowerCase(),
      entryStatus: "active",
    }).session(session);

    if (!cashBankEntry) {
      console.warn("⚠️ No cash/bank ledger entry found");
    } else {
      console.log("✅ Cash/Bank entry found:", {
        id: cashBankEntry._id,
        amount: cashBankEntry.amount,
        entryType: cashBankEntry.entryType,
      });
    }

    // ========================================
    // ✅ NEW: STEP 3.5: MARK CASH/BANK LEDGER AS REVERSED/CANCELLED
    // ========================================
    if (cashBankEntry) {
      console.log("\n💰 STEP 3.5: Marking cash/bank ledger as reversed...");

      cashBankEntry.entryStatus = "reversed";
      cashBankEntry.reversedAt = new Date();
      cashBankEntry.reversedBy = userId;
      cashBankEntry.reversalReason = reason;

      await cashBankEntry.save({ session });
      console.log("✅ Cash/Bank ledger marked as reversed");
    }

    // ========================================
    // STEP 4: MARK TRANSACTION AS CANCELLED
    // ========================================
    console.log("\n🚫 STEP 4: Marking transaction as cancelled...");
    originalTx.status = "cancelled";
    originalTx.isCancelled = true;
    originalTx.cancelledAt = new Date();
    originalTx.cancelledBy = userId;
    originalTx.cancellationReason = reason;

    await originalTx.save({ session });
    console.log("✅ Transaction marked as cancelled");

    // ========================================
    // STEP 5: CREATE CANCELLATION ADJUSTMENT ENTRY
    // ========================================
    console.log("\n📋 STEP 5: Creating cancellation adjustment entry...");
    const adjustmentEntry =
      await createFundTransactionCancellationAdjustmentEntry({
        cancelledTransaction: originalTx,
        transactionType,
        reversedSettlements: reversedSettlementsResult.settlements,
        cashBankEntry,
        cancelledBy: userId,
        reason,
        session,
      });

    console.log(
      "✅ Cancellation adjustment entry created:",
      adjustmentEntry.adjustmentNumber,
    );

    // ========================================
    // STEP 6: MARK MONTHLY BALANCE AS DIRTY
    // ========================================
    if (!skipMonthlyBalance) {
      // ✅ NEW check
      console.log("\n📅 STEP 6: Marking monthly balance as dirty...");
      const dirtyTaggingResult =
        await markMonthlyBalanceDirtyForFundTransaction({
          accountId: originalTx.account,
          transactionDate: originalTx.transactionDate,
          company: originalTx.company,
          branch: originalTx.branch,
          session,
        });
      console.log("✅ Monthly balance marked for recalculation");
    } else {
      console.log(
        "\n⏭️ STEP 6: Skipping monthly balance (handled by parent transaction)",
      );
    }

    console.log("\n✅ ===== FUND TRANSACTION CANCELLED SUCCESSFULLY =====\n");

    return {
      transaction: originalTx,
      adjustmentEntry: {
        id: adjustmentEntry._id,
        adjustmentNumber: adjustmentEntry.adjustmentNumber,
        cancelledAmount: originalTx.amount,
      },
      settlements: {
        reversed: reversedSettlementsResult.count,
        details: reversedSettlementsResult.settlements,
      },
      cashBankEntry: cashBankEntry
        ? {
            id: cashBankEntry._id,
            amount: cashBankEntry.amount,
            note: "Will be zeroed by nightly calculation",
          }
        : null,
    };
  } catch (error) {
    console.error("\n❌ Cancellation failed:", error.message);
    throw error;
  }
};

/**
 * Handle receipt/payment management during Sale/Purchase edit
 * Decides: Create / Edit / Cancel / Do Nothing
 *
 * Scenarios:
 * 1. Receipt exists, amount changed (not 0) → Edit receipt
 * 2. Receipt exists, amount = 0 → Cancel receipt
 * 3. No receipt, amount > 0 → Create receipt
 * 4. No receipt, amount = 0 → Do nothing
 */
export const handleReceiptOnEdit = async ({
  transactionId,
  transactionType,
  oldPaidAmount,
  newPaidAmount,
  accountId,
  accountName,
  company,
  branch,
  transactionDate,
  netAmount,
  previousBalanceAmount,
  user,
  session,
}) => {
  console.log("\n💰 ===== HANDLING RECEIPT/PAYMENT ON EDIT =====");
  console.log("Transaction Type:", transactionType);
  console.log("Old Paid Amount:", oldPaidAmount);
  console.log("New Paid Amount:", newPaidAmount);

  // Determine receipt type based on transaction type
  const receiptType =
    transactionType === "sale" || transactionType === "sales_return"
      ? "receipt"
      : "payment";

  console.log("Receipt Type:", receiptType);

  try {
    // ========================================
    // STEP 1: FIND EXISTING RECEIPT/PAYMENT
    // ========================================
    const ReceiptModel = getTransactionModel(receiptType);

    const existingReceipt = await ReceiptModel.findOne({
      reference: transactionId,
      // referenceType: transactionType,
      company,
      branch,
      status: "active", // ✅ Only find active receipts
    }).session(session);

    console.log("existingReceipt", existingReceipt);
    console.log("existingReceipt", {
      reference: transactionId,

      company,
      branch,
      status: "active", // ✅ Only find active receipts
    });

    console.log("Existing receipt found:", !!existingReceipt);
    if (existingReceipt) {
      console.log("Existing receipt ID:", existingReceipt._id);
      console.log(
        "Existing receipt number:",
        existingReceipt.transactionNumber,
      );
    }

    // ========================================
    // SCENARIO 1: Receipt exists, amount changed (not 0) → EDIT
    // ========================================
    if (existingReceipt && newPaidAmount > 0) {
      console.log("\n📝 SCENARIO 1: Editing existing receipt");

      const totalAmountForReceipt = netAmount + (previousBalanceAmount || 0);
      const closingBalanceAmountForReceipt =
        totalAmountForReceipt - newPaidAmount;

      const editResult = await editFundTransaction({
        transactionId: existingReceipt._id,
        transactionType: receiptType,
        updateData: {
          amount: newPaidAmount,
          previousBalanceAmount: totalAmountForReceipt,
          closingBalanceAmount: closingBalanceAmountForReceipt,
        },
        user,
        skipMonthlyBalance: true, // ✅ NEW: Parent will handle it
      });

      console.log("✅ Receipt edited successfully");
      return {
        action: "edited",
        receiptType,
        receipt: editResult.transaction,
        adjustmentEntry: editResult.adjustmentEntry,
        settlements: editResult.settlements,
      };
    }

    // ========================================
    // SCENARIO 2: Receipt exists, amount = 0 → CANCEL
    // ========================================
    if (existingReceipt && newPaidAmount === 0) {
      console.log("\n❌ SCENARIO 2: Cancelling existing receipt");

      const cancelResult = await cancelFundTransaction({
        transactionId: existingReceipt._id,
        transactionType: receiptType,
        userId: user._id,
        reason: "Paid amount set to 0 during transaction edit",
        session,
        skipMonthlyBalance: true, // ✅ NEW: Parent will handle it
      });

      console.log("✅ Receipt cancelled successfully");
      return {
        action: "cancelled",
        receiptType,
        receipt: cancelResult.transaction,
        adjustmentEntry: cancelResult.adjustmentEntry,
        settlements: cancelResult.settlements,
      };
    }

    // ========================================
    // SCENARIO 3: No receipt, amount > 0 → CREATE
    // ========================================
    if (!existingReceipt && newPaidAmount > 0) {
      console.log("\n➕ SCENARIO 3: Creating new receipt");

      const totalAmountForReceipt = netAmount + (previousBalanceAmount || 0);
      const closingBalanceAmountForReceipt =
        totalAmountForReceipt - newPaidAmount;

      const createResult = await createFundTransaction(
        {
          transactionType: receiptType,
          account: accountId,
          accountName: accountName,
          amount: newPaidAmount,
          previousBalanceAmount: totalAmountForReceipt,
          closingBalanceAmount: closingBalanceAmountForReceipt,
          company,
          branch,
          paymentMode: "cash",
          reference: transactionId,
          referenceModel: transactionTypeToModelName[transactionType] || "Sale",
          referenceType: transactionType,
          transactionDate: transactionDate || new Date(),
          user,
        },
        session,
      );

      console.log("✅ Receipt created successfully");
      return {
        action: "created",
        receiptType,
        receipt: createResult.transaction,
        settlementsCount: createResult.settlementsCount,
      };
    }

    // ========================================
    // SCENARIO 4: No receipt, amount = 0 → DO NOTHING
    // ========================================
    console.log("\n⏭️ SCENARIO 4: No receipt, amount = 0, nothing to do");
    return {
      action: "none",
      receiptType,
      message: "No receipt exists and paid amount is 0",
    };
  } catch (error) {
    console.error("\n❌ Receipt handling failed:", error.message);
    throw error;
  } finally {
    console.log("\n✅ ===== RECEIPT HANDLING COMPLETED =====\n");
  }
};
