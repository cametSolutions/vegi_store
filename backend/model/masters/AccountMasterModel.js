import mongoose from "mongoose";
import AccountMasterSchema from "../../schemas/accountMasterSchema.js";
const AccountMasterModel=mongoose.model("Accountmaster",AccountMasterSchema)
export default AccountMasterModel