import mongoose from "mongoose";
import {cashBankLedgerSchema} from "../schemas/CashBankLedgerSchema.js";

const CashBankLedgerModel = mongoose.model("CashBankLedger", cashBankLedgerSchema);

export default CashBankLedgerModel;
