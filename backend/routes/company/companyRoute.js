import express from "express"

import { createCompany } from "../../controller/master/masterController.js"
import { getallCompanies } from "../../controller/companyController/companyController.js"
const router = express.Router()
router.post("/createcompanies", createCompany)
router.get("/getallcompanies",getallCompanies)
export default router;
