
import mongoose from 'mongoose';
import {processTransaction} from '../../helpers/transactionHelpers/transactionProcessor.js';
import  { determinePaymentStatus } from '../../helpers/transactionHelpers/calculationHelper.js';

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
    const userId = req.user._id; // From authentication middleware
    
    // Add audit fields
    transactionData.createdBy = userId;
    
    // Validate transaction type
    const validTypes = ['sales', 'purchase', 'credit_note', 'debit_note'];
    if (!validTypes.includes(transactionData.transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }
    
    // Validate required fields
    if (!transactionData.company || !transactionData.branch) {
      return res.status(400).json({
        success: false,
        message: 'Company and branch are required'
      });
    }
    
    if (!transactionData.account) {
      return res.status(400).json({
        success: false,
        message: 'Account is required'
      });
    }
    
    if (!transactionData.items || transactionData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Calculate and validate totals
    // const subtotal = calculationHelper.calculateSubtotal(transactionData.items);
    // const taxableAmount = calculationHelper.calculateTaxableAmount(transactionData.items);
    // const taxAmount = calculationHelper.calculateTaxAmount(transactionData.items);
    // const amountAfterTax = calculationHelper.calculateAmountAfterTax(subtotal, taxAmount);
    // const discountAmount = transactionData.discountAmount || 0;
    // const netAmount = calculationHelper.calculateNetAmount(amountAfterTax, discountAmount);
    // const paidAmount = transactionData.paidAmount || 0;
    // const closingBalanceAmount = calculationHelper.calculateClosingBalance(netAmount, paidAmount);
    const paymentStatus = determinePaymentStatus(netAmount, paidAmount);
    
    // // Update transaction data with calculated values
    // transactionData.subtotal = subtotal;
    // transactionData.taxableAmount = taxableAmount;
    // transactionData.taxAmount = taxAmount;
    // transactionData.amountAfterTax = amountAfterTax;
    // transactionData.netAmount = netAmount;
    // transactionData.closingBalanceAmount = closingBalanceAmount;
    transactionData.paymentStatus = paymentStatus;
    
    // Determine payment method
    if (paidAmount >= netAmount) {
      transactionData.paymentMethod = 'cash';
    } else if (paidAmount > 0) {
      transactionData.paymentMethod = 'credit'; // Partial payment
    } else {
      transactionData.paymentMethod = 'credit'; // Full credit
    }
    
    // Process transaction using helper (orchestrates all steps)
    const result = await processTransaction(
      transactionData,
      session
    );
    
    // Commit transaction
    await session.commitTransaction();
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: result.transaction,
        outstanding: result.outstanding,
        accountLedger: result.accountLedger,
        itemLedgers: result.itemLedgers
      }
    });
    
  } catch (error) {
    // Abort transaction on error (automatic rollback)
    await session.abortTransaction();
    
    console.error('Transaction creation error:', error);
    
    // Handle specific errors
    if (error.message.includes('Insufficient stock')) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
    
  } finally {
    // End session
    session.endSession();
  }
};


