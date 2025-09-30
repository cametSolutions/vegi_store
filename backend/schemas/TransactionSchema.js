import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    // ==================== HEADER INFORMATION ====================
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
    transactionType: {
      type: String,
      enum: ["sales", "purchase", "credit_note", "debit_note"],
      required: [true, "Transaction type is required"],
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },
    transactionNumber: {
      type: String,
      unique: true,
      required: [true, "Transaction  number is required"],
      trim: true,
      uppercase: true,
    },

    // ==================== PARTY INFORMATION ====================
    accountType: {
      type: String,
      enum: ["customer", "supplier", "others"],
      required: [true, "Party type is required"],
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
    openingBalance: {
      type: Number,
      default: 0,
    },
    priceLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pricelevel",
    },

    // ==================== ITEMS ARRAY ====================
    items: [
      {
        _id: false,
        itemCode: {
          type: String,
          required: [true, "Item code is required"],
          trim: true,
          uppercase: true,
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
        unit: {
          type: String,
          required: [true, "Unit is required"],
          enum: ["kg", "gm", "piece", "bundle", "dozen", "liter"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [0.001, "Quantity must be greater than 0"],
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
      },
    ],

    // ==================== TOTALS SECTION ====================
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    netAmount: {
      type: Number,
      required: [true, "Net amount is required"],
      min: [0, "Net amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },

    // ==================== PAYMENT & STATUS ====================
    paymentMethod: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending", "overdue"],
      default: "pending",
    },
    status: {
        type: String,
        enum: ["draft", "confirmed", "delivered", "cancelled"],
        default: "confirmed",
      },

    // ==================== REFERENCE & NOTES ====================

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ==================== AUDIT FIELDS ====================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    modifiedBy: {
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
TransactionSchema.index({
  company: 1,
  branch: 1,
  transactionType: 1,
  transactionDate: -1,
});
TransactionSchema.index({ transactionNumber: 1 }, { unique: true });
TransactionSchema.index({ account: 1, transactionDate: -1 });
TransactionSchema.index({ company: 1, branch: 1, transactionType: 1, status: 1 });
TransactionSchema.index({ company: 1, paymentStatus: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ "items.item": 1 });
TransactionSchema.index({ "items.itemCode": 1 });

// ==================== VIRTUALS ====================
TransactionSchema.virtual("totalItems").get(function () {
  return this.items.length;
});

TransactionSchema.virtual("totalQuantity").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

TransactionSchema.virtual("isFullyPaid").get(function () {
  return this.paidAmount >= this.netAmount;
});

TransactionSchema.virtual("displayType").get(function () {
  const types = {
    sales: "Sales Invoice",
    purchase: "Purchase Invoice",
    credit_note: "Credit Note",
    debit_note: "Debit Note",
  };
  return types[this.transactionType];
});

TransactionSchema.virtual("accountDisplayName").get(function () {
    return this.accountType === "customer"
    ? "Customer"
    : this.accountType === "supplier"
    ? "Supplier"
    : "Others";
});

export default TransactionSchema;
