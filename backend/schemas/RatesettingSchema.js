import mongoose from "mongoose";
const RatesettingSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Comapny is required"]
        },
        branchIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Branch",
                required: [true, "Branch id is required"]
            }],
        priceLevels: {
            type: Map,
            of: Number, // price values
            default: {},
        },

    },
    { timestamps: true }
)
export default RatesettingSchema;