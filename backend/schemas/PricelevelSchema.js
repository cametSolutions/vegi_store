import mongoose from "mongoose";
const PricelevelSchema = new mongoose.Schema(
    {
        priceLevelName: { type: String, required: [true, "pricelevel name is required"] },
        selected: [],
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company"
        }

    }, {
    timestamps: true
})
export default PricelevelSchema
