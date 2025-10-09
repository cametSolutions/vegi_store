import mongoose from "mongoose";

export const ItemLedgerSchema = new mongoose.Schema(
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
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemMaster",
      required: [true, "Item is required"],
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
    },
    itemCode: {
      type: String,
      required: [true, "Item code is required"],
      uppercase: true,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["kg", "gm", "piece", "bundle", "dozen", "liter"],
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction is required"],
    },
    transactionNumber: {
      type: String,
      required: [true, "Transaction number is required"],
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
    },
    transactionType: {
      type: String,
      enum: ["sales", "purchase", "credit_note", "debit_note"],
      required: [true, "Transaction type is required"],
    },
    movementType: {
      type: String,
      enum: ["in", "out"],
      required: [true, "Movement type is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    runningStockBalance: {
      type: Number,
      required: [true, "Running stock balance is required"],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ItemLedgerSchema.index({ item: 1, transactionDate: 1 });
ItemLedgerSchema.index({ company: 1, branch: 1 });
ItemLedgerSchema.index({ transactionId: 1 });
ItemLedgerSchema.index({ account: 1 });

// Static method to get last stock balance for an item
ItemLedgerSchema.statics.getLastStockBalance = async function (
  itemId,
  branchId,
  session
) {
  const lastEntry = await this.findOne({ item: itemId, branch: branchId })
    .sort({ transactionDate: -1, createdAt: -1 })
    .session(session);

  return lastEntry ? lastEntry.runningStockBalance : 0;
};
