import express from "express"
import { createPricelevel } from "../../controller/master/pricelevelController.js"
import { getallPriceLevel } from "../../controller/pricelevelController/pricelevelController.js"
const router=express.Router()
router.post("/createpricelevel",createPricelevel)
router.get("/getallpricelevel",getallPriceLevel)
export default router