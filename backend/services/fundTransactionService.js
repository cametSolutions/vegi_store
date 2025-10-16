import mongoose from "mongoose";
import {
  validateTransactionData,
  getTransactionModel,
  prepareTransactionData,
} from "../helpers/FundTransactionHelper/FundTransactionHelper.js";
import { settleOutstandingFIFO } from "../helpers/FundTransactionHelper/OutstandingSettlementHelper.js";
import { createCashBankLedgerEntry } from "../helpers/CommonTransactionHelper/CashBankLedgerHelper.js";
import { getCashBankAccountForPayment } from "../helpers/CommonTransactionHelper/CashBankAccountHelper.js";
import { createAccountLedger } from "../helpers/CommonTransactionHelper/ledgerService.js";
import { updateAccountMonthlyBalance } from "../helpers/CommonTransactionHelper/monthlyBalanceService.js";
import AccountMaster from "../model/masters/AccountMasterModel.js";

/**
 * Creates a fund transaction (receipt or payment)
 * @param {Object} data - Transaction data
 * @param {String} data.transactionType - 'receipt' or 'payment'
 * @param {Object} data.user - User object with _id
 * @param {mongoose.ClientSession} [session] - Optional MongoDB session
 * @returns {Promise<Object>} Transaction result
 */
export const createFundTransaction = async (data, session = null) => {
  console.log("data", data);

  // Determine if we need to manage session lifecycle
  const shouldManageSession = !session;
  const activeSession = session || (await mongoose.startSession());

  if (shouldManageSession) {
    activeSession.startTransaction();
  }

  try {
    const { transactionType, user, ...requestData } = data;

    // Validate transaction type
    if (
      !transactionType ||
      !["receipt", "payment"].includes(transactionType.toLowerCase())
    ) {
      throw new Error(
        'Invalid transaction type. Must be "receipt" or "payment"'
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
      activeSession
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
    const partyAccount = await AccountMaster.findById(finalAccountId).session(
      activeSession
    );

    if (!partyAccount) {
      throw new Error("Party account not found");
    }

    // Step 3: Get transaction model
    const TransactionModel = getTransactionModel(transactionType);

    // Step 4: Prepare transaction data
    const preparedData = prepareTransactionData(transactionData, user);

    console.log("TransactionModel", TransactionModel);

    // Step 5: Create transaction record
    const newTransaction = new TransactionModel(preparedData);
    await newTransaction.save({ session: activeSession });

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
      transactionType.toLowerCase() === "receipt" ? "debit" : "credit";

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
        amount: amount,
        narration:
          transactionData.narration || `${transactionType} transaction`,
        createdBy: user._id,
      },
      activeSession
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
        amount: amount,
      },
      activeSession
    );

    console.log("shouldManageSession", shouldManageSession);

    // Commit transaction if we manage the session
    if (shouldManageSession) {
      await activeSession.commitTransaction();
    }

    return {
      transaction: newTransaction,
      settlementsCount: settlementDetails.length,
      totalSettled: settlementDetails.reduce(
        (sum, s) => sum + s.settledAmount,
        0
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
