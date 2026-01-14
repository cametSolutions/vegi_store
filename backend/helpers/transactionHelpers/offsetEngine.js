import mongoose from "mongoose";
import Outstanding from "../../model/OutstandingModel.js";
import OutstandingOffset from "../../model/OutstandingOffsetModel.js";
import OutstandingSettlement from "../../model/OutstandingSettlementModel.js";

/**
 * ============================================
 * OFFSET ENGINE
 * ============================================
 *
 * Auto-calculates and applies offset (set-off) between DR and CR outstanding
 * for a given account within the same branch.
 */

/**
 * Apply offset for an account (main entry point)
 */
export const applyOffset = async ({
  accountId,
  companyId,
  branchId,
  userId,
  session,
}) => {
  try {
    console.log(`🔄 Starting offset calculation for account: ${accountId}`);

    // Step 1: Fetch all pending DR and CR outstanding
    const { drOutstanding, crOutstanding, totalDR, totalCR } =
      await fetchPendingOutstanding({
        accountId,
        companyId,
        branchId,
        session,
      });

    console.log(`📊 Total DR: ${totalDR}, Total CR: ${Math.abs(totalCR)}`);

    // Step 2: Check if offset is applicable
    if (drOutstanding.length === 0 || crOutstanding.length === 0) {
      console.log("⚠️ No offset possible (missing DR or CR)");
      return {
        success: false,
        message: "No offset applicable (no matching DR/CR)",
        offsetAmount: 0,
      };
    }

    const offsetAmount = Math.min(totalDR, Math.abs(totalCR));

    if (offsetAmount <= 0) {
      console.log("⚠️ No offset possible (offsetAmount = 0)");
      return {
        success: false,
        message: "No offset applicable",
        offsetAmount: 0,
      };
    }

    console.log(`✅ Offset amount: ${offsetAmount}`);

    // Step 3: Create OutstandingOffset voucher
    const offsetVoucher = await createOffsetVoucher({
      accountId,
      accountName:
        drOutstanding[0]?.accountName || crOutstanding[0]?.accountName,
      companyId,
      branchId,
      offsetAmount,
      userId,
      session,
    });

    console.log(`✅ Created offset voucher: ${offsetVoucher.offsetNumber}`);

    // Step 4: Apply offset using FIFO
    const settlements = await applyOffsetFIFO({
      drOutstanding,
      crOutstanding,
      offsetAmount,
      offsetVoucher,
      userId,
      session,
    });

    console.log(`✅ Created ${settlements.length} settlements`);

    // Step 5: Update outstanding balances
    await updateOutstandingBalances(settlements, session);

    console.log(`✅ Offset applied successfully`);

    return {
      success: true,
      message: "Offset applied successfully",
      offsetAmount,
      offsetVoucher: {
        _id: offsetVoucher._id,
        offsetNumber: offsetVoucher.offsetNumber,
        offsetDate: offsetVoucher.offsetDate,
      },
      settlementsCount: settlements.length,
      drSettled: settlements.filter((s) => s.outstandingType === "dr").length,
      crSettled: settlements.filter((s) => s.outstandingType === "cr").length,
    };
  } catch (error) {
    console.error("❌ Offset engine error:", error);
    throw error;
  }
};

/**
 * Fetch all pending DR and CR outstanding for an account
 */
const fetchPendingOutstanding = async ({
  accountId,
  companyId,
  branchId,
  session,
}) => {
  // Fetch DR outstanding (customer owes us)
  const drOutstanding = await Outstanding.find({
    company: companyId,
    branch: branchId,
    account: accountId,
    outstandingType: "dr",
    closingBalanceAmount: { $gt: 0 },
    status: { $in: ["pending", "partial", "overdue"] },
  })
    .sort({ transactionDate: 1 }) // FIFO by transaction date
    .session(session)
    .lean();

  // Fetch CR outstanding (we owe customer/supplier)
  const crOutstanding = await Outstanding.find({
    company: companyId,
    branch: branchId,
    account: accountId,
    outstandingType: "cr",
    closingBalanceAmount: { $lt: 0 },
    status: { $in: ["pending", "partial", "overdue"] },
  })
    .sort({ transactionDate: 1 }) // FIFO by transaction date
    .session(session)
    .lean();

  // Calculate totals
  const totalDR = drOutstanding.reduce(
    (sum, o) => sum + o.closingBalanceAmount,
    0
  );
  const totalCR = crOutstanding.reduce(
    (sum, o) => sum + o.closingBalanceAmount,
    0
  ); // This will be negative

  return {
    drOutstanding,
    crOutstanding,
    totalDR,
    totalCR,
  };
};

/**
 * Create OutstandingOffset voucher
 */
const createOffsetVoucher = async ({
  accountId,
  accountName,
  companyId,
  branchId,
  offsetAmount,
  userId,
  session,
}) => {
  const offsetVoucherArray = await OutstandingOffset.create(
    [
      {
        company: companyId,
        branch: branchId,
        account: accountId,
        accountName,
        offsetDate: new Date(),
        offsetAmount,
        status: "active",
        notes: "Auto-generated offset",
        createdBy: userId,
      },
    ],
    { session }
  );

  return offsetVoucherArray[0];
};

/**
 * Apply offset using FIFO logic
 * Distributes offsetAmount across DR and CR outstanding
 */

const applyOffsetFIFO = async ({
  drOutstanding,
  crOutstanding,
  offsetAmount,
  offsetVoucher,
  userId,
  session,
}) => {
  const settlements = [];
  let remainingOffset = offsetAmount;

  // Phase 1: Settle DR outstanding
  for (const dr of drOutstanding) {
    if (remainingOffset <= 0) break;

    const availableDR = dr.closingBalanceAmount;
    const settleAmount = Math.min(availableDR, remainingOffset);

    const settlement = {
      company: dr.company,
      branch: dr.branch,
      account: dr.account,
      accountName: dr.accountName,
      transaction: offsetVoucher._id,
      transactionModel: "OutstandingOffset",
      transactionNumber: offsetVoucher.offsetNumber,
      transactionDate: offsetVoucher.offsetDate,
      transactionType: "offset",
      outstanding: dr._id,
      outstandingNumber: dr.transactionNumber,
      outstandingDate: dr.transactionDate,
      outstandingType: "dr",
      previousOutstandingAmount: dr.closingBalanceAmount,
      settledAmount: settleAmount,
      remainingOutstandingAmount: dr.closingBalanceAmount - settleAmount,
      settlementDate: new Date(),
      settlementStatus: "active",
      notes: `Offset via ${offsetVoucher.offsetNumber}`,
      createdBy: userId,
    };

    settlements.push(settlement);
    remainingOffset -= settleAmount;
  }

  // Reset for CR phase
  remainingOffset = offsetAmount;

  // Phase 2: Settle CR outstanding
  for (const cr of crOutstanding) {
    if (remainingOffset <= 0) break;

    const availableCR = Math.abs(cr.closingBalanceAmount);
    const settleAmount = Math.min(availableCR, remainingOffset);

    const settlement = {
      company: cr.company,
      branch: cr.branch,
      account: cr.account,
      accountName: cr.accountName,
      transaction: offsetVoucher._id,
      transactionModel: "OutstandingOffset",
      transactionNumber: offsetVoucher.offsetNumber,
      transactionDate: offsetVoucher.offsetDate,
      transactionType: "offset",
      outstanding: cr._id,
      outstandingNumber: cr.transactionNumber,
      outstandingDate: cr.transactionDate,
      outstandingType: "cr",
      previousOutstandingAmount: cr.closingBalanceAmount, // Negative
      settledAmount: settleAmount,
      remainingOutstandingAmount: cr.closingBalanceAmount + settleAmount, // Adding to negative
      settlementDate: new Date(),
      settlementStatus: "active",
      notes: `Offset via ${offsetVoucher.offsetNumber}`,
      createdBy: userId,
    };

    settlements.push(settlement);
    remainingOffset -= settleAmount;
  }

  // ✅ Bulk create settlements with ordered: true
  const createdSettlements = await OutstandingSettlement.create(settlements, {
    session,
    ordered: true,  // ✅ CRITICAL: Required when using session with multiple docs
  });

  return createdSettlements;
};


/**
 * Update outstanding balances after settlement
 */
const updateOutstandingBalances = async (settlements, session) => {
  for (const settlement of settlements) {
    const outstanding = await Outstanding.findById(
      settlement.outstanding
    ).session(session);

    if (!outstanding) {
      throw new Error(`Outstanding not found: ${settlement.outstanding}`);
    }

    // Update balance
    outstanding.closingBalanceAmount = settlement.remainingOutstandingAmount;

    // Update paidAmount (track total settled via all methods)
    if (settlement.outstandingType === "dr") {
      outstanding.paidAmount += settlement.settledAmount;
    } else {
      outstanding.paidAmount += settlement.settledAmount;
    }

    // Update status
    if (Math.abs(outstanding.closingBalanceAmount) < 0.01) {
      outstanding.status = "paid"; // Fully settled
      outstanding.closingBalanceAmount = 0; // Clean up floating point
    } else if (outstanding.paidAmount > 0) {
      outstanding.status = "partial";
    }

    await outstanding.save({ session });
  }
};

/**
 * Reverse offset (when transaction is edited/deleted)
 */
export const reverseOffset = async (offsetId, userId, reason, session) => {
  try {
    console.log(`🔄 Reversing offset: ${offsetId}`);

    const offset = await OutstandingOffset.findById(offsetId).session(session);

    if (!offset) {
      throw new Error("Offset not found");
    }

    if (offset.status === "reversed") {
      console.log("⚠️ Offset already reversed");
      return { success: true, message: "Already reversed" };
    }

    offset.status = "reversed";
    offset.reversedAt = new Date();
    offset.reversedBy = userId;
    offset.reversalReason = reason;
    await offset.save({ session });

    // Reverse all settlements
    const settlements = await OutstandingSettlement.find({
      transaction: offsetId,
      settlementStatus: "active",
    }).session(session);

    for (const settlement of settlements) {
      // Restore outstanding balance
      const outstanding = await Outstanding.findById(
        settlement.outstanding
      ).session(session);

      if (outstanding) {
        outstanding.closingBalanceAmount = settlement.previousOutstandingAmount;

        // Reduce paidAmount
        if (settlement.outstandingType === "dr") {
          outstanding.paidAmount -= settlement.settledAmount;
        } else {
          outstanding.paidAmount -= settlement.settledAmount;
        }

        // Update status
        if (outstanding.paidAmount === 0) {
          outstanding.status = "pending";
        } else if (outstanding.paidAmount > 0) {
          outstanding.status = "partial";
        }

        await outstanding.save({ session });
      }

      // Mark settlement as reversed
      settlement.settlementStatus = "reversed";
      settlement.reversedAt = new Date();
      settlement.reversedBy = userId;
      settlement.reversalReason = reason;
      await settlement.save({ session });
    }

    console.log(`✅ Reversed ${settlements.length} settlements`);

    return {
      success: true,
      message: "Offset reversed successfully",
      settlementsReversed: settlements.length,
    };
  } catch (error) {
    console.error("❌ Offset reversal error:", error);
    throw error;
  }
};

/**
 * Check available offset amount for an account (without applying)
 */
export const checkAvailableOffset = async ({
  accountId,
  companyId,
  branchId,
  session = null,
}) => {
  const { drOutstanding, crOutstanding, totalDR, totalCR } =
    await fetchPendingOutstanding({
      accountId,
      companyId,
      branchId,
      session,
    });

  const offsetAmount = Math.min(totalDR, Math.abs(totalCR));

  return {
    available: offsetAmount > 0,
    offsetAmount,
    totalDR,
    totalCR: Math.abs(totalCR),
    drCount: drOutstanding.length,
    crCount: crOutstanding.length,
  };
};

/**
 * Get offset history for an account
 */
export const getOffsetHistory = async ({
  accountId,
  companyId,
  branchId,
  page = 1,
  limit = 20,
}) => {
  const skip = (page - 1) * limit;

  const [total, offsets] = await Promise.all([
    OutstandingOffset.countDocuments({
      company: companyId,
      branch: branchId,
      account: accountId,
    }),
    OutstandingOffset.find({
      company: companyId,
      branch: branchId,
      account: accountId,
    })
      .sort({ offsetDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Get settlement count for each offset
  const offsetsWithDetails = await Promise.all(
    offsets.map(async (offset) => {
      const settlementCount = await OutstandingSettlement.countDocuments({
        transaction: offset._id,
        settlementStatus: "active",
      });

      return {
        ...offset,
        settlementCount,
      };
    })
  );

  return {
    data: offsetsWithDetails,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + offsets.length < total,
    },
  };
};
