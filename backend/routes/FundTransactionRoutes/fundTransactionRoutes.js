import express from "express";
import {
  createFundTransactionController,editFundTransactionController,getTransactions

} from "../../controller/FundTransactionController/FundTransactionController.js";
import {  getTransactionDetail } from "../../controller/transactionController/transactionController.js";

const router = express.Router();

// Create transaction for both receipt and payment
// The transactionType comes from the URL parameter
router.post("/:transactionType/createFundTransaction", createFundTransactionController);
router.get("/:transactionType/getall", getTransactions);
router.get("/:transactionType/getTransactionDetails/:transactionId", getTransactionDetail);
router.put("/:transactionType/edit/:transactionId", editFundTransactionController);



export default router;