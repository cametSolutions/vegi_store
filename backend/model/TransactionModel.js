import mongoose from "mongoose";
import TransactionSchema from "../schemas/TransactionSchema.js";

const SalesModel = mongoose.model("Sale", TransactionSchema);
const PurchaseModel = mongoose.model("Purchase", TransactionSchema);
const SalesReturnModel = mongoose.model("SalesReturn", TransactionSchema);
const PurchaseReturnModel = mongoose.model("PurchaseReturn", TransactionSchema);

export { SalesModel, PurchaseModel , SalesReturnModel, PurchaseReturnModel};
