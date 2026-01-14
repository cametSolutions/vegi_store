import mongoose from "mongoose";

/**
 * OutstandingSettlement - Link table between Fund Transactions/Offsets and Outstanding records
 * This tracks which payments/receipts/offsets settled which invoices/bills
 * 
 * ✅ UPDATED TO SUPPORT OFFSET
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

    // ==================== SETTLEMENT TRANSACTION (Receipt/Payment/Offset) ====================
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "transactionModel",
      required: [true, "Transaction is required"],
      index: true,
    },
    transactionModel: {
      type: String,
      enum: ["Receipt", "Payment", "OutstandingOffset"], // ✅ Added OutstandingOffset
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
      enum: ["receipt", "payment", "offset"], // ✅ Added offset
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
    previousOutstandingAmount: {
      type: Number,
      required: true,
    },
    
    settledAmount: {
      type: Number,
      required: true,
      min: [0.01, "Settled amount must be greater than 0"],
    },
    
    remainingOutstandingAmount: {
      type: Number,
      required: true,
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
OutstandingSettlementSchema.index({ 
  company: 1, 
  account: 1, 
  settlementDate: -1 
});

OutstandingSettlementSchema.index({ 
  transaction: 1, 
  settlementStatus: 1 
});

OutstandingSettlementSchema.index({ 
  outstanding: 1, 
  settlementStatus: 1 
});

OutstandingSettlementSchema.index({ 
  company: 1, 
  branch: 1, 
  transactionType: 1 
});

// ==================== VIRTUALS ====================
OutstandingSettlementSchema.virtual("isActive").get(function () {
  return this.settlementStatus === "active";
});

OutstandingSettlementSchema.virtual("isReversed").get(function () {
  return this.settlementStatus === "reversed";
});

OutstandingSettlementSchema.virtual("settlementPercentage").get(function () {
  if (this.previousOutstandingAmount === 0) return 100;
  return Math.round((this.settledAmount / Math.abs(this.previousOutstandingAmount)) * 100);
});

// ==================== INSTANCE METHODS ====================
OutstandingSettlementSchema.methods.reverse = function (userId, reason) {
  this.settlementStatus = "reversed";
  this.reversedAt = new Date();
  this.reversedBy = userId;
  this.reversalReason = reason || "Transaction deleted or edited";
  return this.save();
};

// ==================== STATIC METHODS ====================
OutstandingSettlementSchema.statics.getByTransaction = function (
  transactionId,
  includeReversed = false
) {
  const query = { transaction: transactionId };
  if (!includeReversed) {
    query.settlementStatus = "active";
  }
  return this.find(query)
    .populate("outstanding", "transactionNumber totalAmount closingBalanceAmount")
    .populate("account", "accountName")
    .sort({ settlementDate: 1 });
};

OutstandingSettlementSchema.statics.getByOutstanding = function (
  outstandingId,
  includeReversed = false
) {
  const query = { outstanding: outstandingId };
  if (!includeReversed) {
    query.settlementStatus = "active";
  }
  return this.find(query)
    .populate("transaction")
    .sort({ settlementDate: 1 });
};

OutstandingSettlementSchema.statics.getTotalSettled = async function (
  outstandingId,
  transactionType = null
) {
  const matchConditions = {
    outstanding: outstandingId,
    settlementStatus: "active",
  };

  if (transactionType) {
    matchConditions.transactionType = transactionType;
  }

  const result = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalSettled: { $sum: "$settledAmount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalSettled : 0;
};

OutstandingSettlementSchema.statics.reverseAllForTransaction = async function (
  transactionId,
  userId,
  reason = "Transaction deleted or edited",
  session
) {
  const settlements = await this.find({
    transaction: transactionId,
    settlementStatus: "active",
  }).session(session);

  for (const settlement of settlements) {
    settlement.settlementStatus = "reversed";
    settlement.reversedAt = new Date();
    settlement.reversedBy = userId;
    settlement.reversalReason = reason;
    await settlement.save({ session });
  }

  return settlements.length;
};

// ==================== PRE MIDDLEWARE ====================
OutstandingSettlementSchema.pre("save", function (next) {
  if (this.settledAmount > Math.abs(this.previousOutstandingAmount)) {
    return next(
      new Error("Settled amount cannot exceed previous outstanding amount")
    );
  }

  if (this.remainingOutstandingAmount === undefined) {
    this.remainingOutstandingAmount = this.previousOutstandingAmount - this.settledAmount;
  }

  next();
});

const OutstandingSettlement = mongoose.model("OutstandingSettlement", OutstandingSettlementSchema);
export default OutstandingSettlement;
