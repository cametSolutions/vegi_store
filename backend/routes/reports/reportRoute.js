import express from "express"
import { getItemLedgerReport, getItemMonthlyReport } from "../../controller/reportController/dev/itemReportController.js"
import { getAccountLedgerReport, getAccountMonthlySummary } from "../../controller/reportController/dev/accountReportController.js"
import { getOutstandingReport, getOutstandingSummary,getPartyOutstandingDetails,getOutstandingParties } from "../../controller/reportController/dev/outstandingReportController.js"
import {getTransactionSummary} from "../../controller/reportController/saleReportController.js"
import { getItemSummaryReport } from "../../controller/reportController/itemSummaryController.js"
import { getAccountSummaryReport } from "../../controller/reportController/accountSummaryController.js"
const router=express.Router()

/// Item Reports
router.get("/item-ledger",getItemLedgerReport)
router.get("/item-monthly-summary",getItemMonthlyReport)
router.get("/items-summary",getItemSummaryReport)


/// Account Reports
router.get("/account-ledger",getAccountLedgerReport)
router.get("/account-monthly-summary",getAccountMonthlySummary)
router.get("/account-summary",getAccountSummaryReport)
router.get("/outstanding-report",getOutstandingReport)
router.get("/outstanding-summary",getOutstandingSummary)
router.get("/transaction-summary/:companyId/:branchId/:transactionType",getTransactionSummary)
router.get('/getCustomerOutstandingDetails/:companyId/:branchId/:customerId',getPartyOutstandingDetails);
// router.get('/getOutstandingCustomers/:companyId/:branchId',getOutstandingCustomers);
// In your routes file
router.get('/getOutstandingParties/:companyId/:branchId', getOutstandingParties);


export default router