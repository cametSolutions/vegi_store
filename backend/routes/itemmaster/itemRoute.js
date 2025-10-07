import express from "express";
import { createItem,getallItems, searchItems } from "../../controller/itemController/itemController.js";
const router = express.Router()
router.post("/createitem", createItem)
router.get("/getallitems",getallItems)
router.get("/searchItem",searchItems)
export default router