import mongoose from "mongoose";

 export const cashBankLedgerSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true
    },

    // Reference to Fund Transaction (Receipt/Payment)
    Transaction: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "FundTransaction",
      index: true
    },
    TransactionModel: {
      type: String,
      required: true,
      enum:  ["Receipt", "Payment"] // ✅ lowercase only
    },
    TransactionNumber: {
      type: String,
      required: true,
      index: true
    },
    TransactionDate: {
      type: Date,
      required: true,
      index: true
    },
    TransactionType: {
      type: String,
      required: true,
      enum: ["receipt", "payment"] // ✅ lowercase only
    },

    Account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      required: true,
      index: true
    },
    AccountName: { type: String, required: true },

    cashAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      index: true
    },
    cashAccountName: { type: String },

    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      index: true
    },
    bankAccountName: { type: String },

    amount: { type: Number, required: true, min: 0 },
    entryType: {
      type: String,
      required: true,
      enum: ["debit", "credit"],
      index: true
    },

    paymentMode: {
      type: String,
      required: true,
      enum: ["cash", "bankTransfer", "cheque", "upi", "card", "online", "dd"],
      default: "cash",
      index: true
    },
    chequeNumber: String,
    chequeDate: Date,
    narration: String,

    entryStatus: {
      type: String,
      enum: ["active", "reversed"],
      default: "active",
      index: true
    },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reversedAt: Date,
    reversalReason: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// --- Validation Logic ---
cashBankLedgerSchema.pre("save", function (next) {
  if (this.isNew) {
    const expectedEntryType = this.TransactionType === "receipt" ? "debit" : "credit";

    if (this.entryType !== expectedEntryType) {
      return next(
        new Error(
          `Entry type mismatch: ${this.TransactionType} should be ${expectedEntryType}`
        )
      );
    }

    const hasCash = !!this.cashAccount;
    const hasBank = !!this.bankAccount;

    if (!hasCash && !hasBank) {
      return next(new Error("Either cashAccount or bankAccount must be specified"));
    }
    if (hasCash && hasBank) {
      return next(new Error("Cannot have both cashAccount and bankAccount set"));
    }
  }
  next();
});


