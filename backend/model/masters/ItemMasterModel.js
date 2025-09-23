import mongoose from "mongoose";
import ItemMasterSchema from "../../schemas/ItemMasterSchema.js";
const ItemMasterModel=mongoose.model("Itemmaster",ItemMasterSchema)
export default ItemMasterModel