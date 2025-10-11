import mongoose from "mongoose";
import TransactionSchema from "../schemas/TransactionSchema.js";

const SalesModel = mongoose.model("Sale", TransactionSchema);
const PurchaseModel = mongoose.model("Purchase", TransactionSchema);

export { SalesModel, PurchaseModel };
