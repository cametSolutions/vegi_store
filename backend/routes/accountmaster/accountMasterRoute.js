import express from "express";

import {
  getallaccountHolder,
  deleteAccntmaster,
  updateAccntMaster,
  searchAccounts,
  createAccountMaster,
} from "../../controller/accountMasterController/accountMasterController.js";
const router = express.Router();
router.post("/createaccountmaster", createAccountMaster);
router.get("/getallaccountmaster", getallaccountHolder);
router.delete("/deleteaccntmaster/:id", deleteAccntmaster);
router.put("/updateaccntmaster/:id", updateAccntMaster);
router.get("/searchAccounts", searchAccounts);
export default router;
