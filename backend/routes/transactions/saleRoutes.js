import express from "express";
import { createTransaction, getTransactions } from "../../controller/transactionController/transactionController.js";
const router = express.Router();


router.post("/create", createTransaction);
router.get("/getall", getTransactions);


export default router;
