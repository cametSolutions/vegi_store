import express from "express";
import {
  createFundTransaction,getTransactions

} from "../../controller/FundTransactionController/FundTransactionController.js";

const router = express.Router();

// Create transaction for both receipt and payment
// The transactionType comes from the URL parameter
router.post("/:transactionType/createFundTransaction", createFundTransaction);
router.get("/:transactionType/getall", getTransactions);



export default router;