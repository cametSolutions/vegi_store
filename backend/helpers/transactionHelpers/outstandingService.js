import { calculateDueDate } from '../../../shared/utils/date.js';
import Outstanding from '../../model/OutstandingModel.js';

/**
 * Create outstanding record
 */
export const createOutstanding = async (data, session) => {
  try {
    const {
      company,
      branch,
      account,
      accountName,
      accountType,
      transactionModel,
      sourceTransaction,
      transactionType,
      transactionNumber,
      transactionDate,
      outstandingType, // "dr" or "cr"
      totalAmount,
      paidAmount,
      closingBalanceAmount,
      paymentTermDays = 30,
      notes,
      createdBy
    } = data;
    
    // Only create outstanding if there's a balance
    if (closingBalanceAmount <= 0) {
      return null;
    }
    
    // Calculate due date
    const dueDate = calculateDueDate(transactionDate, paymentTermDays);
    
    // Determine initial status
    let status = 'pending';
    if (paidAmount > 0 && closingBalanceAmount > 0) {
      status = 'partial';
    }
    
    // Create outstanding record
    const outstanding = await Outstanding.create([{
      company,
      branch,
      account,
      accountName,
      accountType,
      transactionModel,
      sourceTransaction,
      transactionType,
      transactionNumber,
      transactionDate,
      outstandingType,
      totalAmount,
      paidAmount,
      closingBalanceAmount,
      dueDate,
      status,
      notes,
      createdBy
    }], { session });
    
    return outstanding[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Update outstanding when payment is received
 */
export const updateOutstandingPayment = async (outstandingId, paidAmount, userId, session) => {
  try {
    const outstanding = await Outstanding.findById(outstandingId).session(session);
    
    if (!outstanding) {
      throw new Error('Outstanding record not found');
    }
    
    // Use instance method to update payment
    outstanding.updatePayment(paidAmount, userId);
    
    await outstanding.save({ session });
    
    return outstanding;
  } catch (error) {
    throw error;
  }
};
