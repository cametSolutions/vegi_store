import express from "express";

import { deleteData, syncIndexes } from "../../controller/devController/devController.js";
const router = express.Router();

router.post("/syncindex", syncIndexes);
router.delete("/deleteData", deleteData);


export default router;
