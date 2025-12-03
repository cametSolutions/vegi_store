import mongoose from "mongoose";

export const ItemMonthlyBalanceSchema = new mongoose.Schema(
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
    openingStock: {
      type: Number,
      default: 0,
      min: [0, "Opening stock cannot be negative"],
    },
    totalStockIn: {
      type: Number,
      default: 0,
      min: [0, "Total stock in cannot be negative"],
    },
    totalStockOut: {
      type: Number,
      default: 0,
      min: [0, "Total stock out cannot be negative"],
    },
    closingStock: {
      type: Number,
      default: 0,
      // min: [0, "Closing stock cannot be negative"],
    },
    // averageRate: {
    //   type: Number,
    //   default: 0,
    //   // min: [0, "Average rate cannot be negative"],
    // },
    // totalValue: {
    //   type: Number,
    //   default: 0,
    //   // min: [0, "Total value cannot be negative"],
    // },
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
    needsRecalculation:{
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for unique constraint and faster queries
ItemMonthlyBalanceSchema.index({ item: 1, branch: 1, periodKey: 1 }, { unique: true });
ItemMonthlyBalanceSchema.index({ company: 1, branch: 1, periodKey: 1 });
ItemMonthlyBalanceSchema.index({ needsRecalculation: 1 });
ItemMonthlyBalanceSchema.index({ item: 1, branch: 1, year: 1, month: 1 });
ItemMonthlyBalanceSchema.index({ item: 1, branch: 1 });

// Method to calculate closing stock
ItemMonthlyBalanceSchema.methods.calculateClosingStock = function () {
  this.closingStock = this.openingStock + this.totalStockIn - this.totalStockOut;
  return this.closingStock;
};

// Method to calculate total value
// ItemMonthlyBalanceSchema.methods.calculateTotalValue = function () {
//   this.totalValue = this.closingStock * this.averageRate;
//   return this.totalValue;
// };

// Static method to get opening stock for a specific month
ItemMonthlyBalanceSchema.statics.getOpeningStock = async function (
  itemId,
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

  // Try to get previous month's closing stock
  const previousMonth = await this.findOne({
    company: companyId,
    branch: branchId,
    item: itemId,
    year: prevYear,
    month: prevMonth,
  })
    .select("closingStock")
    .session(session);

  if (previousMonth) {
    // Previous month exists - use its closing stock as opening stock
    return previousMonth.closingStock;
  }

  // No previous month - this is the first month
  // Get opening stock from ItemMaster
  const itemMaster = await mongoose
    .model("ItemMaster")
    .findById(itemId)
    .select("stock")
    .session(session);

  if (!itemMaster) {
    return 0;
  }

  // Find the branch stock entry
  const branchStock = itemMaster.stock.find(
    (s) => s.branch.toString() === branchId.toString()
  );

  // Return opening stock from ItemMaster, or 0 if not found
  return branchStock?.openingStock || 0;
};