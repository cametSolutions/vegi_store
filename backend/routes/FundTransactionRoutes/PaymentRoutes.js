import express from "express";
import {
  createFundTransaction,

} from "../../controller/FundTransactionController/FundTransactionController.js";

const router = express.Router();

// Create transaction for both receipt and payment
// The transactionType comes from the URL parameter
router.post("/:transactionType/createFundTransaction", createFundTransaction);




export default router;