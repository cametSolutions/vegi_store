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
      // enum: ["kg", "gm", "piece", "bundle", "dozen", "liter"],
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
      enum: ["sale", "purchase", "credit_note", "debit_note"],
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
    // Primary amount for item-level tracking
    baseAmount: { type: Number, required: true }, // Use this for reports

    // Reference amount for reconciliation
    amountAfterTax: { type: Number, required: true },

    // Tax details
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    runningStockBalance: {
      type: Number,
      required: [true, "Running stock balance is required"],
    },
    // account: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "AccountMaster",
    //   required: [true, "Account is required"],
    // },
    // accountName: {
    //   type: String,
    //   required: [true, "Account name is required"],
    // },
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
ItemLedgerSchema.index({ item: 1, branch: 1, transactionDate: 1 });
ItemLedgerSchema.index({ transactionId: 1 });
ItemLedgerSchema.index({ item: 1, branch: 1 });

// Static method to get last stock balance for an item
ItemLedgerSchema.statics.getLastStockBalance = async function (
  itemId,
  companyId,
  branchId,
  session
) {
  const lastEntry = await this.findOne({ item: itemId, branch: branchId })
    .sort({ transactionDate: -1, createdAt: -1 })
    .session(session);

  //// If ledger entry exists, return its running balance
  if (lastEntry) {
    return lastEntry.runningStockBalance || 0;
  }

  //// No ledger entries found - get opening balance from ItemMaster
  const ItemMaster = mongoose.model("ItemMaster");
  const itemMaster = await ItemMaster.findOne({
    _id: itemId,
    company: companyId,
    "stock.branch": branchId,
  });
  if (!itemMaster) {
    throw new Error("Item not found");
  }

  ////// If no stock entry found for this branch, return 0
  return (
    itemMaster.stock.find((s) => s.branch.toString() === branchId.toString())
      .openingStock || 0
  );
};
