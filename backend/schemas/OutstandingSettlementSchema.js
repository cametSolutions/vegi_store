import mongoose from "mongoose";

/**
 * OutstandingSettlement - Link table between Fund Transactions and Outstanding records
 * This tracks which payments/receipts settled which invoices/bills
 */
 export const OutstandingSettlementSchema = new mongoose.Schema(
  {
    // ==================== COMPANY & BRANCH ====================
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
      index: true,
    },

    // ==================== ACCOUNT ====================
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      required: [true, "Account is required"],
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    // ==================== FUND TRANSACTION (Receipt/Payment) ====================
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "FundTransaction",
      required: [true, "Fund transaction is required"],
      index: true,
    },
    transactionModel: {
      type: String,
      enum: ["Receipt", "Payment"],
      required: true,
    },
    transactionNumber: {
      type: String,
      required: true,
      trim: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["receipt", "payment"],
      required: true,
    },

    // ==================== OUTSTANDING (Invoice/Bill) ====================
    outstanding: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outstanding",
      required: [true, "Outstanding is required"],
      index: true,
    },
    outstandingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    outstandingDate: {
      type: Date,
      required: true,
    },
    outstandingType: {
      type: String,
      enum: ["dr", "cr"],
      required: true,
    },

    // ==================== SETTLEMENT AMOUNTS ====================
    // Outstanding balance before this settlement
    previousOutstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Amount settled in this transaction
    settledAmount: {
      type: Number,
      required: true,
      min: [0.01, "Settled amount must be greater than 0"],
    },
    
    // Outstanding balance after this settlement
    remainingOutstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==================== SETTLEMENT INFO ====================
    settlementDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    settlementStatus: {
      type: String,
      enum: ["active", "reversed"],
      default: "active",
    },
    
    // ==================== REVERSAL INFO ====================
    // If this settlement was reversed (transaction deleted)
    reversedAt: {
      type: Date,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reversalReason: {
      type: String,
      trim: true,
    },

    // ==================== ADDITIONAL INFO ====================
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ==================== AUDIT FIELDS ====================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// Composite index for efficient queries
OutstandingSettlementSchema.index({ 
  company: 1, 
  account: 1, 
  settlementDate: -1 
});

OutstandingSettlementSchema.index({ 
  fundTransaction: 1, 
  settlementStatus: 1 
});

OutstandingSettlementSchema.index({ 
  outstanding: 1, 
  settlementStatus: 1 
});

OutstandingSettlementSchema.index({ 
  company: 1, 
  branch: 1, 
  fundTransactionType: 1 
});

// ==================== VIRTUALS ====================
// Check if settled
OutstandingSettlementSchema.virtual("isActive").get(function () {
  return this.settlementStatus === "active";
});

// Check if reversed
OutstandingSettlementSchema.virtual("isReversed").get(function () {
  return this.settlementStatus === "reversed";
});

// Settlement percentage
OutstandingSettlementSchema.virtual("settlementPercentage").get(function () {
  if (this.previousOutstandingAmount === 0) return 100;
  return Math.round((this.settledAmount / this.previousOutstandingAmount) * 100);
});

// ==================== INSTANCE METHODS ====================
// Reverse this settlement
OutstandingSettlementSchema.methods.reverse = function (userId, reason) {
  this.settlementStatus = "reversed";
  this.reversedAt = new Date();
  this.reversedBy = userId;
  this.reversalReason = reason || "transaction deleted";
  return this.save();
};

// ==================== STATIC METHODS ====================
// Get all settlements for a fund transaction
OutstandingSettlementSchema.statics.getByFundTransaction = function (
  fundTransactionId,
  includeReversed = false
) {
  const query = { fundTransaction: fundTransactionId };
  if (!includeReversed) {
    query.settlementStatus = "active";
  }
  return this.find(query)
    .populate("outstanding", "transactionNumber totalAmount closingBalanceAmount")
    .populate("account", "accountName")
    .sort({ settlementDate: 1 });
};

// Get all settlements for an outstanding
OutstandingSettlementSchema.statics.getByOutstanding = function (
  outstandingId,
  includeReversed = false
) {
  const query = { outstanding: outstandingId };
  if (!includeReversed) {
    query.settlementStatus = "active";
  }
  return this.find(query)
    .populate("fundTransaction", "transactionNumber amount")
    .sort({ settlementDate: 1 });
};

// Get settlement summary for an account
OutstandingSettlementSchema.statics.getAccountSummary = function (
  accountId,
  startDate,
  endDate
) {
  const matchConditions = {
    account: accountId,
    settlementStatus: "active",
  };

  if (startDate || endDate) {
    matchConditions.settlementDate = {};
    if (startDate) matchConditions.settlementDate.$gte = new Date(startDate);
    if (endDate) matchConditions.settlementDate.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$fundTransactionType",
        totalSettled: { $sum: "$settledAmount" },
        count: { $sum: 1 },
      },
    },
  ]);
};

// Get settlement history with details
OutstandingSettlementSchema.statics.getSettlementHistory = function (
  filters = {},
  page = 1,
  limit = 50
) {
  const query = { settlementStatus: "active", ...filters };
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate("account", "accountName accountType")
    .populate("fundTransaction", "transactionNumber amount")
    .populate("outstanding", "transactionNumber totalAmount closingBalanceAmount")
    .populate("company", "name")
    .populate("branch", "name")
    .sort({ settlementDate: -1 })
    .skip(skip)
    .limit(limit);
};

// Reverse all settlements for a fund transaction
OutstandingSettlementSchema.statics.reverseAllForTransaction = async function (
  fundTransactionId,
  userId,
  reason = "transaction deleted"
) {
  const settlements = await this.find({
    fundTransaction: fundTransactionId,
    settlementStatus: "active",
  });

  for (const settlement of settlements) {
    await settlement.reverse(userId, reason);
  }

  return settlements.length;
};

// ==================== PRE MIDDLEWARE ====================
// Validate amounts before saving
OutstandingSettlementSchema.pre("save", function (next) {
  // Ensure settled amount doesn't exceed previous outstanding
  if (this.settledAmount > this.previousOutstandingAmount) {
    return next(
      new Error("Settled amount cannot exceed previous outstanding amount")
    );
  }

  // Calculate remaining if not set
  if (!this.remainingOutstandingAmount && this.remainingOutstandingAmount !== 0) {
    this.remainingOutstandingAmount =
      this.previousOutstandingAmount - this.settledAmount;
  }

  next();
});
const OutstandingSettlement = mongoose.model("OutstandingSettlement", OutstandingSettlementSchema);
export default OutstandingSettlement;