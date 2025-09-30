import mongoose from "mongoose";
import TransactionSchema from "../../schemas/TransactionSchema.js";

const TransactionModel = mongoose.model("Transaction", TransactionSchema);

export default TransactionModel;
