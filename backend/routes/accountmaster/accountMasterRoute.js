import express from "express"
import { createAccountMaster } from "../../controller/master/accoutMasterController.js"
import { getallaccountHolder,deleteAccntmaster,updateAccntMaster } from "../../controller/accountMasterController/accountMasterController.js"
const router=express.Router()
router.post("/createaccountmaster",createAccountMaster)
router.get("/getallaccountmaster",getallaccountHolder)
router.delete("/deleteaccntmaster/:id",deleteAccntmaster)
router.put("/updateaccntmaster/:id",updateAccntMaster)
export default router