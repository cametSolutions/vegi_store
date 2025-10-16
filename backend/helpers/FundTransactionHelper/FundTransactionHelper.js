import { ReceiptModel, PaymentModel } from '../../model/FundTransactionMode.js';
import AccountMasterModel from '../../model/masters/AccountMasterModel.js';

/**
 * Validate transaction data before processing
 * @param {Object} data - Request body data
 * @param {mongoose.ClientSession} session - Database session
 * @returns {Object|null} - Error object or null if valid
 */
export const validateTransactionData = async (data, session) => {
  const {
    company,
    branch,
    transactionType,
    
    account,
    amount
  } = data;

  // Check required fields
  if (!company || !branch || !transactionType) {
    return {
      status: 400,
      message: 'Required fields are missing: company, branch, transactionType'
    };
  }

  // Check for account (either accountId or account)
  const finalAccountId =  account;
  if (!finalAccountId) {
    return {
      status: 400,
      message: 'Either accountId or account field is required'
    };
  }

  if (!amount) {
    return {
      status: 400,
      message: 'Amount is required'
    };
  }

  // Validate transaction type
  if (!['receipt', 'payment'].includes(transactionType.toLowerCase())) {
    return {
      status: 400,
      message: 'Invalid transaction type. Must be receipt or "payment"'
    };
  }

  // Validate amount
  if (amount <= 0) {
    return {
      status: 400,
      message: 'Amount must be greater than 0'
    };
  }

  // Verify account exists
  const accountDoc = await AccountMasterModel.findById(finalAccountId).session(session);
  if (!accountDoc) {
    return {
      status: 404,
      message: 'Account not found'
    };
  }

  // Validate payment mode if provided
  const validPaymentModes = ['cash', 'cheque', 'dd', 'bank_transfer'];
  if (data.paymentMode && !validPaymentModes.includes(data.paymentMode)) {
    return {
      status: 400,
      message: `Invalid payment mode. Must be one of: ${validPaymentModes.join(', ')}`
    };
  }

  // If cheque, validate cheque number
  if (data.paymentMode === 'cheque' && !data.chequeNumber) {
    return {
      status: 400,
      message: 'Cheque number is required for cheque payment mode'
    };
  }

  return null; // No errors
};

/**
 * Get the appropriate model based on transaction type
 * @param {String} transactionType - 'receipt' or 'payment'
 * @returns {mongoose.Model} - ReceiptModel or PaymentModel
 */
export const getTransactionModel = (transactionType) => {
  return transactionType.toLowerCase() === 'receipt' 
    ? ReceiptModel 
    : PaymentModel;
};

/**
 * Prepare transaction data for saving
 * @param {Object} body - Request body
 * @param {Object} user - Authenticated user object (optional)
 * @returns {Object} - Formatted transaction data
 */
export const prepareTransactionData = (body, user = null) => {
  const {
    company,
    branch,
    transactionType,
    date,
    
    account,
    accountName,
    previousBalanceAmount,
    amount,
    closingBalanceAmount,
    paymentMode,
    chequeNumber,
    bank,
    narration,
    description,
    createdBy
  } = body;

  // Use accountId if available, otherwise use account
  const finalAccountId = account;

  return {
    company,
    branch,
    transactionType: transactionType.toLowerCase(),
    date: date || new Date(),
    account: finalAccountId,
    accountName: accountName || '',
    previousBalanceAmount: previousBalanceAmount || 0,
    amount,
    closingBalanceAmount: closingBalanceAmount || 0,
    paymentMode: paymentMode || 'cash',
    chequeNumber: chequeNumber || null,
    bank: bank || null,
    narration: narration || '',
    description: description || '',
    settlementDetails: [], // Will be populated after FIFO settlement
    createdBy: createdBy || user?._id || null
  };
};

/**
 * Calculate transaction summary
 * @param {Array} transactions - Array of transaction documents
 * @returns {Object} - Summary statistics
 */
export const calculateTransactionSummary = (transactions) => {
  const summary = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    byPaymentMode: {},
    fullySettled: 0,
    partiallySettled: 0,
    unsettled: 0
  };

  transactions.forEach(txn => {
    summary.totalAmount += txn.amount;

    // Count by payment mode
    const mode = txn.paymentMode || 'unknown';
    summary.byPaymentMode[mode] = (summary.byPaymentMode[mode] || 0) + 1;

    // Settlement status
    const settledAmount = txn.settlementDetails?.reduce(
      (sum, s) => sum + s.settledAmount, 
      0
    ) || 0;

    if (settledAmount === 0) {
      summary.unsettled++;
    } else if (settledAmount < txn.amount) {
      summary.partiallySettled++;
    } else {
      summary.fullySettled++;
    }
  });

  return summary;
};

/**
 * Format transaction for display
 * @param {Object} transaction - Transaction document
 * @returns {Object} - Formatted transaction
 */
export const formatTransactionForDisplay = (transaction) => {
  const settledAmount = transaction.settlementDetails?.reduce(
    (sum, s) => sum + s.settledAmount,
    0
  ) || 0;

  const unsettledAmount = transaction.amount - settledAmount;

  return {
    id: transaction._id,
    transactionNumber: transaction.transactionNumber,
    transactionType: transaction.transactionType,
    date: transaction.date,
    accountName: transaction.accountName,
    amount: transaction.amount,
    paymentMode: transaction.paymentMode,
    settledAmount,
    unsettledAmount,
    settlementStatus: unsettledAmount === 0 
      ? 'fully_settled' 
      : settledAmount > 0 
        ? 'partially_settled' 
        : 'unsettled',
    settlementsCount: transaction.settlementDetails?.length || 0,
    narration: transaction.narration,
    createdAt: transaction.createdAt
  };
};

/**
 * Validate transaction for deletion
 * @param {Object} transaction - Transaction document
 * @returns {Object|null} - Error object or null if valid
 */
export const validateTransactionForDeletion = (transaction) => {
  // Check if transaction has settlements
  if (transaction.settlementDetails && transaction.settlementDetails.length > 0) {
    // You might want to allow deletion but reverse settlements
    // Or prevent deletion entirely
    return {
      status: 400,
      message: 'Cannot delete transaction with settlements. Consider reversing the transaction instead.',
      settlementCount: transaction.settlementDetails.length
    };
  }

  return null; // Can be deleted
};

/**
 * Build query for transaction search
 * @param {Object} filters - Search filters
 * @returns {Object} - MongoDB query object
 */
export const buildTransactionQuery = (filters) => {
  const query = {};

  if (filters.accountId || filters.account) {
    query.account = filters.accountId || filters.account;
  }

  if (filters.company) {
    query.company = filters.company;
  }

  if (filters.branch) {
    query.branch = filters.branch;
  }

  if (filters.paymentMode) {
    query.paymentMode = filters.paymentMode;
  }

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) {
      query.date.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.date.$lte = new Date(filters.endDate);
    }
  }

  if (filters.minAmount || filters.maxAmount) {
    query.amount = {};
    if (filters.minAmount) {
      query.amount.$gte = parseFloat(filters.minAmount);
    }
    if (filters.maxAmount) {
      query.amount.$lte = parseFloat(filters.maxAmount);
    }
  }

  if (filters.transactionNumber) {
    query.transactionNumber = new RegExp(filters.transactionNumber, 'i');
  }

  return query;
};