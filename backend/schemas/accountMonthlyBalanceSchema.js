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
AccountMonthlyBalanceSchema.index(
  { account: 1, periodKey: 1 },
  { unique: true }
);
AccountMonthlyBalanceSchema.index({ company: 1, branch: 1, periodKey: 1 });

// Static method to get opening balance for a specific month
AccountMonthlyBalanceSchema.statics.getOpeningBalance = async function (
  accountId,
  branchId,
  companyId,
  year,
  month,
  session
) {
  // Check if previous month exists
  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  // Try to get previous month's closing balance
  const previousMonth = await this.findOne({
    company: companyId,
    branch: branchId,
    account: accountId,
    year: prevYear,
    month: prevMonth,
  })
    .select("closingBalance")
    .session(session);

  if (previousMonth) {
    // Previous month exists - use its closing balance
    return previousMonth.closingBalance;
  }

  // No previous month - this is the first month
  // Get opening balance from AccountMaster
  const accountMaster = await mongoose
    .model("AccountMaster")
    .findOne({
      _id: accountId,
      branch: branchId,
      company: companyId,
    })
    .select("openingBalance openingBalanceType")
    .session(session);

  if (!accountMaster) {
    return 0;
  }

  // Return signed opening balance
  return accountMaster.openingBalanceType === "dr"
    ? accountMaster.openingBalance
    : -accountMaster.openingBalance;
};

// Method to calculate and update closing balance
AccountMonthlyBalanceSchema.methods.calculateClosingBalance = function () {
  this.closingBalance =
    this.openingBalance + this.totalDebit - this.totalCredit;
  return this.closingBalance;
};
