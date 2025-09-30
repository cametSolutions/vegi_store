import express from "express"
import { createAccountMaster } from "../../controller/master/accoutMasterController.js"
import { getallaccountHolder,deleteAccntmaster,updateAccntMaster, searchAccounts } from "../../controller/accountMasterController/accountMasterController.js"
const router=express.Router()
router.post("/createaccountmaster",createAccountMaster)
router.get("/getallaccountmaster",getallaccountHolder)
router.delete("/deleteaccntmaster/:id",deleteAccntmaster)
router.put("/updateaccntmaster/:id",updateAccntMaster)
router.get("/searchAccounts",searchAccounts)
export default router