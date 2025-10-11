import mongoose from "mongoose";

const OutstandingSchema = new mongoose.Schema(
  {
    // ... (your existing schema fields - keep them as is)
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
      trim: true,
    },
    accountType: {
      type: String,
      enum: {
        values: ["customer", "supplier"],
        message: "Account type must be either customer or supplier",
      },
      required: [true, "Account type is required"],
    },

    transactionModel: {
      type: String,
      required: [true, "Transaction model is required"],
      enum: ["Sale", "Purchase", "CreditNote", "DebitNote"],
    },
    sourceTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "transactionModel",
      required: [true, "Source transaction is required"],
    },
    transactionType: {
      type: String,
      enum: {
        values: ["sale", "purchase", "credit_note", "debit_note"],
        message: "Invalid transaction type",
      },
      required: [true, "Transaction type is required"],
    },
    transactionNumber: {
      type: String,
      required: [true, "Transaction number is required"],
      trim: true,
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
    },
    outstandingType: {
      type: String,
      enum: {
        values: ["dr", "cr"],
        message: "Outstanding type must be either dr (debit) or cr (credit)",
      },
      required: [true, "Outstanding type is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    closingBalanceAmount: {
      type: Number,
      required: [true, "Balance amount is required"],
      min: [0, "Balance amount cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "partial",
          "paid",
          "overdue",
          "disputed",
          "written_off",
        ],
        message: "Invalid status",
      },
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    lastModifiedBy: {
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

// Indexes
OutstandingSchema.index({ account: 1, status: 1 });
OutstandingSchema.index({ dueDate: 1, status: 1 });
OutstandingSchema.index({ sourceTransaction: 1 });
OutstandingSchema.index({ transactionNumber: 1 });


// Instance method to update payment
OutstandingSchema.methods.updatePayment = function (
  additionalPaidAmount,
  userId
) {
  this.paidAmount += additionalPaidAmount;
  this.closingBalanceAmount = this.totalAmount - this.paidAmount;

  // Update status based on balance
  if (this.closingBalanceAmount <= 0) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partial";
  }

  // Check if overdue
  if (this.closingBalanceAmount > 0 && new Date() > this.dueDate) {
    this.status = "overdue";
  }

  this.lastModifiedBy = userId;
  return this;
};

// Instance method to check if overdue
OutstandingSchema.methods.checkOverdue = function () {
  const isOverdue = new Date() > this.dueDate && this.closingBalanceAmount > 0;
  if (isOverdue && this.status !== "overdue") {
    this.status = "overdue";
  }
  return isOverdue;
};

// Instance method to mark as paid
OutstandingSchema.methods.markPaid = function (userId) {
  this.status = "paid";
  this.closingBalanceAmount = 0;
  this.paidAmount = this.totalAmount;
  this.lastModifiedBy = userId;
  return this;
};

// Instance method to calculate aging days
OutstandingSchema.methods.calculateAgingDays = function () {
  const today = new Date();
  const diffTime = today - this.dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Static method to find pending outstanding by account
OutstandingSchema.statics.findPendingByAccount = async function (accountId) {
  return await this.find({
    account: accountId,
    status: { $in: ["pending", "partial", "overdue"] },
  }).sort({ dueDate: 1 });
};

// Static method to get aging report
OutstandingSchema.statics.getAgingReport = async function (
  accountId,
  asOfDate = new Date()
) {
  const outstandingRecords = await this.find({
    account: accountId,
    status: { $in: ["pending", "partial", "overdue"] },
  });

  const aging = {
    current: 0, // 0-30 days
    days31_60: 0, // 31-60 days
    days61_90: 0, // 61-90 days
    over90: 0, // 90+ days
    total: 0,
  };

  outstandingRecords.forEach((record) => {
    const agingDays = Math.ceil(
      (asOfDate - record.dueDate) / (1000 * 60 * 60 * 24)
    );
    const amount = record.closingBalanceAmount;

    if (agingDays <= 30) {
      aging.current += amount;
    } else if (agingDays <= 60) {
      aging.days31_60 += amount;
    } else if (agingDays <= 90) {
      aging.days61_90 += amount;
    } else {
      aging.over90 += amount;
    }

    aging.total += amount;
  });

  return aging;
};

// Static method to get total outstanding
OutstandingSchema.statics.getTotalOutstanding = async function (
  accountId,
  outstandingType
) {
  const result = await this.aggregate([
    {
      $match: {
        account: mongoose.Types.ObjectId(accountId),
        outstandingType: outstandingType,
        status: { $in: ["pending", "partial", "overdue"] },
      },
    },
    {
      $group: {
        _id: null,
        totalOutstanding: { $sum: "$closingBalanceAmount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalOutstanding : 0;
};

export default OutstandingSchema;
