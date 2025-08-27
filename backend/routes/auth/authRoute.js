import express from "express";
import { Login } from "../../controller/adminController/authController.js";
const router = express.Router();
router.post("/login", Login);
export default router;
