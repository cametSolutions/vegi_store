import mongoose from "mongoose";
import  OutstandingOffsetSchema  from "../schemas/OutstandingOffsetSchema.js";

const OutstandingOffset = mongoose.model("OutstandingOffset", OutstandingOffsetSchema);

export default OutstandingOffset;