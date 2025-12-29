// routes/stockAdjustmentRoutes.js
import express from "express";
import {
  getStockAdjustments,
  createStockAdjustment,
  getStockAdjustmentDetail,
  editStockAdjustment,
  deleteStockAdjustment,
  getItemAdjustmentHistory,
} from "../../controller/StockAdjustmentController/StockAdjustmentController.js";


const router = express.Router();


router.get("/getall", getStockAdjustments);
router.post("/create", createStockAdjustment);
router.get("/getDetails/:adjustmentId", getStockAdjustmentDetail);
router.put("/edit/:id", editStockAdjustment);
router.delete("/delete/:adjustmentId", deleteStockAdjustment);
router.get("/item-history/:itemId", getItemAdjustmentHistory);

export default router;
