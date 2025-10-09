// const AccountLedger = require('../models/AccountLedger');
// const ItemLedger = require('../models/ItemLedger');
import AccountLedger from '../../model/AccountLedgerModel.js';
import ItemLedger from '../../model/ItemsLedgerModel.js';

/**
 * Create account ledger entry
 */
export const createAccountLedger = async (data, session) => {
  try {
    const {
      company,
      branch,
      account,
      accountName,
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType,
      ledgerSide, // "debit" or "credit"
      amount,
      narration,
      createdBy
    } = data;
    
    // Get last running balance for this account
    const lastBalance = await AccountLedger.getLastBalance(account, session);
    
    // Calculate new running balance
    let runningBalance;
    if (ledgerSide === 'debit') {
      runningBalance = lastBalance + amount;
    } else if (ledgerSide === 'credit') {
      runningBalance = lastBalance - amount;
    } else {
      throw new Error(`Invalid ledger side: ${ledgerSide}`);
    }
    
    // Create ledger entry
    const ledgerEntry = await AccountLedger.create([{
      company,
      branch,
      account,
      accountName,
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType,
      ledgerSide,
      amount,
      runningBalance,
      narration: narration || `${transactionType} transaction`,
      createdBy
    }], { session });
    
    return ledgerEntry[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create item ledger entries for all items in transaction
 */
export const createItemLedgers = async (data, session) => {
  try {
    const {
      company,
      branch,
      items,
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType,
      movementType, // "in" or "out"
      account,
      accountName,
      createdBy
    } = data;
    
    const ledgerEntries = [];
    
    for (const item of items) {
      // Get last running stock balance for this item
      const lastStockBalance = await ItemLedger.getLastStockBalance(
        item.item,
        branch,
        session
      );
      
      // Calculate new running stock balance
      let runningStockBalance;
      if (movementType === 'in') {
        runningStockBalance = lastStockBalance + item.quantity;
      } else if (movementType === 'out') {
        runningStockBalance = lastStockBalance - item.quantity;
      } else {
        throw new Error(`Invalid movement type: ${movementType}`);
      }
      
      // Create item ledger entry
      const ledgerEntry = {
        company,
        branch,
        item: item.item,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        transactionId,
        transactionNumber,
        transactionDate,
        transactionType,
        movementType,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        runningStockBalance,
        account,
        accountName,
        createdBy
      };
      
      ledgerEntries.push(ledgerEntry);
    }
    
    // Bulk create all item ledger entries
    const createdEntries = await ItemLedger.create(ledgerEntries, { session });
    
    return createdEntries;
  } catch (error) {
    throw error;
  }
};
