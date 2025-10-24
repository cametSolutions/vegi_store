import express from "express";
import {
  create,
  deleteItem,
  getAll,
  getById,
  update,
} from "../../controller/itemController/itemController.js";
const router = express.Router();
router.post("/create", create);
router.get("/getall", getAll);
router.get("/:id", getById);
router.put("/update/:id", update);
router.delete("/delete/:id", deleteItem);
export default router;
