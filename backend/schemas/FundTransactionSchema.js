// const mongoose = require('mongoose');

const FundTransactionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    transactionType: { type: String, enum: ["receipt", "payment"], required: true },
    transactionNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true, default: Date.now },

    account: { type: mongoose.Schema.Types.ObjectId, ref: "AccountMaster", required: true },
    accountName: { type: String, required: true, trim: true },

    previousBalanceAmount: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    closingBalanceAmount: { type: Number, required: true, min: 0 },

    paymentMode: { type: String, enum: ["cash", "cheque", "dd", "bank_transfer"], required: true },
    chequeNumber: { type: String, trim: true },
    bank: { type: String, trim: true },

    settlementDetails: [
      {
        outstandingTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Outstanding", required: true },
        previousOutstanding: { type: Number, required: true, min: 0 },
        settledAmount: { type: Number, required: true, min: 0 },
        remainingOutstanding: { type: Number, required: true, min: 0 },
        settlementDate: { type: Date, default: Date.now },
      }
    ],

    narration: { type: String, trim: true },
    description: { type: String, trim: true },
    attachments: [
      {
        fileName: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized queries
FundTransactionSchema.index({ transactionNumber: 1 });
FundTransactionSchema.index({ date: -1 });
FundTransactionSchema.index({ account: 1, transactionType: 1 });

// Static methods: example for fetching outstanding transactions
FundTransactionSchema.statics.getOutstandingTransactions = async function(accountId) {
  return this.find({ account: accountId, closingBalanceAmount: { $gt: 0 } });
};

// Instance method to settle an amount FIFO
FundTransactionSchema.methods.settleAmountFIFO = async function(settleAmount) {
  // Implementation of FIFO settlement logic
  // Update settlementDetails accordingly
};

// Model export
// module.exports = mongoose.model('Transaction', FundTransactionSchema);
