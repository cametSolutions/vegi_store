import express from "express";

import { syncIndexes } from "../../controller/devController/devController.js";
const router = express.Router();

router.post("/syncindex", syncIndexes);


export default router;
