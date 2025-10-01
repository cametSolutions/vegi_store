import mongoose from "mongoose";
import TransactionSchema from "../schemas/TransactionSchema.js";

const SalesModel = mongoose.model("Transaction", TransactionSchema);
const PurchaseModel = mongoose.model("Transaction", TransactionSchema);

export { SalesModel, PurchaseModel };
