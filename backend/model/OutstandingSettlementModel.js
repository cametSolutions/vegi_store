

import mongoose from "mongoose";
import {OutstandingSettlementSchema} from "../schemas/OutstandingSettlementSchema.js";

 export const OutstandingSettlementModel = mongoose.model(
  "OutstandingSettlement",
  OutstandingSettlementSchema
);

export default OutstandingSettlementModel;