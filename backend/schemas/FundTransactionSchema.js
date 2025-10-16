import mongoose from "mongoose";
import { nanoid } from "nanoid";

// Base schema for fund transactions
export const FundTransactionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },

    transactionType: { 
      type: String, 
      enum: ["receipt", "payment"], // ✅ fixed spelling
      required: true 
    },

    transactionType: {
      type: String,
      enum: ["receipt", "payment"], // ✅ fixed spelling
      required: true,
    },
    transactionNumber: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        // 'this' will have __t field which is the discriminator value
        const prefix = this.__t?.toUpperCase().slice(0, 3) || "TXN";
        return `${prefix}-${nanoid(8)}`;
      },
    },

    transactionDate: { type: Date, required: true, default: Date.now },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "AccountMaster", required: true },
    accountName: { type: String, required: true, trim: true },
    previousBalanceAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    closingBalanceAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "cheque", "dd", "bank_transfer"],
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

    referenceType:{
      type: String,
      enum: ["sale", "purchase", "credit_note", "debit_note"],
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
   
  }
);

// Indexes
FundTransactionSchema.index({ transactionNumber: 1 });
FundTransactionSchema.index({ date: -1 });
FundTransactionSchema.index({ account: 1, transactionType: 1 });
FundTransactionSchema.index({ company: 1, branch: 1 });

// Instance method to settle an amount FIFO
FundTransactionSchema.methods.settleAmountFIFO = async function (settleAmount) {
  // Implementation of FIFO settlement logic
  // Update settlementDetails accordingly
};

// Model export
// module.exports = mongoose.model('Transaction', FundTransactionSchema);
