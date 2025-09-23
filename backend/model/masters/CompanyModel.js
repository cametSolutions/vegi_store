import mongoose from "mongoose";
import CompanySchema from "../../schemas/CompanySchema.js";
const CompanyModel=mongoose.model("Company",CompanySchema)
export default CompanyModel