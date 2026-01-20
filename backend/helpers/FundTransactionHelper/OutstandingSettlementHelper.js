import mongoose from "mongoose";
import OutstandingModel from "../../model/OutstandingModel.js";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import OutstandingSettlementModel from "../../model/OutstandingSettlementModel.js";

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
  session,
}) => {
  console.log("\n🔄 ===== STARTING FIFO SETTLEMENT =====");
  console.log("parameters:", {
    accountId,
    amount,
    type,
    transactionId,
    transactionNumber,
    createdBy, // Log to verify
  });

  if (amount <= 0) {
    console.log("⚠️ No amount to settle (amount <= 0)");
    return [];
  }

  const normalizedType = type.toLowerCase();

  const outstandingType = normalizedType === "receipt" ? "dr" : "cr";
  const appliedField =
    normalizedType === "receipt" ? "appliedReceipts" : "appliedPayments";

  const transactionModel =
    normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  console.log("🎯 Settlement Type:", {
    type: normalizedType,
    outstandingType,
    appliedField,
    transactionModel,
  });

  const query = {
    account: accountId,
    outstandingType,
    status: { $ne: "paid" },
    // closingBalanceAmount: { $gt: 0 }
  };

  if (normalizedType === "receipt") {
    query.closingBalanceAmount = { $gt: 0 };
  } else if (normalizedType === "payment") {
    query.closingBalanceAmount = { $lt: 0 };
  }

  const unpaidOutstandings = await OutstandingModel.find(query)
    .sort({ dueDate: 1, transactionDate: 1, createdAt: 1 })
    .session(session);

  console.log("unpaidOutstandings", unpaidOutstandings);

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
      validCreatedBy =
        createdBy instanceof mongoose.Types.ObjectId
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

    // Determine amount to settle based on outstanding type
    const toSettle =
      normalizedType === "payment"
        ? // For payments, closingBalanceAmount is negative, so use absolute value for correct settlement calculation
          Math.min(Math.abs(outstanding.closingBalanceAmount), remainingAmount)
        : // For receipts, closingBalanceAmount is positive and settled normally
          Math.min(outstanding.closingBalanceAmount, remainingAmount);

    const previousBalance = outstanding.closingBalanceAmount;

    console.log(`\n🔧 Settling outstanding ${outstanding.transactionNumber}:`, {
      closingBalance: outstanding.closingBalanceAmount,
      remainingAmount,
      toSettle,
    });

    // Update paidAmount and closingBalanceAmount based on type
    // For payments, add to closingBalanceAmount (negative), reducing its magnitude
    // For receipts, subtract from closingBalanceAmount (positive)
    outstanding.paidAmount += toSettle;
    if (normalizedType === "payment") {
      outstanding.closingBalanceAmount += toSettle; // reduce negative balance
    } else {
      outstanding.closingBalanceAmount -= toSettle; // reduce positive balance
    }

    if (outstanding.closingBalanceAmount === 0) {
      outstanding.status = "paid";
      console.log("✅ Outstanding fully paid");
    } else {
      outstanding.status = "partial";
      console.log(
        `⏳ Partial payment - remaining: ${outstanding.closingBalanceAmount}`
      );
    }

    if (!Array.isArray(outstanding[appliedField])) {
      outstanding[appliedField] = [];
    }

    outstanding[appliedField].push({
      transaction: transactionId,
      settledAmount: toSettle,
      transactionNumber,
      date: transactionDate || new Date(),
    });

    console.log("outstanding", outstanding);

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

      previousOutstandingAmount: Math.abs(previousBalance || 0),
      settledAmount: toSettle,
      remainingOutstandingAmount: Math.abs(
        outstanding.closingBalanceAmount || 0
      ),

      settlementDate: transactionDate || new Date(),
      settlementStatus: "active",
      createdBy: validCreatedBy, // ✅ Use validated ObjectId or null
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
      settlementDate: transactionDate || new Date(),
    });

    remainingAmount -= toSettle;
    console.log(`💵 Remaining amount to settle: ${remainingAmount}`);
  }

  console.log("\n✅ ===== FIFO SETTLEMENT COMPLETED =====");
  console.log(`📊 Summary:`, {
    totalSettled: amount - remainingAmount,
    outstandingsSettled: settlements.length,
    linkTableEntriesCreated: settlementLinkEntries.length,
    remainingUnsettled: remainingAmount,
  });

  if (remainingAmount > 0) {
    console.log(`⚠️ Warning: ${remainingAmount} could not be settled`);
  }

  return settlements;
};


/**
 * Reverse outstanding settlements (SOFT DELETE - marks as reversed)
 * Replaces deleteOutstandingSettlements()
 * 
 * This preserves audit trail by marking settlements as "reversed" instead of deleting them
 */
export const reverseOutstandingSettlements = async ({
  transactionId,
  transactionType,
  transactionNumber,
  accountId,
  amount,
  userId,
  reason = "Transaction edited or cancelled",
  session,
}) => {
  console.log("\n🔄 ===== REVERSING OUTSTANDING SETTLEMENTS =====");
  console.log("Transaction:", transactionNumber);
  console.log("Type:", transactionType);

  const normalizedType = transactionType.toLowerCase();

  // Find all active settlement link entries for this transaction
  const settlementLinks = await OutstandingSettlementModel.find({
    transaction: transactionId,
    settlementStatus: "active",
  }).session(session);

  console.log(`📊 Found ${settlementLinks.length} settlement(s) to reverse`);

  if (settlementLinks.length === 0) {
    console.log("⚠️ No active settlements found to reverse");
    return {
      count: 0,
      settlements: [],
    };
  }

  const reversedSettlements = [];

  for (const link of settlementLinks) {
    console.log(
      `\n🔧 Processing settlement for outstanding: ${link.outstandingNumber}`
    );

    // Find the outstanding record
    const outstanding = await OutstandingModel.findById(
      link.outstanding
    ).session(session);

    if (!outstanding) {
      console.warn(
        `⚠️ Outstanding ${link.outstandingNumber} not found, skipping...`
      );
      continue;
    }

    // Calculate reversal amounts
    const settledAmount = link.settledAmount;

    console.log("Settlement details:", {
      settledAmount,
      previousBalance: link.previousOutstandingAmount,
      currentBalance: outstanding.closingBalanceAmount,
    });

    // ========================================
    // RESTORE OUTSTANDING RECORD
    // ========================================

    // Reverse the settlement amounts in outstanding record
    outstanding.paidAmount -= settledAmount;

    // Restore closingBalanceAmount based on type
    if (normalizedType === "payment") {
      // For payments: subtract from closingBalanceAmount (make it more negative for CR type)
      outstanding.closingBalanceAmount -= settledAmount;
    } else {
      // For receipts: add to closingBalanceAmount (restore the DR amount)
      outstanding.closingBalanceAmount += settledAmount;
    }

    // Update status based on new balance
    const isFullyPaid = Math.abs(outstanding.closingBalanceAmount) < 0.01;

    if (isFullyPaid) {
      outstanding.status = "paid";
    } else if (outstanding.paidAmount === 0) {
      outstanding.status = "pending";
    } else {
      outstanding.status = "partial";
    }

    // Update outstandingType based on closingBalanceAmount
    if (outstanding.closingBalanceAmount > 0) {
      outstanding.outstandingType = "dr";
    } else if (outstanding.closingBalanceAmount < 0) {
      outstanding.outstandingType = "cr";
    }
    // If balance is 0, keep existing type (doesn't matter for paid status)

    await outstanding.save({ session });
    console.log("✅ Outstanding restored:", {
      newBalance: outstanding.closingBalanceAmount,
      newType: outstanding.outstandingType,
      newStatus: outstanding.status,
      newPaidAmount: outstanding.paidAmount,
    });

    // ========================================
    // MARK SETTLEMENT AS REVERSED (SOFT DELETE)
    // ========================================
    link.settlementStatus = "reversed";
    link.reversedAt = new Date();
    link.reversedBy = userId;
    link.reversalReason = reason;

    await link.save({ session });
    console.log("✅ Settlement marked as reversed:", link._id);

    // ========================================
    // STORE REVERSAL INFO
    // ========================================
    reversedSettlements.push({
      settlementId: link._id,
      outstandingId: outstanding._id,
      outstandingNumber: outstanding.transactionNumber,
      settledAmount,
      previousBalance: link.previousOutstandingAmount,
      restoredBalance: outstanding.closingBalanceAmount,
      reversedAt: link.reversedAt,
    });
  }

  console.log("\n✅ ===== REVERSAL COMPLETED =====");
  console.log(`Total reversed: ${reversedSettlements.length} settlement(s)`);

  return {
    count: reversedSettlements.length,
    settlements: reversedSettlements,
  };
};



/**
 * Delete all outstanding settlements for a transaction and restore outstanding records
 *
 * Process:
 * 1. Find all OutstandingSettlement entries for this transaction
 * 2. For each settlement, restore the outstanding record to pre-settlement state
 * 3. DELETE settlement link entries (not mark as reversed)
 * 4. Remove transaction from outstanding's appliedReceipts/appliedPayments array
 *
 * @returns Array of deleted settlement details (for adjustment entry tracking)
 */
export const deleteOutstandingSettlements = async ({
  transactionId,
  transactionType,
  transactionNumber,
  accountId,
  amount,
  session,
}) => {
  console.log("\n🔄 ===== DELETING OUTSTANDING SETTLEMENTS =====");
  console.log("Transaction:", transactionNumber);
  console.log("Type:", transactionType);

  const normalizedType = transactionType.toLowerCase();
  const appliedField =
    normalizedType === "receipt" ? "appliedReceipts" : "appliedPayments";

  // Find all settlement link entries for this transaction
  const settlementLinks = await OutstandingSettlementModel.find({
    transaction: transactionId,
    settlementStatus: "active",
  }).session(session);

  console.log(`📊 Found ${settlementLinks.length} settlement(s) to delete`);

  if (settlementLinks.length === 0) {
    console.log("⚠️ No settlements found to delete");
    return [];
  }

  const deletedSettlements = [];

  for (const link of settlementLinks) {
    console.log(
      `\n🔧 Processing settlement for outstanding: ${link.outstandingNumber}`
    );

    // Find the outstanding record
    const outstanding = await OutstandingModel.findById(
      link.outstanding
    ).session(session);

    if (!outstanding) {
      console.warn(
        `⚠️ Outstanding ${link.outstandingNumber} not found, skipping...`
      );
      continue;
    }

    // Calculate reversal amounts
    const settledAmount = link.settledAmount;
    const previousBalance = link.previousOutstandingAmount;

    console.log("Settlement details:", {
      settledAmount,
      previousBalance,
      currentBalance: outstanding.closingBalanceAmount,
    });

    // ========================================
    // RESTORE OUTSTANDING RECORD
    // ========================================

    // Reverse the settlement amounts in outstanding record
    outstanding.paidAmount -= settledAmount;

    // Restore closingBalanceAmount based on type
    if (normalizedType === "payment") {
      // For payments: subtract from closingBalanceAmount (make it more negative for CR type)
      outstanding.closingBalanceAmount -= settledAmount;
    } else {
      // For receipts: add to closingBalanceAmount (restore the DR amount)
      outstanding.closingBalanceAmount += settledAmount;
    }

    // Update status based on new balance
    if (outstanding.closingBalanceAmount === 0) {
      outstanding.status = "paid";
    } else if (outstanding.paidAmount === 0) {
      outstanding.status = "pending";
    } else {
      outstanding.status = "partial";
    }

    // // Remove this transaction from appliedReceipts/appliedPayments array
    // if (Array.isArray(outstanding[appliedField])) {
    //   outstanding[appliedField] = outstanding[appliedField].filter(
    //     (app) => app.transaction.toString() !== transactionId.toString()
    //   );
    // }

    await outstanding.save({ session });
    console.log("✅ Outstanding restored:", {
      newBalance: outstanding.closingBalanceAmount,
      newStatus: outstanding.status,
      newPaidAmount: outstanding.paidAmount,
    });

    // ========================================
    // STORE INFO BEFORE DELETION (for adjustment tracking)
    // ========================================
    deletedSettlements.push({
      settlementLinkId: link._id,
      outstandingId: outstanding._id,
      outstandingNumber: outstanding.transactionNumber,
      settledAmount,
      previousBalance: link.previousOutstandingAmount,
      restoredBalance: outstanding.closingBalanceAmount,
    });

    // ========================================
    // DELETE SETTLEMENT LINK (not mark as reversed)
    // ========================================
    await OutstandingSettlementModel.deleteOne({ _id: link._id }, { session });
    console.log("✅ Settlement link deleted:", link._id);
  }

  console.log("\n✅ ===== DELETION COMPLETED =====");
  console.log(`Total deleted: ${deletedSettlements.length} settlement(s)`);

  return deletedSettlements;
};

