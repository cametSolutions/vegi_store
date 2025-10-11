import mongoose from "mongoose";
import { nanoid } from "nanoid";

const PriceLevelSchema = new mongoose.Schema(
  {
    priceLevel: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Pricelevel" },
      priceLevelName: { type: String },
    },
    rate: { type: Number, required: true, min: [0, "Rate cannot be negative"] },
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    _id: false,
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemMaster",
      required: [true, "Item is required"],
    },
    itemCode: {
      type: String,
      required: [true, "Item code is required"],
      trim: true,
      uppercase: true,
    },
    itemName: { type: String, required: [true, "Item name is required"] },
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
    baseAmount: {
      type: Number,
      required: [true, "Base amount is required"],
      min: [0, "Base amount cannot be negative"],
    },
    amountAfterTax: {
      type: Number,
      required: [true, "Amount after tax is required"],
      min: [0, "Amount after tax cannot be negative"],
    },
    taxable: { type: Boolean, default: true },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, "Tax rate cannot be negative"],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },
    priceLevels: [PriceLevelSchema],
  },
  { _id: false }
);

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
      enum: ["sale", "purchase", "credit_note", "debit_note"],
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
      required: [true, "Transaction number is required"],
      default: function () {
        const prefix = this.transactionType?.toUpperCase().slice(0, 3) || "TXN";
        return `${prefix}-${nanoid(4)}`;
      },
    },

    // ==================== PARTY INFORMATION ====================
    accountType: {
      type: String,
      enum: ["customer", "supplier", "others"],
      required: [true, "Account type is required"],
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
    },

    accountName: { type: String, required: [true, "Account name is required"] },
    email: { type: String, trim: true },
    phone: { type: Number },
    openingBalance: {
      type: Number,
      default: 0,
      min: [0, "Opening balance cannot be negative"],
    },
    priceLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pricelevel",
    },
    priceLevelName: { type: String },

    // ==================== ITEMS ====================
    items: [ItemSchema],

    // ==================== TOTALS ====================
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
      default: 0,
    },
    totalTaxAmount: {
      type: Number,
      required: [true, "Total tax amount is required"],
      min: [0, "Total tax amount cannot be negative"],
      default: 0,
    },
    totalAmountAfterTax: {
      type: Number,
      required: [true, "Total amount after tax is required"],
      min: [0, "Total amount after tax cannot be negative"],
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
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
      default: 0,
    },
    totalDue: {
      type: Number,
      default: 0,
      min: [0, "Total due cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: [0, "Balance amount cannot be negative"],
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
    reference: { type: String, trim: true },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ==================== AUDIT ====================
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
    sale: "Sales Invoice",
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

// ==================== INDEXES ====================
TransactionSchema.index({
  company: 1,
  branch: 1,
  transactionType: 1,
  transactionDate: -1,
});
TransactionSchema.index({ transactionNumber: 1 }, { unique: true });
TransactionSchema.index({ account: 1, transactionDate: -1 });
TransactionSchema.index({
  company: 1,
  branch: 1,
  transactionType: 1,
  status: 1,
});
TransactionSchema.index({ company: 1, paymentStatus: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ "items.item": 1 });
TransactionSchema.index({ "items.itemCode": 1 });

export default TransactionSchema;
