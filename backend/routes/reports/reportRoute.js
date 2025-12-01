import express from "express"
import { getItemLedgerReport, getItemMonthlyReport } from "../../controller/reportController/itemReportController.js"
import { getAccountLedgerReport, getAccountMonthlySummary } from "../../controller/reportController/accountReportController.js"
const router=express.Router()

/// Item Reports
router.get("/item-ledger",getItemLedgerReport)
router.get("/item-monthly-summary",getItemMonthlyReport)

/// Account Reports
router.get("/account-ledger",getAccountLedgerReport)
router.get("/account-monthly-summary",getAccountMonthlySummary)



export default router