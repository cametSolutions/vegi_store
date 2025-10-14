import mongoose from "mongoose";
import { FundTransactionSchema } from "../schemas/FundTransactionSchema.js";

// Create base model
const FundTransaction = mongoose.model("FundTransaction", FundTransactionSchema);

// Create discriminators
const ReceiptModel = FundTransaction.discriminator("Receipt", new mongoose.Schema({}));
const PaymentModel = FundTransaction.discriminator("Payment", new mongoose.Schema({}));

export { ReceiptModel, PaymentModel, FundTransaction };
