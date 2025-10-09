import mongoose from "mongoose";
import {AccountLedgerSchema} from "../schemas/accountLedgerSchema.js";

const AccountLedger = mongoose.model("AccountLedger", AccountLedgerSchema);

export default AccountLedger;
