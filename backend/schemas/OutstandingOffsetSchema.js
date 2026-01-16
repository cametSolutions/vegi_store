import mongoose from "mongoose";
import { nanoid } from "nanoid";

const OutstandingOffsetSchema = new mongoose.Schema(
  {
    // ==================== COMPANY & BRANCH ====================
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    // ==================== PARTY ====================
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
      required: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    // ==================== OFFSET INFO ====================
    offsetNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `OFF-${nanoid(8)}`,   // eg: OFF-a9K3Lm2Q
      index: true,
    },

    offsetDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    offsetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: ["active", "reversed"],
      default: "active",
    },

    // ==================== REVERSAL ====================
    reversedAt: Date,
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reversalReason: String,

    // ==================== NOTES ====================
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ==================== AUDIT ====================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for party offset history
OutstandingOffsetSchema.index({ company: 1, account: 1, offsetDate: -1 });

export default OutstandingOffsetSchema;
