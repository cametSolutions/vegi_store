import express from "express"
import { createPricelevel } from "../../controller/master/pricelevelController.js"
import { getallpricelevel } from "../../controller/pricelevelController/pricelevelController.js"
const router=express.Router()
router.post("/createpricelevel",createPricelevel)
router.get("/getallpricelevel",getallpricelevel)
export default router