// import mongoose from "mongoose";

// const AccountMasterSchema = new mongoose.Schema(
//     {
//         companyId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Company",
//             required: [true, "Company id is required"]
//         },
//         branchId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Branch",
//             required: [true, "Branch id is required"]
//         },
//         accountName: {
//             type: String,
//             required: [true, "Account name is required"]
//         },
//         accountType: {
//             type: String,
//             required: [true, "AccountType is required"]
//         },

//         address: {
//             type: String,
//             required: [true, "Address is required"]
//         },
//         openingBalance: {
//             type: Number,
//         },
//         openingBalanceType: {
//             type: String,
//         },
//         phoneNo: {
//             type: String,
//         },
//         pricelevel: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Pricelevel", // should match your Pricelevel model name
//             required: [true, "Price level is required"],
//         }

//     }, { timestamps: true })
// export default AccountMasterSchema

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
        values: ["customer", "supplier", "employee", "other"],
        message:
          "Account type must be either customer, supplier, employee, or other",
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
      ref: "Pricelevel",
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

// Get formatted address for printing
AccountMasterSchema.methods.getFormattedAddress = function () {
  let formatted = this.accountName + "\n";
  if (this.contactPerson) {
    formatted += `Contact: ${this.contactPerson}\n`;
  }
  formatted += this.address + "\n";
  if (this.phoneNo) {
    formatted += `Phone: ${this.phoneNo}\n`;
  }
  if (this.email) {
    formatted += `Email: ${this.email}\n`;
  }
  if (this.gstNumber) {
    formatted += `GST: ${this.gstNumber}`;
  }

  return formatted;
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
AccountMasterSchema.statics.searchAccounts = function (
  companyId,
  searchTerm,
  filters = {}
) {
  const searchRegex = new RegExp(searchTerm, "i");
  const matchConditions = {
    company: companyId,
    $or: [{ accountName: searchRegex }, { accountCode: searchRegex }],
    ...filters,
  };

  return this.find(matchConditions)
    .populate("branch", "branchName")
    .populate("priceLevel", "priceLevelName")
    .sort({ accountName: 1 })
    .limit(20);
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
