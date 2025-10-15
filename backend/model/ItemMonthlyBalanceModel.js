import mongoose from "mongoose";
import {ItemMonthlyBalanceSchema} from "../schemas/ItemMonthlyBalanceSchema.js";

const ItemMonthlyBalance = mongoose.model("ItemMonthlyBalance", ItemMonthlyBalanceSchema);

export default ItemMonthlyBalance;