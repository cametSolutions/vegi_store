import express from "express";

import {
createAccountMaster,
searchAccounts,
deleteAccountMaster,
updateAccountMaster,
getAccountsList
} from "../../controller/accountMasterController/accountMasterController.js";
const router = express.Router();
router.post("/create", createAccountMaster);
router.get("/searchAccounts", searchAccounts);
router.put("/update/:id", updateAccountMaster);
router.get("/list", getAccountsList);
router.delete("/delete/:id", deleteAccountMaster);
export default router;
