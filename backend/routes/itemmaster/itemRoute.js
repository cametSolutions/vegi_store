import express from "express";
import { createItem,getallItems } from "../../controller/master/itemMaster.js";
const router = express.Router()
router.post("/createitem", createItem)
router.get("/getallitems",getallItems)
export default router