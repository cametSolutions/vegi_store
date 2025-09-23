import mongoose from "mongoose";
import PricelevelSchema from "../../schemas/PricelevelSchema.js";
const PricelevelModel=mongoose.model("Pricelevel",PricelevelSchema)
export default PricelevelModel