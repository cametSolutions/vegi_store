// controllers/stockAdjustmentController.js
import mongoose from "mongoose";
import StockAdjustment from "../../model/StockAdjustmentModel.js";
import {
  processStockAdjustment,
  revertStockAdjustment,
} from "../../helpers/stockAdjustmentHelpers/stockAdjustmentProcessor.js";

/**
 * GET /api/stock-adjustment/getall
 * Get all stock adjustments with pagination
 */
export const getStockAdjustments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const searchTerm = req.query.searchTerm || "";
    const companyId = req.query.companyId;
    const branchId = req.query.branchId;
    const sortBy = req.query.sortBy || "adjustmentDate";
    const sortOrder = req.query.sortOrder || "desc";
    const adjustmentType = req.query.adjustmentType || "";

    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sort = {
      [sortBy]: sortDirection,
      _id: sortDirection,
    };

    const filter = {};

    if (searchTerm) {
      filter.$or = [
        { adjustmentNumber: { $regex: searchTerm, $options: "i" } },
        { reference: { $regex: searchTerm, $options: "i" } },
        { reason: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (companyId) filter.company = companyId;
    if (branchId) filter.branch = branchId;
    if (adjustmentType) filter.adjustmentType = adjustmentType;

    const result = await StockAdjustment.getPaginatedAdjustments(
      filter,
      page,
      limit,
      sort
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching stock adjustments:", error);
    res.status(500).json({
      message: "Error fetching stock adjustments",
      error: error.message,
    });
  }
};

/**
 * POST /api/stock-adjustment/create
 * Create new stock adjustment
 */
export const createStockAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustmentData = req.body;
    const userId = req.user.id;

    adjustmentData.createdBy = userId;

    // Validate
    if (!adjustmentData.company || !adjustmentData.branch) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Company and branch are required",
      });
    }

    if (!adjustmentData.adjustmentType) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Adjustment type is required (add/remove)",
      });
    }

    if (!adjustmentData.items || adjustmentData.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Process
    const result = await processStockAdjustment(
      adjustmentData,
      userId,
      session
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Stock adjustment created successfully",
      data: {
        stockAdjustment: result.stockAdjustment,
        itemLedgers: result.itemLedgers,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Stock adjustment creation error:", error);

    if (error.message.includes("Insufficient stock")) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create stock adjustment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/stock-adjustment/getDetails/:adjustmentId
 * Get single stock adjustment
 */
export const getStockAdjustmentDetail = async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    const { companyId, branchId } = req.query;

    const adjustment = await StockAdjustment.findOne({
      _id: adjustmentId,
      company: companyId,
      branch: branchId,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found",
      });
    }

    return res.status(200).json(adjustment);
  } catch (error) {
    console.error("Error fetching stock adjustment:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock adjustment",
      error: error.message,
    });
  }
};

/**
 * PUT /api/stock-adjustment/edit/:adjustmentId
 * Edit stock adjustment
 */
export const editStockAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { adjustmentId } = req.params;
    const updatedData = req.body;
    const userId = req.user.id;

    // Fetch original
    const originalAdjustment = await StockAdjustment.findById(
      adjustmentId
    ).session(session);

    if (!originalAdjustment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found",
      });
    }

    // Validate
    if (
      originalAdjustment.company.toString() !== updatedData.company ||
      originalAdjustment.branch.toString() !== updatedData.branch
    ) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Cannot change company or branch during edit",
      });
    }

    // Revert old
    await revertStockAdjustment(originalAdjustment, userId, session);

    // Process new
    const result = await processStockAdjustment(
      {
        ...updatedData,
        adjustmentNumber: originalAdjustment.adjustmentNumber,
      },
      userId,
      session
    );

    // Update document
    originalAdjustment.adjustmentType = result.stockAdjustment.adjustmentType;
    originalAdjustment.adjustmentDate = result.stockAdjustment.adjustmentDate;
    originalAdjustment.reference = result.stockAdjustment.reference;
    originalAdjustment.reason = result.stockAdjustment.reason;
    originalAdjustment.items = result.stockAdjustment.items;
    originalAdjustment.totalAmount = result.stockAdjustment.totalAmount;
    originalAdjustment.updatedBy = userId;

    await originalAdjustment.save({ session });

    // Delete duplicate
    await StockAdjustment.deleteOne({ _id: result.stockAdjustment._id }).session(
      session
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Stock adjustment updated successfully",
      data: {
        stockAdjustment: originalAdjustment,
        itemLedgers: result.itemLedgers,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Stock adjustment edit error:", error);

    if (error.message.includes("Insufficient stock")) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to edit stock adjustment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE /api/stock-adjustment/delete/:adjustmentId
 * Delete stock adjustment
 */
export const deleteStockAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { adjustmentId } = req.params;
    const { companyId, branchId } = req.query;
    const userId = req.user.id;

    const adjustment = await StockAdjustment.findOne({
      _id: adjustmentId,
      company: companyId,
      branch: branchId,
    }).session(session);

    if (!adjustment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found",
      });
    }

    // Revert
    await revertStockAdjustment(adjustment, userId, session);

    // Delete
    await StockAdjustment.deleteOne({ _id: adjustmentId }).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Stock adjustment deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Stock adjustment deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete stock adjustment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/stock-adjustment/item-history/:itemId
 * Get adjustment history for an item
 */
export const getItemAdjustmentHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { companyId, branchId, limit = 10 } = req.query;

    const adjustments = await StockAdjustment.find({
      "items.item": itemId,
      company: companyId,
      branch: branchId,
    })
      .sort({ adjustmentDate: -1 })
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    const history = adjustments.map((adj) => {
      const relevantItem = adj.items.find(
        (item) => item.item.toString() === itemId
      );

      return {
        _id: adj._id,
        adjustmentNumber: adj.adjustmentNumber,
        adjustmentDate: adj.adjustmentDate,
        adjustmentType: adj.adjustmentType,
        reference: adj.reference,
        reason: adj.reason,
        item: relevantItem,
        createdBy: adj.createdBy,
      };
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching item adjustment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adjustment history",
      error: error.message,
    });
  }
};
