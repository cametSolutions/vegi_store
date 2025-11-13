import mongoose from "mongoose";
import OutstandingModel from "../../model/OutstandingModel.js";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import OutstandingSettlementModel from "../../model/OutstandingSettlementModel.js";

/**
 * Update account outstanding balance after receipt/payment
 */
// export const updateAccountOutstanding = async ({
//   accountId,
//   amount,
//   transactionType,
//   session
// }) => {
//   console.log("\n💰 Updating account outstanding balance...");
  
//   const account = await AccountMasterModel.findById(accountId).session(session);

//   console.log("accountggggg",account);
  
  
//   if (!account) {
//     throw new Error('Account not found');
//   }
//  const normalizedType = transactionType.toLowerCase();
//    const isReceipt = normalizedType === 'receipt';
  
//    console.log("📊 Current balance:", {
//     outstandingDr: account.outstandingDr || 0,
//     outstandingCr: account.outstandingCr || 0
//   });

//   if (transactionType === 'receipt') {
//     account.outstandingDr = Math.max(0, (account.outstandingDr || 0) - amount);
//     console.log(`✅ Reduced DR by ${amount}, new DR: ${account.outstandingDr}`);
//   } else if (transactionType === 'payment') {
//     account.outstandingCr = Math.max(0, (account.outstandingCr || 0) - amount);
//     console.log(`✅ Reduced CR by ${amount}, new CR: ${account.outstandingCr}`);
//   }

//   await account.save({ session });
//   console.log("💾 Account balance updated successfully");
// };

/**
 * Settle outstanding items for an account using FIFO method
 */
export const settleOutstandingFIFO = async ({
  accountId,
  amount,
  type,
  transactionId,
  transactionNumber,
  transactionDate,
  company,
  branch,
  createdBy,
  session
}) => {
  console.log("\n🔄 ===== STARTING FIFO SETTLEMENT =====");
  console.log("parameters:", {
    accountId,
    amount,
    type,
    transactionId,
    transactionNumber,
    createdBy // Log to verify
  });

  if (amount <= 0) {
    console.log("⚠️ No amount to settle (amount <= 0)");
    return [];
  }

  const normalizedType = type.toLowerCase();
  
  const outstandingType = normalizedType === "receipt" ? "dr" : "cr";
  const appliedField = normalizedType === "receipt" ? "appliedReceipts" : "appliedPayments";
 
  const transactionModel = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  console.log("🎯 Settlement Type:", {
     type: normalizedType,
    outstandingType,
    appliedField,
    transactionModel
  });

  const query = {
    account: accountId,
    outstandingType,
    status: { $ne: "paid" },
    // closingBalanceAmount: { $gt: 0 }
  };

  const unpaidOutstandings = await OutstandingModel.find(query)
    .sort({ dueDate: 1, transactionDate: 1 })
    .session(session);

  console.log(`📊 Found ${unpaidOutstandings.length} unpaid outstanding(s)`);

  if (unpaidOutstandings.length === 0) {
    console.log("⚠️ No outstanding records found to settle!");
    return [];
  }

  let remainingAmount = amount;
  const settlements = [];
  const settlementLinkEntries = [];

  const account = await AccountMasterModel.findById(accountId).session(session);
  const accountName = account?.accountName || "";

  // ✅ FIX: Validate and convert createdBy to ObjectId
  let validCreatedBy = null;
  if (createdBy) {
    if (mongoose.Types.ObjectId.isValid(createdBy)) {
      validCreatedBy = createdBy instanceof mongoose.Types.ObjectId 
        ? createdBy 
        : new mongoose.Types.ObjectId(createdBy);
    } else {
      console.warn("⚠️ Invalid createdBy value:", createdBy);
    }
  }

  // console.log("🔍 Validated createdBy:", validCreatedBy);

  for (const outstanding of unpaidOutstandings) {
    if (remainingAmount <= 0) {
      console.log("✅ All amount settled!");
      break;
    }

    const toSettle = Math.min(outstanding.closingBalanceAmount, remainingAmount);
    const previousBalance = outstanding.closingBalanceAmount;

    console.log(`\n🔧 Settling outstanding ${outstanding.transactionNumber}:`, {
      closingBalance: outstanding.closingBalanceAmount,
      remainingAmount,
      toSettle
    });

    outstanding.paidAmount += toSettle;
    outstanding.closingBalanceAmount -= toSettle;

    if (outstanding.closingBalanceAmount === 0) {
      outstanding.status = "paid";
      console.log("✅ Outstanding fully paid");
    } else {
      outstanding.status = "partial";
      console.log(`⏳ Partial payment - remaining: ${outstanding.closingBalanceAmount}`);
    }

    if (!Array.isArray(outstanding[appliedField])) {
      outstanding[appliedField] = [];
    }

    outstanding[appliedField].push({
      transaction: transactionId,
      settledAmount: toSettle,
      transactionNumber,
      date: transactionDate || new Date()
    });

    console.log("outstanding",outstanding);
    

    await outstanding.save({ session });
    console.log("💾 Outstanding saved successfully");

    // ✅ FIX: Use validated createdBy
    const settlementLink = new OutstandingSettlementModel({
      company: company || outstanding.company,
      branch: branch || outstanding.branch,
      account: accountId,
      accountName,
      
      transaction: transactionId,
      transactionModel,
      transactionNumber: transactionNumber,
      transactionDate: transactionDate || new Date(),
      transactionType: normalizedType,
      
      outstanding: outstanding._id,
      outstandingNumber: outstanding.transactionNumber,
      outstandingDate: outstanding.transactionDate,
      outstandingType: outstanding.outstandingType,
      
      previousOutstandingAmount: previousBalance,
      settledAmount: toSettle,
      remainingOutstandingAmount: outstanding.closingBalanceAmount,
      
      settlementDate: transactionDate || new Date(),
      settlementStatus: "active",
      createdBy: validCreatedBy // ✅ Use validated ObjectId or null
    });

    await settlementLink.save({ session });
    settlementLinkEntries.push(settlementLink);
    console.log("💾 Settlement link table entry created");

    settlements.push({
      outstandingTransaction: outstanding._id,
      outstandingNumber: outstanding.transactionNumber,
      previousOutstanding: previousBalance,
      settledAmount: toSettle,
      remainingOutstanding: outstanding.closingBalanceAmount,
      settlementDate: transactionDate || new Date()
    });

    remainingAmount -= toSettle;
    console.log(`💵 Remaining amount to settle: ${remainingAmount}`);
  }

  console.log("\n✅ ===== FIFO SETTLEMENT COMPLETED =====");
  console.log(`📊 Summary:`, {
    totalSettled: amount - remainingAmount,
    outstandingsSettled: settlements.length,
    linkTableEntriesCreated: settlementLinkEntries.length,
    remainingUnsettled: remainingAmount
  });

  if (remainingAmount > 0) {
    console.log(`⚠️ Warning: ${remainingAmount} could not be settled`);
  }

  return settlements;
};

/**
 * Reverse outstanding settlement
 */
export const reverseOutstandingSettlement = async ({
  transactionId,
  settlementDetails,
  accountId,
  amount,
  transactionType,
  userId,
  session
}) => {
  console.log("\n🔄 ===== REVERSING OUTSTANDING SETTLEMENT =====");
  console.log("📋 Reversing transaction:", transactionId);

  if (!settlementDetails || settlementDetails.length === 0) {
    console.log("ℹ️ No settlements to reverse");
    return;
  }

  const appliedField = transactionType === "receipt" ? "appliedReceipts" : "appliedPayments";

  for (const settlement of settlementDetails) {
    const outstanding = await OutstandingModel.findById(
      settlement.outstandingTransaction
    ).session(session);

    if (!outstanding) {
      console.warn(`⚠️ Outstanding ${settlement.outstandingTransaction} not found`);
      continue;
    }

    console.log(`\n🔧 Reversing settlement for ${outstanding.transactionNumber}:`, {
      settledAmount: settlement.settledAmount,
      currentPaidAmount: outstanding.paidAmount,
      currentBalance: outstanding.closingBalanceAmount
    });

    outstanding.paidAmount = Math.max(0, outstanding.paidAmount - settlement.settledAmount);
    outstanding.closingBalanceAmount += settlement.settledAmount;

    if (outstanding.paidAmount === 0) {
      outstanding.status = "pending";
    } else if (outstanding.closingBalanceAmount > 0) {
      outstanding.status = "partial";
    }

    if (Array.isArray(outstanding[appliedField])) {
      outstanding[appliedField] = outstanding[appliedField].filter(
        applied => applied.transaction.toString() !== transactionId.toString()
      );
    }

    await outstanding.save({ session });
    console.log("✅ Settlement reversed");
  }

  console.log("\n🔗 Reversing link table entries...");
  const reversedCount = await OutstandingSettlementModel.reverseAllForTransaction(
    transactionId,
    userId,
    "transaction deleted"
  );
  console.log(`✅ Reversed ${reversedCount} link table entries`);

  const account = await AccountMasterModel.findById(accountId).session(session);
  if (account) {
    if (transactionType === 'receipt') {
      account.outstandingDr = (account.outstandingDr || 0) + amount;
      console.log(`✅ Restored DR by ${amount}, new DR: ${account.outstandingDr}`);
    } else if (transactionType === 'payment') {
      account.outstandingCr = (account.outstandingCr || 0) + amount;
      console.log(`✅ Restored CR by ${amount}, new CR: ${account.outstandingCr}`);
    }
    await account.save({ session });
  }

  console.log("✅ ===== SETTLEMENT REVERSAL COMPLETED =====");
};

/**
 * Get unsettled outstanding balance for an account
 */
export const getUnsettledBalance = async (accountId, outstandingType) => {
  const unsettledOutstandings = await OutstandingModel.find({
    account: accountId,
    outstandingType,
    status: { $ne: "paid" },
    closingBalanceAmount: { $gt: 0 }
  }).sort({ dueDate: 1, transactionDate: 1 });

  const outstandingsWithPending = [];
  let totalPending = 0;

  for (const outstanding of unsettledOutstandings) {
    // Get all settlements for this outstanding
    const settlements = await OutstandingSettlementModel.find({
      outstanding: outstanding._id,
      settlementStatus: "active"
    });

    // Calculate total receipts and payments from settlements
    let totalReceipts = 0;
    let totalPayments = 0;

    for (const settlement of settlements) {
      if (settlement.TransactionType === "receipt") {
        totalReceipts += settlement.settledAmount;
      } else if (settlement.TransactionType === "payment") {
        totalPayments += settlement.settledAmount;
      }
    }

    // Calculate pending based on outstanding type
    let pending;
    
    if (outstandingType === "dr") {
      // DR vouchers (Sale/Debit Note): Pending = Bill Amount - Receipts + Payments
      pending = outstanding.totalAmount - totalReceipts + totalPayments;
    } else {
      // CR vouchers (Purchase/Credit Note): Pending = -(Bill Amount - Payments + Receipts)
      pending = -(outstanding.totalAmount - totalPayments + totalReceipts);
    }

    totalPending += pending;

    outstandingsWithPending.push({
      id: outstanding._id,
      transactionNumber: outstanding.transactionNumber,
      transactionType: outstanding.transactionType,
      totalAmount: outstanding.totalAmount,
      paidAmount: outstanding.paidAmount,
      balance: outstanding.closingBalanceAmount,
      receipts: totalReceipts,
      payments: totalPayments,
      pending: pending,
      dueDate: outstanding.dueDate,
      status: outstanding.status
    });
  }

  return {
    count: unsettledOutstandings.length,
    totalAmount: unsettledOutstandings.reduce((sum, o) => sum + o.totalAmount, 0),
    totalPending: totalPending,
    outstandings: outstandingsWithPending
  };
};

/**
 * Get settlement history for a transaction
 */
export const getSettlementHistory = async (transactionId, type) => {
  const appliedField = type === "receipt" ? "appliedReceipts" : "appliedPayments";
  
  const outstandings = await OutstandingModel.find({
    [appliedField]: {
      $elemMatch: { transaction: transactionId }
    }
  });

  return outstandings.map(outstanding => {
    const applied = outstanding[appliedField].find(
      a => a.transaction.toString() === transactionId.toString()
    );
    
    return {
      outstandingId: outstanding._id,
      transactionNumber: outstanding.transactionNumber,
      transactionType: outstanding.transactionType,
      settledAmount: applied?.settledAmount || 0,
      settlementDate: applied?.date,
      totalAmount: outstanding.totalAmount,
      remainingBalance: outstanding.closingBalanceAmount
    };
  });
};