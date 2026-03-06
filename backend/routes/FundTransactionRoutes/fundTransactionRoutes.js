import express from "express";
import {
  deleteFundTransactionController,editFundTransactionController,getTransactions,createStandaloneFundTransaction

} from "../../controller/FundTransactionController/FundTransactionController.js";
import {  getTransactionDetail } from "../../controller/transactionController/transactionController.js";

const router = express.Router();

// Create transaction for both receipt and payment
// The transactionType comes from the URL parameter
router.post("/:transactionType/createFundTransaction",createStandaloneFundTransaction );
router.get("/:transactionType/getall", getTransactions);
router.get("/:transactionType/getTransactionDetails/:transactionId", getTransactionDetail);
router.put("/:transactionType/edit/:transactionId", editFundTransactionController);
router.delete("/:transactionType/delete/:transactionId", deleteFundTransactionController);




export default router;