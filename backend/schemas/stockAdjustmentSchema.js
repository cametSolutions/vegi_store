// schemas/stockAdjustmentSchema.js
import mongoose from "mongoose";

const stockAdjustmentItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  itemCode: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
  remarks: String,
});

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    adjustmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    adjustmentType: {
      type: String,
      enum: ["add", "remove"],
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    items: [stockAdjustmentItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "completed", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
stockAdjustmentSchema.index({ company: 1, branch: 1, adjustmentDate: -1 });
stockAdjustmentSchema.index({ company: 1, branch: 1, adjustmentType: 1 });
stockAdjustmentSchema.index({ adjustmentNumber: 1 });

// Static method for pagination
stockAdjustmentSchema.statics.getPaginatedAdjustments = async function (
  filter,
  page = 1,
  limit = 25,
  sort = { adjustmentDate: -1 }
) {
  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean(),
    this.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
    nextPage: hasNextPage ? page + 1 : null,
  };
};

// Pre-save hook
stockAdjustmentSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + (item.amount || item.quantity * item.rate || 0);
    }, 0);
  }
  next();
});

// ✅ Export the schema (not the model)
export default stockAdjustmentSchema;
