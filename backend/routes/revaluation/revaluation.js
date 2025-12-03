import express from "express";
import { triggerRevaluation } from "../../controller/revaluationController/revaluationController.js";

const router = express.Router();

router.post("/trigger-revaluation", triggerRevaluation);

export default router;
