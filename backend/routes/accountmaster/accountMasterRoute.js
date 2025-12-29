import express from "express";

import {
createAccountMaster,
searchAccounts,
deleteAccountMaster,
updateAccountMaster,
getAccountsList,
getAccountsWithOutstanding
} from "../../controller/accountMasterController/accountMasterController.js";
const router = express.Router();
router.post("/create", createAccountMaster);
router.get("/searchAccounts", searchAccounts);
router.put("/update/:id", updateAccountMaster);
router.get("/list", getAccountsList);
router.delete("/delete/:id", deleteAccountMaster);
router.get("/listWithOutstanding", getAccountsWithOutstanding);
export default router;
