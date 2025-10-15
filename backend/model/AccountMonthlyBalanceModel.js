import mongoose from "mongoose";
import {AccountMonthlyBalanceSchema} from "../schemas/accountMonthlyBalanceSchema.js";

const AccountMonthlyBalance = mongoose.model(
  "AccountMonthlyBalance",
  AccountMonthlyBalanceSchema
);

export default AccountMonthlyBalance;
