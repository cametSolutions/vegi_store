import mongoose from "mongoose";

export const AccountMonthlyBalanceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      required: [true, "Account is required"],
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
    },
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    periodKey: {
      type: String,
      required: [true, "Period key is required"],
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    totalDebit: {
      type: Number,
      default: 0,
      min: [0, "Total debit cannot be negative"],
    },
    totalCredit: {
      type: Number,
      default: 0,
      min: [0, "Total credit cannot be negative"],
    },
    closingBalance: {
      type: Number,
      default: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique constraint and faster queries
AccountMonthlyBalanceSchema.index({ account: 1, periodKey: 1 }, { unique: true });
AccountMonthlyBalanceSchema.index({ company: 1, branch: 1, periodKey: 1 });

// Method to calculate closing balance
AccountMonthlyBalanceSchema.methods.calculateClosingBalance = function () {
  this.closingBalance = this.openingBalance + this.totalDebit - this.totalCredit;
  return this.closingBalance;
};

