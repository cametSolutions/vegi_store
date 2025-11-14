import express from "express";
import {
  createTransaction,
  getTransactionDetail,
  getTransactions,
} from "../../controller/transactionController/transactionController.js";
const router = express.Router();

router.post("/create", createTransaction);
router.get("/getall", getTransactions);
router.get("/getTransactionDetails/:transactionId", getTransactionDetail);

export default router;
