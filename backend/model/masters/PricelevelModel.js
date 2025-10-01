import mongoose from "mongoose";
import PricelevelSchema from "../../schemas/PricelevelSchema.js";

const PriceLevelModel = mongoose.model("PriceLevel", PricelevelSchema);

export default PriceLevelModel;