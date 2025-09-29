import mongoose from "mongoose";
import ItemMasterSchema from "../../schemas/ItemMasterSchema.js";
const ItemMasterModel=mongoose.model("ItemMaster",ItemMasterSchema)
export default ItemMasterModel