// const AccountMonthlyBalance = require('../models/AccountMonthlyBalance');
// const ItemMonthlyBalance = require('../models/ItemMonthlyBalance');
// const { generatePeriodKey, getMonthYear } = require('./dateHelper');

import {  generatePeriodKey, getMonthYear } from "../../../shared/utils/date.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";

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
      amount,
    } = data;

    const periodKey = generatePeriodKey(transactionDate);
    const { month, year } = getMonthYear(transactionDate);

    // Check if this monthly balance already exists
    let monthlyBalance = await AccountMonthlyBalance.findOne({
      account,
      periodKey,
    }).session(session);

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

      // Create new monthly balance with opening balance
      monthlyBalance = new AccountMonthlyBalance({
        company,
        branch,
        account,
        accountName,
        month,
        year,
        periodKey,
        openingBalance, // Set opening balance from previous month or master
        totalDebit: 0,
        totalCredit: 0,
        transactionCount: 0,
        lastUpdated: new Date(),
      });
    }

    // Update transaction counts and amounts
    monthlyBalance.transactionCount += 1;

    if (ledgerSide === "debit") {
      monthlyBalance.totalDebit += amount;
    } else if (ledgerSide === "credit") {
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
      movementType, // "in" or "out"
    } = data;

    const periodKey = generatePeriodKey(transactionDate);
    const { month, year } = getMonthYear(transactionDate);

    const updatedBalances = [];

    for (const item of items) {
      // Get opening stock using the static method
      const openingStock = await ItemMonthlyBalance.getOpeningStock(
        item.item,
        branch,
        company,
        year,
        month,
        session
      );


      // console.log("opening stock",openingStock);
      

      // Prepare update operations
      const updateOps = {
        $inc: {
          transactionCount: 1,
        },
        $set: {
          company,
          branch,
          itemName: item.itemName,
          itemCode: item.itemCode,
          month,
          year,
          lastUpdated: new Date(),
        },
        $setOnInsert: {
          openingStock: openingStock, // Set opening stock only on initial creation
          periodKey,
          item: item.item,
        },
      };

      // Increment stock in or out
      if (movementType === "in") {
        updateOps.$inc.totalStockIn = item.quantity;
      } else if (movementType === "out") {
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
          setDefaultsOnInsert: true,
        }
      );


      // Calculate closing stock and total value
      monthlyBalance.calculateClosingStock();
      await monthlyBalance.save({ session });
      updatedBalances.push(monthlyBalance);
    }

    return updatedBalances;
  } catch (error) {
    throw error;
  }
};





/**
 * Mark monthly balance records as needing recalculation
 * 
 * When a transaction is edited, it affects:
 * 1. The month of the transaction
 * 2. ALL subsequent months (because opening balance cascades forward)
 * 
 * Only marks EXISTING records - does not create new ones
 * 
 * Example: If Jan transaction is edited, mark Jan, Feb, Mar... Dec as dirty (if they exist)
 * 
 * @param {Object} params - Parameters
 * @param {ObjectId} params.accountId - Account ID
 * @param {Date} params.transactionDate - Transaction date
 * @param {ObjectId} params.company - Company ID
 * @param {ObjectId} params.branch - Branch ID
 * @param {Object} params.session - Mongoose session
 */
export const markMonthlyBalanceDirtyForFundTransaction = async ({
  accountId,
  transactionDate,
  company,
  branch,
  session,
}) => {
  console.log("\n📅 ===== MARKING MONTHLY BALANCES AS DIRTY =====");

  const date = new Date(transactionDate);
  const editedMonth = date.getMonth() + 1; // 1-12
  const editedYear = date.getFullYear();

  console.log("Transaction date:", {
    year: editedYear,
    month: editedMonth,
    date: date.toISOString().split('T')[0],
  });

  // ========================================
  // Find and update all monthly balance records >= edited month
  // ========================================

  const query = {
    company,
    branch,
    account: accountId,
    $or: [
      // Same year, month >= edited month
      {
        year: editedYear,
        month: { $gte: editedMonth },
      },
      // Future years (all months)
      {
        year: { $gt: editedYear },
      },
    ],
  };

  console.log("Marking existing monthly balance records as dirty...");

  // Update all matching records
  const result = await AccountMonthlyBalance.updateMany(
    query,
    {
      $set: {
        needsRecalculation: true,
        lastUpdated: new Date(),
      },
    },
    { session }
  );

  console.log(`✅ Marked ${result.modifiedCount} existing monthly balance record(s) as dirty`);

  // ========================================
  // Log affected periods for debugging
  // ========================================

  if (result.modifiedCount > 0) {
    const affectedRecords = await AccountMonthlyBalance.find(query)
      .select("periodKey needsRecalculation year month")
      .sort({ year: 1, month: 1 })
      .session(session);

    console.log("\n📋 Affected periods marked for recalculation:");
    affectedRecords.forEach((record) => {
      console.log(`  - ${record.periodKey}`);
    });

    console.log("\n✅ ===== MONTHLY BALANCE MARKING COMPLETED =====");

    return {
      markedCount: result.modifiedCount,
      affectedPeriods: affectedRecords.map((r) => r.periodKey),
      startPeriod: `${editedYear}-${String(editedMonth).padStart(2, "0")}`,
    };
  } else {
    console.log("⚠️ No existing monthly balance records found for this period");
    console.log("Records will be created when night job runs or when new transactions occur");
    
    console.log("\n✅ ===== MONTHLY BALANCE MARKING COMPLETED =====");

    return {
      markedCount: 0,
      affectedPeriods: [],
      startPeriod: `${editedYear}-${String(editedMonth).padStart(2, "0")}`,
    };
  }
};
