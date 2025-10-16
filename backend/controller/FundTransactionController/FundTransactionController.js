import mongoose from 'mongoose';

import { ReceiptModel, PaymentModel } from '../../model/FundTransactionMode.js';
import { 
  validateTransactionData, 
  getTransactionModel,
  prepareTransactionData 
} from '../../helpers/FundTransactionHelper/FundTransactionHelper.js';
import { 
  // updateAccountOutstanding,
  settleOutstandingFIFO 
} from '../../helpers/FundTransactionHelper/OutstandingSettlementHelper.js';
import { 
  createCashBankLedgerEntry,
  getAllCashBankBalances 
} from '../../helpers/FundTransactionHelper/CashBankLedgerHelper.js';
import { getCashBankAccountForPayment } from '../../helpers/FundTransactionHelper/CashBankAccountHelper.js';
import { createAccountLedger } from '../../helpers/CommonTransactionHelper/ledgerService.js';
import { updateAccountMonthlyBalance } from '../../helpers/CommonTransactionHelper/monthlyBalanceService.js';
import AccountMaster from '../../model/masters/AccountMasterModel.js';

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
export const createFundTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get transaction type from URL parameter
    const { transactionType } = req.params;
    
    console.log("📝 Creating fund transaction:", {
      type: transactionType,
      body: req.body
    });

    // Validate user authentication
    if (!req.user?._id) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token. Please login again.'
      });
    }

    // Validate transaction type from URL
    if (!transactionType || !['receipt', 'payment'].includes(transactionType.toLowerCase())) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type in URL. Must be "receipt" or "payment"'
      });
    }

    // Merge transaction type from URL into body
    const requestData = {
      ...req.body,
      transactionType: transactionType.toLowerCase()
    };

    // Step 1: Validate transaction data
    const validationError = await validateTransactionData(requestData, session);
    if (validationError) {
      await session.abortTransaction();
      return res.status(validationError.status).json({
        success: false,
        message: validationError.message
      });
    }
/// no need
    const { account, amount } = requestData;
    const finalAccountId =  account;

    if (!finalAccountId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'accountId or account field is required'
      });
    }

    // Step 2: Get party account details
    const partyAccount = await AccountMaster.findById(finalAccountId).session(session);
    
    if (!partyAccount) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Party account not found'
      });
    }

    console.log("✅ Party account found:", partyAccount.accountName);

    // Step 3: Get appropriate transaction model (Receipt or Payment)
    const TransactionModel = getTransactionModel(transactionType);

    // Step 4: Prepare transaction data for party
    const transactionData = prepareTransactionData(requestData, req.user);
    console.log("📋 Transaction data prepared:", transactionData);

    // Step 5: Create transaction record for party
    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save({ session });

    console.log("✅ Party transaction created:", newTransaction.transactionNumber);

    // Step 6: Update party account outstanding balance
    // await updateAccountOutstanding({
    //   accountId: finalAccountId,
    //   amount,
    //   transactionType: transactionType.toLowerCase(),
    //   session
    // });

    console.log("✅ Party account outstanding updated");

    // Step 7: Settle outstanding records using FIFO
    const settlementDetails = await settleOutstandingFIFO({
      accountId: finalAccountId,
      amount,
      type: transactionType.toLowerCase(),
      transactionId: newTransaction._id,
      transactionNumber: newTransaction.transactionNumber,
      transactionDate: newTransaction.date,
      company: requestData.company,
      branch: requestData.branch,
      createdBy: req.user._id,
      session
    });

    console.log(`✅ Settled ${settlementDetails.length} outstanding record(s)`);

    // Step 8: Update transaction with settlement details
    newTransaction.settlementDetails = settlementDetails;
    await newTransaction.save({ session });

    // Step 9: Get Cash or Bank account from AccountMaster
    // This finds the actual Cash/Bank account based on payment mode
    const cashBankAccount = await getCashBankAccountForPayment({
      paymentMode: requestData.paymentMode || 'cash',
      companyId: requestData.company,
      branchId: requestData.branch,
      session
    });

    console.log("💰 Using Cash/Bank account:", {
      type: cashBankAccount.isCash ? 'CASH' : 'BANK',
      name: cashBankAccount.accountName,
      id: cashBankAccount.accountId,
      accountType: cashBankAccount.accountDocument.accountType
    });

    // Step 10: Create Cash/Bank ledger entry
    // For Receipt: Debit Cash/Bank (money coming in)
    // For Payment: Credit Cash/Bank (money going out)
     const ledgerEntry = await createCashBankLedgerEntry({
      transactionId: newTransaction._id,
      transactionType: transactionType.toLowerCase(),
      transactionNumber: newTransaction.transactionNumber,
      transactionDate: newTransaction.date,
      accountId: finalAccountId,
      accountName: partyAccount.accountName,
      amount: amount,
      paymentMode: requestData.paymentMode || 'cash',
      cashBankAccountId: cashBankAccount.accountId,
      cashBankAccountName: cashBankAccount.accountName,
      isCash: cashBankAccount.isCash,
      chequeNumber: requestData.chequeNumber,
      chequeDate: requestData.chequeDate,
      narration: requestData.narration,
      company: requestData.company,
      branch: requestData.branch,
      createdBy: req.user._id,
      session
    });

    console.log("✅ Cash/Bank ledger entry created:", {
      id: ledgerEntry._id,
      entryType: ledgerEntry.entryType,
      amount: ledgerEntry.amount,
      cashOrBank: cashBankAccount.isCash ? 'Cash' : cashBankAccount.accountName
    });


    const partyLedgerSide = transactionType.toLowerCase() === 'receipt' ? 'debit' : 'credit';
    
    const partyLedger = await createAccountLedger({
      company: requestData.company,
      branch: requestData.branch,
      account: finalAccountId,
      accountName: partyAccount.accountName,
      transactionId: newTransaction._id,
      transactionNumber: newTransaction.transactionNumber,
      transactionDate: newTransaction.date,
      transactionType: transactionType.toLowerCase(),
      ledgerSide: partyLedgerSide,
      amount: amount,
      narration: requestData.narration || `${transactionType} transaction`,
      createdBy: req.user._id,
    }, session);

    console.log("✅ Party account ledger created:", {
      id: partyLedger._id,
      side: partyLedgerSide,
      amount: partyLedger.amount,
      runningBalance: partyLedger.runningBalance
    });

    // Step 11: Update Monthly Balance for Party Account
    const monthlyBalance = await updateAccountMonthlyBalance({
      company: requestData.company,
      branch: requestData.branch,
      account: finalAccountId,
      accountName: partyAccount.accountName,
      transactionDate: newTransaction.date,
      ledgerSide: partyLedgerSide,
      amount: amount,
    }, session);

    console.log("✅ Monthly balance updated:", {
      month: monthlyBalance.month,
      year: monthlyBalance.year,
      closingBalance: monthlyBalance.closingBalance
    });
    // Step 11: Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} created successfully`,
      data: {
        transaction: newTransaction,
        settlementsCount: settlementDetails.length,
        totalSettled: settlementDetails.reduce((sum, s) => sum + s.settledAmount, 0),
        cashBankEntry: {
          id: ledgerEntry._id,
          accountUsed: cashBankAccount.accountName,
          entryType: ledgerEntry.entryType,
          amount: ledgerEntry.amount
        },
        partyLedger: {
          id: partyLedger._id,
          side: partyLedgerSide,
          runningBalance: partyLedger.runningBalance
        },
        monthlyBalance: {
          month: monthlyBalance.month,
          year: monthlyBalance.year,
          closingBalance: monthlyBalance.closingBalance
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error creating transaction:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (req, res) => {
  try {
    const { id, transactionType } = req.params;

    if (!transactionType || !['receipt', 'payment'].includes(transactionType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction type (receipt/payment) is required in URL'
      });
    }

    const TransactionModel = getTransactionModel(transactionType);
    const transaction = await TransactionModel.findById(id)
      .populate('account', 'accountName accountType phoneNo')
      .populate('settlementDetails.outstandingTransaction')
      .populate('company', 'name')
      .populate('branch', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
};

/**
 * Get all transactions with filters
 */
export const getTransactions = async (req, res) => {
  try {
    const { transactionType } = req.params;
    const { 
      accountId,
      account,
      company,
      branch,
      startDate, 
      endDate, 
      paymentMode,
      page = 1,
      limit = 50
    } = req.query;

    if (!transactionType || !['receipt', 'payment'].includes(transactionType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction type (receipt/payment) is required in URL'
      });
    }

    const TransactionModel = getTransactionModel(transactionType);

    // Build query
    const query = {};
    
    const finalAccountId = accountId || account;
    if (finalAccountId) query.account = finalAccountId;
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (paymentMode) query.paymentMode = paymentMode;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .select('transactionNumber date amount previousBalanceAmount closingBalanceAmount settlementDetails')
        .populate('account', 'accountName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TransactionModel.countDocuments(query)
    ]);

    // Transform data for frontend table
    const formattedTransactions = transactions.map(transaction => {
      return {
        billNo: transaction.transactionNumber || 'N/A',
        payDate: transaction.date,
        accountName: transaction.account?.accountName || 'N/A',
        previousBalanceAmount: transaction.previousBalanceAmount || 0,
        amount: transaction.amount || 0,
        closingBalanceAmount: transaction.closingBalanceAmount || 0,
        status: (transaction.closingBalanceAmount || 0) === 0 ? 'paid' : 'unpaid'
      };
    });

    res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
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

    if (!transactionType || !['receipt', 'payment'].includes(transactionType.toLowerCase())) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Valid transaction type (receipt/payment) is required in URL'
      });
    }

    const TransactionModel = getTransactionModel(transactionType);
    const transaction = await TransactionModel.findById(id).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Reverse outstanding settlements
    const { reverseOutstandingSettlement } = await import('../../Helper/OutstandingSettlement.js');
    await reverseOutstandingSettlement({
      transactionId: id,
      settlementDetails: transaction.settlementDetails,
      accountId: transaction.account,
      amount: transaction.amount,
      transactionType: transactionType.toLowerCase(),
      userId: req.user?._id,
      session
    });

    // Reverse cash/bank ledger entry
    const { reverseCashBankLedgerEntry } = await import('../../Helper/CashBankLedgerHelper.js');
    await reverseCashBankLedgerEntry({
      transactionId: id,
      userId: req.user?._id,
      reason: 'Transaction deleted',
      session
    });

    // Delete transaction
    await TransactionModel.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};