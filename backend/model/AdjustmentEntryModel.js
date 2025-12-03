import mongoose from "mongoose";
import {adjustmentEntrySchema} from "../schemas/adjustmentEntrySchema.js";

const AdjustmentEntryModel = mongoose.model("AdjustmentEntry", adjustmentEntrySchema);

export default AdjustmentEntryModel;
