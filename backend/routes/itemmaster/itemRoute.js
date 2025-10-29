import express from "express";
import {
  create,
  deleteItem,
  getAll,
  getById,
  searchItems,
  update,
  updateRate,
} from "../../controller/itemController/itemController.js";
const router = express.Router();
router.get("/searchItem", searchItems);
router.post("/create", create);
router.get("/getall", getAll);
router.get("/:id", getById);
router.put("/update/:id", update);
router.delete("/delete/:id", deleteItem);
router.patch("/:itemId/rate", updateRate);

export default router;
