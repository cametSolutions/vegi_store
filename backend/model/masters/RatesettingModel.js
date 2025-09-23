import mongoose from "mongoose";
import RatesettingSchema from "../../schemas/RatesettingSchema";
const RatesettingModel=mongoose.model("Ratesetting",RatesettingSchema)
export default RatesettingModel