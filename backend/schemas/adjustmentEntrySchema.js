// model/AdjustmentEntryModel.js

import mongoose from "mongoose";
import { nanoid } from 'nanoid';
const { Schema } = mongoose;

export const adjustmentEntrySchema = new Schema(
  {
    // ========================================
    // REFERENCE FIELDS
    // ========================================
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    // ========================================
    // ORIGINAL TRANSACTION REFERENCE
    // ========================================
    originalTransaction: {
      type: Schema.Types.ObjectId,
      refPath: "originalTransactionModel",
      required: true,
    },
    originalTransactionModel: {
      type: String,
      required: true,
      enum: ["Sale", "Purchase", "SalesReturn", "PurchaseReturn", "Receipt", "Payment"], // ✅ UPDATED
    },
    originalTransactionNumber: {
      type: String,
      required: true,
      index: true,
    },
    originalTransactionDate: {
      type: Date,
      required: true,
    },

    // ========================================
    // ADJUSTMENT METADATA
    // ========================================
    adjustmentNumber: {
      type: String,
      required: true,
    },
    adjustmentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    adjustmentType: {
      type: String,
      required: true,
      enum: [
        "amount_change",      // Net amount increased/decreased
        "account_change",     // Party/account changed
        "item_change",        // Items added/removed/quantity changed
        "mixed",              // Multiple types in one edit
      ],
      index: true,
    },

    // ========================================
    // AFFECTED ENTITIES
    // ========================================
    affectedAccount: {
      type: Schema.Types.ObjectId,
      ref: "AccountMaster",
      index: true,
    },
    affectedAccountName: String,

    // For account change adjustments (not used for receipt/payment currently)
    oldAccount: {
      type: Schema.Types.ObjectId,
      ref: "AccountMaster",
    },
    oldAccountName: String,
    newAccount: {
      type: Schema.Types.ObjectId,
      ref: "AccountMaster",
    },
    newAccountName: String,

    // ========================================
    // ADJUSTMENT DETAILS
    // ========================================
    // For amount adjustments
    amountDelta: {
      type: Number,
      default: 0,
    },
    oldAmount: Number,
    newAmount: Number,

    // For item adjustments (Sale/Purchase only)
    itemAdjustments: [
      {
        item: {
          type: Schema.Types.ObjectId,
          ref: "ItemMaster",
        },
        itemName: String,
        itemCode: String,
        adjustmentType: {
          type: String,
          enum: ["added", "removed", "quantity_changed", "rate_changed", "quantity_and_rate_changed", "unchanged"],
        },
        oldQuantity: {
          type: Number,
          default: 0,
        },
        newQuantity: {
          type: Number,
          default: 0,
        },
        quantityDelta: Number,
        oldRate: Number,
        newRate: Number,
        rateDelta: Number,
      },
    ],

    // ========================================
    // ✅ NEW: CASH/BANK IMPACT (Receipt/Payment)
    // ========================================
    cashBankImpact: {
      accountId: {
        type: Schema.Types.ObjectId,
        ref: "AccountMaster",
      },
      accountName: String,
      reversedLedgerEntry: {
        type: Schema.Types.ObjectId,
        ref: "CashBankLedger",
      },
      newLedgerEntry: {
        type: Schema.Types.ObjectId,
        ref: "CashBankLedger",
      },
    },

    // ========================================
    // ✅ NEW: SETTLEMENT SUMMARY (Receipt/Payment)
    // ========================================
    settlementsSummary: {
      oldSettlementsCount: Number,
      newSettlementsCount: Number,
      outstandingsReversed: [String],  // Array of outstanding numbers that were reversed
      outstandingsSettled: [String],   // Array of outstanding numbers that were settled after edit
    },

    // ========================================
    // OUTSTANDING REFERENCE
    // ========================================
    outstandingAffected: {
      type: Schema.Types.ObjectId,
      ref: "Outstanding",
    },
    outstandingOldBalance: Number,
    outstandingNewBalance: Number,

    // ========================================
    // AUDIT & REASON
    // ========================================
    reason: {
      type: String,
      default: "Transaction edited",
    },
    notes: String,
    
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // STATUS & FLAGS
    // ========================================
    status: {
      type: String,
      enum: ["active", "reversed", "cancelled"],
      default: "active",
      index: true,
    },
    isSystemGenerated: {
      type: Boolean,
      default: true,
    },

    // ========================================
    // REVERSAL TRACKING
    // ========================================
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedAt: Date,
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reversalReason: String,
  },
  {
    timestamps: true,
    collection: "adjustment_entries",
  }
);

// ========================================
// INDEXES
// ========================================
adjustmentEntrySchema.index({ company: 1, branch: 1, adjustmentDate: -1 });
adjustmentEntrySchema.index({ originalTransaction: 1, adjustmentDate: -1 });
adjustmentEntrySchema.index({ affectedAccount: 1, adjustmentDate: -1 });
adjustmentEntrySchema.index({ adjustmentNumber: 1 }, { unique: true });
adjustmentEntrySchema.index({ oldAccount: 1, branch: 1, originalTransactionDate: 1 });
adjustmentEntrySchema.index({ affectedAccount: 1, branch: 1, originalTransactionDate: 1 });
adjustmentEntrySchema.index({ "itemAdjustments.item": 1, branch: 1, originalTransactionDate: 1, status: 1 });
adjustmentEntrySchema.index({ originalTransaction: 1 });

// ========================================
// STATIC METHODS
// ========================================

/**
 * Generate adjustment number
 */


adjustmentEntrySchema.statics.generateAdjustmentNumber = async function (
  company,
  branch,
  session
) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  const prefix = `ADJ-${year}${month}`;
  
  // Generate unique ID using nanoid
  const uniqueId = nanoid(4);
  
  return `${prefix}-${uniqueId}`;
};

/**
 * Get all adjustments for a transaction
 */
adjustmentEntrySchema.statics.getAdjustmentsForTransaction = async function (
  transactionId,
  session
) {
  return this.find({
    originalTransaction: transactionId,
    status: "active",
  })
    .sort({ adjustmentDate: -1 })
    .session(session);
};

/**
 * Get adjustments for an account in a date range
 */
adjustmentEntrySchema.statics.getAccountAdjustments = async function (
  accountId,
  startDate,
  endDate,
  session
) {
  const query = {
    affectedAccount: accountId,
    status: "active",
  };

  if (startDate || endDate) {
    query.adjustmentDate = {};
    if (startDate) query.adjustmentDate.$gte = new Date(startDate);
    if (endDate) query.adjustmentDate.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ adjustmentDate: -1 })
    .populate("originalTransaction")
    .populate("editedBy", "name email")
    .session(session);
};

/**
 * Get total adjustment amount for an account
 */
adjustmentEntrySchema.statics.getTotalAdjustmentAmount = async function (
  accountId,
  startDate,
  endDate
) {
  const matchStage = {
    affectedAccount: mongoose.Types.ObjectId(accountId),
    status: "active",
  };

  if (startDate || endDate) {
    matchStage.adjustmentDate = {};
    if (startDate) matchStage.adjustmentDate.$gte = new Date(startDate);
    if (endDate) matchStage.adjustmentDate.$lte = new Date(endDate);
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalIncrease: {
          $sum: {
            $cond: [{ $gt: ["$amountDelta", 0] }, "$amountDelta", 0],
          },
        },
        totalDecrease: {
          $sum: {
            $cond: [{ $lt: ["$amountDelta", 0] }, "$amountDelta", 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalIncrease: 0, totalDecrease: 0, count: 0 };
};

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Reverse this adjustment
 */
adjustmentEntrySchema.methods.reverse = async function (userId, reason, session) {
  this.isReversed = true;
  this.reversedAt = new Date();
  this.reversedBy = userId;
  this.reversalReason = reason;
  this.status = "reversed";

  return this.save({ session });
};

const AdjustmentEntry = mongoose.model("AdjustmentEntry", adjustmentEntrySchema);

export default AdjustmentEntry;
