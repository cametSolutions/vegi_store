import mongoose from "mongoose";
import PricelevelSchema from "../../schemas/PricelevelSchema.js";

const PricelevelModel = mongoose.model("PriceLevel", PricelevelSchema);

export default PricelevelModel;