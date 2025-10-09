import express from "express";
import { createTransaction } from "../../controller/transactionController/transactionController.js";
const router = express.Router();


router.post("/create", createTransaction);

export default router;
