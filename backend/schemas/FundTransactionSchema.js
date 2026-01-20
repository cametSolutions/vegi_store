import mongoose from "mongoose";
import { nanoid } from "nanoid";

// Base schema for fund transactions
export const FundTransactionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["receipt", "payment"], // ✅ fixed spelling
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["receipt", "payment"], // ✅ fixed spelling
      required: true,
    },
    transactionNumber: {
      type: String,

      required: true,
      default: function () {
        // 'this' will have __t field which is the discriminator value
        const prefix = this.__t?.toUpperCase().slice(0, 3) || "TXN";
        return `${prefix}-${nanoid(8)}`;
      },
    },

    transactionDate: { type: Date, required: true, default: Date.now },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      required: true,
    },
    accountName: { type: String, required: true, trim: true },
    previousBalanceAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    closingBalanceAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "cheque", "dd", "bankTransfer"],
      default: "cash",
    },
    chequeNumber: String,
    chequeDate: Date,
    bank: String,
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
    },
    narration: String,
    description: String,

    settlementDetails: [
      {
        outstandingTransaction: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Outstanding",
        },
        outstandingTransactionNumber: String,
        previousOutstanding: Number,
        settledAmount: Number,
        remainingOutstanding: Number,
        settlementDate: { type: Date, default: Date.now },
      },
    ],

    attachments: [
      {
        fileName: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
    },
    referenceModel: {
      type: String,
      enum: ["Sale", "Purchase"],
    },

    referenceType: {
      type: String,
      enum: ["sale", "purchase", "sales_return", "purchase_return"],
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Soft Delete Fields
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
      index: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

// Indexes
FundTransactionSchema.index({ company: 1, transactionNumber: 1 });
FundTransactionSchema.index({ company: 1 });
FundTransactionSchema.index({ branch: 1 });
FundTransactionSchema.index({ transactionDate: -1 }); // ✅ Fixed: was 'date'
FundTransactionSchema.index({ account: 1, transactionType: 1 });
FundTransactionSchema.index({ company: 1, branch: 1 });
FundTransactionSchema.index({ status: 1, isCancelled: 1 }); // ✅ NEW
FundTransactionSchema.index({ reference: 1, referenceModel: 1 }); // ✅ NEW


// ✅ UPDATE this static method to filter only active records by default
FundTransactionSchema.statics.getPaginatedTransactions = async function (
  filter = {},
  page = 1,
  limit = 50,
  sort = { transactionDate: -1, _id: -1 }, // ✅ Fixed: was 'date'
  includeStatus = ["active"] // ✅ NEW parameter
) {
  const skip = (page - 1) * limit;

  // ✅ Add status filter
  const queryFilter = {
    ...filter,
    ...(includeStatus && includeStatus.length > 0 ? { status: { $in: includeStatus } } : {})
  };

  const [total, transactions] = await Promise.all([
    this.countDocuments(queryFilter),
    this.find(queryFilter)
      .populate('account', 'accountName')
      .populate('cancelledBy', 'name email') // ✅ NEW
      .select('transactionNumber transactionDate amount previousBalanceAmount closingBalanceAmount settlementDetails status isCancelled cancelledAt') // ✅ Added status fields
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: transactions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasMore: skip + transactions.length < total,
      nextPage: skip + transactions.length < total ? page + 1 : null
    }
  };
};


// Instance method to settle an amount FIFO
FundTransactionSchema.methods.settleAmountFIFO = async function (settleAmount) {
  // Implementation of FIFO settlement logic
  // Update settlementDetails accordingly
};

// Model export
// module.exports = mongoose.model('Transaction', FundTransactionSchema);
