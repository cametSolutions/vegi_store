import express from "express"
import { createBranch} from "../../controller/master/masterController.js"
import { getallBranches } from "../../controller/branchController/branchController.js"
const router=express.Router()
router.post("/createbranches",createBranch)
router.get("/getallbranches",getallBranches)
export default router