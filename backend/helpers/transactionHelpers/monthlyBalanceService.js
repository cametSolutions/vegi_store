// const AccountMonthlyBalance = require('../models/AccountMonthlyBalance');
// const ItemMonthlyBalance = require('../models/ItemMonthlyBalance');
// const { generatePeriodKey, getMonthYear } = require('./dateHelper');

import { generatePeriodKey, getMonthYear } from '../../../shared/utils/date.js';
import AccountMonthlyBalance from '../../model/AccountMonthlyBalanceModel.js';
import ItemMonthlyBalance from '../../model/ItemMonthlyBalanceModel.js';


/**
 * Update account monthly balance (real-time)
 */
export const updateAccountMonthlyBalance = async (data, session) => {
  try {
    const {
      company,
      branch,
      account,
      accountName,
      transactionDate,
      ledgerSide, // "debit" or "credit"
      amount
    } = data;
    
    const periodKey = generatePeriodKey(transactionDate);
    const { month, year } = getMonthYear(transactionDate);
    
    // Check if this monthly balance already exists
    let monthlyBalance = await AccountMonthlyBalance.findOne({
      account,
      periodKey
    }).session(session);

    console.log("monthlyBalance",monthlyBalance);
    
    
    // If doesn't exist, we need to set opening balance
    if (!monthlyBalance) {
      // Get opening balance for this month
      const openingBalance = await AccountMonthlyBalance.getOpeningBalance(
        account,
        branch,
        company,
        year,
        month,
        session
      );

      console.log("openingBalance",openingBalance);
      
      // Create new monthly balance with opening balance
      monthlyBalance = new AccountMonthlyBalance({
        company,
        branch,
        account,
        accountName,
        month,
        year,
        periodKey,
        openingBalance,  // Set opening balance from previous month or master
        totalDebit: 0,
        totalCredit: 0,
        transactionCount: 0,
        lastUpdated: new Date()
      });
    }
    
    // Update transaction counts and amounts
    monthlyBalance.transactionCount += 1;
    
    if (ledgerSide === 'debit') {
      monthlyBalance.totalDebit += amount;
    } else if (ledgerSide === 'credit') {
      monthlyBalance.totalCredit += amount;
    }
    
    // Update metadata
    monthlyBalance.accountName = accountName;
    monthlyBalance.lastUpdated = new Date();
    
    // Calculate closing balance
    monthlyBalance.calculateClosingBalance();
    
    // Save
    await monthlyBalance.save({ session });
    
    return monthlyBalance;
  } catch (error) {
    throw error;
  }
};


/**
 * Update item monthly balances for all items (real-time)
 */
export const updateItemMonthlyBalances = async (data, session) => {
  try {
    const {
      company,
      branch,
      items,
      transactionDate,
      movementType // "in" or "out"
    } = data;
    
    const periodKey = generatePeriodKey(transactionDate);
    const { month, year } = getMonthYear(transactionDate);
    
    const updatedBalances = [];
    
    for (const item of items) {
      // Prepare update operations
      const updateOps = {
        $inc: {
          transactionCount: 1
        },
        $set: {
          company,
          branch,
          itemName: item.itemName,
          itemCode: item.itemCode,
          month,
          year,
          lastUpdated: new Date()
        }
      };
      
      // Increment stock in or out
      if (movementType === 'in') {
        updateOps.$inc.totalStockIn = item.quantity;
      } else if (movementType === 'out') {
        updateOps.$inc.totalStockOut = item.quantity;
      }
      
      // Find and update or create new
      const monthlyBalance = await ItemMonthlyBalance.findOneAndUpdate(
        { item: item.item, branch, periodKey },
        updateOps,
        {
          upsert: true,
          new: true,
          session,
          setDefaultsOnInsert: true
        }
      );
      
      // Calculate closing stock and total value
      monthlyBalance.calculateClosingStock();
      
      // Update average rate (weighted average - simplified here)
      if (movementType === 'in' && item.quantity > 0) {
        const totalValue = (monthlyBalance.averageRate * monthlyBalance.openingStock) + 
                          (item.rate * item.quantity);
        const totalQty = monthlyBalance.openingStock + item.quantity;
        monthlyBalance.averageRate = totalQty > 0 ? totalValue / totalQty : item.rate;
      }
      
      monthlyBalance.calculateTotalValue();
      await monthlyBalance.save({ session });
      
      updatedBalances.push(monthlyBalance);
    }
    
    return updatedBalances;
  } catch (error) {
    throw error;
  }
};
