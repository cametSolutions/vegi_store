import mongoose from "mongoose";
import FundTransactionSchema from "../schemas/FundTransactionSchema.js";

const ReceiptModel = mongoose.model("Receipt", FundTransactionSchema);
const PayMentModel = mongoose.model("Payment", FundTransactionSchema);

export { ReceiptModel, PayMentModel };
