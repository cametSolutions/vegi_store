
import mongoose from "mongoose";

const AccountMasterSchema = new mongoose.Schema(
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

    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      maxlength: [100, "Account name cannot exceed 100 characters"],
    },
    accountType: {
      type: String,
      required: [true, "Account type is required"],
      enum: {
        values: ["customer","cash", "bank", "other"],
        message: "Account type must be either customer or other",
      },
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
      min: [0, "Opening balance cannot be negative"],
    },
    openingBalanceType: {
      type: String,
      enum: {
        values: ["dr", "cr"],
        message: "Opening balance type must be either dr or cr",
      },
      required: function () {
        return this.openingBalance && this.openingBalance > 0;
      },
    },
    phoneNo: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^[6-9]\d{9}$/.test(v);
        },
        message: "Phone number must be a valid 10-digit Indian mobile number",
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },

    priceLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceLevel",
      required: [true, "Price level is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "blocked"],
        message: "Status must be either active, inactive, or blocked",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
AccountMasterSchema.index({ company: 1, branch: 1 });
AccountMasterSchema.index({ company: 1, accountType: 1, status: 1 });
AccountMasterSchema.index({ phoneNo: 1 });
AccountMasterSchema.index({ email: 1 });
AccountMasterSchema.index({ accountName: "text" });

// ==================== INSTANCE METHODS ====================

// Block/Unblock account
AccountMasterSchema.methods.updateStatus = function (newStatus) {
  if (!["active", "inactive", "blocked"].includes(newStatus)) {
    throw new Error("Invalid status. Must be active, inactive, or blocked");
  }

  this.status = newStatus;
  return this.save();
};

// Update contact information
AccountMasterSchema.methods.updateContact = function (contactInfo) {
  if (contactInfo.phoneNo !== undefined) {
    this.phoneNo = contactInfo.phoneNo;
  }
  if (contactInfo.email !== undefined) {
    this.email = contactInfo.email;
  }
  if (contactInfo.address !== undefined) {
    this.address = contactInfo.address;
  }

  return this.save();
};

// Check if account can make purchase (not blocked, within credit limit)
AccountMasterSchema.methods.canMakePurchase = function (amount = 0) {
  if (this.status === "blocked" || this.status === "inactive") {
    return { allowed: false, reason: `Account is ${this.status}` };
  }
  return { allowed: true };
};

// ==================== STATIC METHODS ====================
// Get accounts by type with pagination
AccountMasterSchema.statics.getAccountsByType = function (
  companyId,
  accountType,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;

  return this.find({
    company: companyId,
    accountType: accountType,
    status: { $ne: "inactive" },
  })
    .populate("branch", "branchName address")
    .populate("priceLevel", "priceLevelName description")
    .sort({ accountName: 1 })
    .skip(skip)
    .limit(limit);
};

// Search accounts by name or code
AccountMasterSchema.statics.searchAccounts = async function (
  companyId,
  searchTerm,
  branchId,
  accountType,
  filters = {},
  limit = 25,
  offset = 0
) {
  const withOutstanding = filters.withOutstanding; // true, false, or undefined

  const searchRegex = new RegExp(searchTerm, "i");

  const companyObjId =
    typeof companyId === "string"
      ? new mongoose.Types.ObjectId(companyId)
      : companyId;
  const branchObjId =
    typeof branchId === "string"
      ? new mongoose.Types.ObjectId(branchId)
      : branchId;

  const matchConditions = {
    company: companyObjId,
    accountType,
    branch: branchObjId,
    $or: [{ accountName: searchRegex }, { accountCode: searchRegex }],
  };

  //// here we are going to find the outstanding details of party also
  const pipeline = [{ $match: matchConditions }];

  // Only add outstanding lookup if withOutstanding is true
  if (withOutstanding === true) {
    pipeline.push(
      {
        $lookup: {
          from: "outstandings",
          let: { accountId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$account", "$$accountId"] },
                    { $eq: ["$company", companyObjId] },
                    { $eq: ["$branch", branchObjId] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$outstandingType",
                total: { $sum: "$closingBalanceAmount" },
              },
            },
          ],
          as: "outstandingDetails",
        },
      },
      {
        $addFields: {
          // Extract DR total
          outstandingDr: {
            $let: {
              vars: {
                drDoc: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$outstandingDetails",
                        as: "item",
                        cond: { $eq: ["$$item._id", "dr"] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: { $ifNull: ["$$drDoc.total", 0] },
            },
          },
          // Extract CR total
          outstandingCr: {
            $let: {
              vars: {
                crDoc: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$outstandingDetails",
                        as: "item",
                        cond: { $eq: ["$$item._id", "cr"] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: { $ifNull: ["$$crDoc.total", 0] },
            },
          },
        },
      },
      {
        $addFields: {
          // Calculate net outstanding (DR - CR)
          outstandingNet: {
            $add: ["$outstandingDr", "$outstandingCr"],
          },
          // // Calculate absolute total (|DR| + |CR|)
          // outstandingTotal: {
          //   $add: ["$outstandingDr", "$outstandingCr"],
          // },
        },
      },
      // Remove the temporary outstandingDetails array
      {
        $project: {
          outstandingDetails: 0,
        },
      }
    );
  }

  // Sort and paginate
  pipeline.push({ $sort: { accountName: 1 } });
  pipeline.push({ $skip: offset });
  pipeline.push({ $limit: limit });

  // Create count pipeline (exclude skip/limit)
  const countPipeline = pipeline.filter(
    (stage) => !("$skip" in stage || "$limit" in stage)
  );
  countPipeline.push({ $count: "totalCount" });

  // Execute both pipelines
  const [accounts, countResult] = await Promise.all([
    this.aggregate(pipeline).exec(),
    this.aggregate(countPipeline).exec(),
  ]);

  const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

  return {
    accounts,
    totalCount,
  };
};

// Get customer summary for reports
AccountMasterSchema.statics.getCustomerSummary = function (companyId) {
  return this.aggregate([
    { $match: { company: companyId, accountType: "customer" } },
    {
      $group: {
        _id: "$category",
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Validation to ensure opening balance type is set when balance exists
AccountMasterSchema.pre("save", function (next) {
  if (this.openingBalance > 0 && !this.openingBalanceType) {
    return next(
      new Error(
        "Opening balance type is required when opening balance is greater than 0"
      )
    );
  }
  next();
});

export default AccountMasterSchema;
