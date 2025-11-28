import express from "express"
import { getItemLedgerReport, getItemMonthlyReport } from "../../controller/reportController/itemReportController.js"
const router=express.Router()


router.get("/item-ledger",getItemLedgerReport)
router.get("/item-monthly-summary",getItemMonthlyReport)



export default router