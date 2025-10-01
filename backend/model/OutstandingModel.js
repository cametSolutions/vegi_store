import mongoose from "mongoose";
import OutstandingSchema from "../schemas/OutstandingSchema.js";

const OutstandingModel = mongoose.model("Outstanding", OutstandingSchema);

export default OutstandingModel;
