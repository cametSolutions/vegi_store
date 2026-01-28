import express from "express";
import { createTransaction, deleteTransaction, editTransaction, getTransactionDetail, getTransactions } from "../../controller/transactionController/transactionController.js";
const router = express.Router();



  router.post("/create", createTransaction);
  router.get("/getall", getTransactions);
  router.get("/getTransactionDetails/:transactionId", getTransactionDetail);
  router.put("/edit/:transactionId", editTransaction);
  router.delete("/delete/:transactionId", deleteTransaction);


export default router;
