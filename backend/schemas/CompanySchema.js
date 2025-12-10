import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      minlength: [2, "Minimum 2 characters required"],
      trim: true
    },
    companyType: {
      type: String,
      enum: ["Private Limited", "Public Limited", "LLP", "Partnership", "Proprietorship"],
      default: "Private Limited"
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true // allows optional but unique if present
    },
    incorporationDate: {
      type: Date
    },
    permanentAddress: {
      type: String,
      required: true,
      trim: true
    },
    residentialAddress: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"]
    },
    notificationEmail: {
      type: String,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"]
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"]
    },
    landline: {
      type: String
    },
    gstNumber: {
      type: String,
      // match: [/^\d{15}$/, "GST Number must be 15 characters"]
    },
    panNumber: {
      type: String,
      // match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"]
    },
    website: {
      type: String
    },
    industry: {
      type: String
    },
    authorizedSignatory: {
      type: String
    },
    numEmployees: {
      type: Number,
      min: [1, "There must be at least 1 employee"]
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default CompanySchema;
