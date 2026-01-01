// models/StockAdjustmentModel.js
import mongoose from "mongoose";
import stockAdjustmentSchema from "../schemas/stockAdjustmentSchema.js";

const StockAdjustment = mongoose.model("StockAdjustment", stockAdjustmentSchema);

export default StockAdjustment;
