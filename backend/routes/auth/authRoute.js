import express from "express";
import { Login,logout } from "../../controller/authController/authController.js";
const router = express.Router();
router.post("/login", Login);
router.post("/logout", logout);
export default router;
