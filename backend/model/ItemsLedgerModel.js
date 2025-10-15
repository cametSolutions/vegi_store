import mongoose from "mongoose";
import {ItemLedgerSchema} from "../schemas/itemLedgerSchema.js";

const ItemLedger = mongoose.model("ItemLedger", ItemLedgerSchema);

export default ItemLedger;
