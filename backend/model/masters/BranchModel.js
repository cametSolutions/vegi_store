import mongoose from "mongoose";
import BranchSchema from "../../schemas/BranchSchema.js";
const BranchModel=mongoose.model("Branch",BranchSchema)
export default BranchModel