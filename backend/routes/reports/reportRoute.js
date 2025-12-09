import express from "express"
import { getItemLedgerReport, getItemMonthlyReport } from "../../controller/reportController/itemReportController.js"
import { getAccountLedgerReport, getAccountMonthlySummary } from "../../controller/reportController/accountReportController.js"
import { getOutstandingReport, getOutstandingSummary } from "../../controller/reportController/outstandingReportController.js"

const router=express.Router()

/// Item Reports
router.get("/item-ledger",getItemLedgerReport)
router.get("/item-monthly-summary",getItemMonthlyReport)

/// Account Reports
router.get("/account-ledger",getAccountLedgerReport)
router.get("/account-monthly-summary",getAccountMonthlySummary)
router.get("/outstanding-report",getOutstandingReport)
router.get("/outstanding-summary",getOutstandingSummary)



export default router