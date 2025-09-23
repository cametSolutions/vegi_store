import mongoose from "mongoose";
const ItemMasterSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company id is required"]
        },
        branchIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch id is required"]
        }],
        itemName: { type: String, required: true },
        itemCode: { type: String, required: true },
        unit: { type: String },
        // dynamic price levels
        priceLevels: {
            type: Map,
            of: Number,
            default: {},
        },
    }, { timestamps: true }
)
export default ItemMasterSchema