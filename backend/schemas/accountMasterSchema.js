import mongoose from "mongoose";

const AccountMasterSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company id is required"]
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch id is required"]
        },
        accountName: {
            type: String,
            required: [true, "Account name is required"]
        },
        accountType: {
            type: String,
            required: [true, "AccountType is required"]
        },
        address: {
            type: String,
            required: [true, "Address is required"]
        },
        openingBalance: {
            type: Number,
        },
        openingBalanceType: {
            type: String,
        },
        phoneNo: {
            type: String,
        },
        pricelevel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pricelevel", // should match your Pricelevel model name
            required: [true, "Price level is required"],
        }

    }, { timestamps: true })
export default AccountMasterSchema