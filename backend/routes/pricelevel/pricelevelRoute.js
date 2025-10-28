import express from "express"
import { getallPriceLevel,create,deletePriceLevel,update } from "../../controller/pricelevelController/pricelevelController.js"
const router=express.Router()

router.post("/",create)
router.get("/getallpricelevel",getallPriceLevel)
router.put("/:id",update)
router.delete("/:id",deletePriceLevel)


export default router