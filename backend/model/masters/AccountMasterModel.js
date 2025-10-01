import mongoose from "mongoose";
import AccountMasterSchema from "../../schemas/accountMasterSchema.js";
const AccountMasterModel=mongoose.model("AccountMaster",AccountMasterSchema)
export default AccountMasterModel