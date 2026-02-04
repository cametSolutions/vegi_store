// controllers/stockAdjustmentController.js
import mongoose from "mongoose";
import StockAdjustment from "../../model/StockAdjustmentModel.js";

import {

  processStockAdjustment,
  revertStockAdjustment,
} from "../../helpers/stockAdjustmentHelpers/stockAdjustmentProcessor.js";
import AdjustmentEntry from "../../model/AdjustmentEntryModel.js";
import ItemMaster from "../../model/masters/ItemMasterModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";
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
    const sortBy = req.query.sortBy || "transactionDate";
    const sortOrder = req.query.sortOrder || "desc";
    const adjustmentType = req.query.adjustmentType || "";
    const startDate = req.query.startDate; 
    const endDate = req.query.endDate; 

    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sort = {
      [sortBy]: sortDirection,
      _id: sortDirection,
    };

    const filter = {};

    // ✅ FIXED: Search includes adjustmentType as string field + date parsing
    if (searchTerm) {
      const searchConditions = [
        { transactionNumber: { $regex: searchTerm, $options: "i" } },
        { reference: { $regex: searchTerm, $options: "i" } },
        { reason: { $regex: searchTerm, $options: "i" } },
        { adjustmentType: { $regex: searchTerm, $options: "i" } }, // ✅ Search adjustment type
      ];

      // ✅ Try to parse searchTerm as a date and search transactionDate field
      const parsedDate = new Date(searchTerm);
      if (!isNaN(parsedDate.getTime())) {
        // Valid date - search for adjustments on this date
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        searchConditions.push({
          transactionDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        });
      }

      filter.$or = searchConditions;
    }

    // ✅ Company and branch filters
    if (companyId) filter.company = companyId;
    if (branchId) filter.branch = branchId;
    
    // ✅ Adjustment type filter (from dropdown)
    if (adjustmentType) filter.adjustmentType = adjustmentType;

    // ✅ Date range filter (from date pickers)
    if (startDate || endDate) {
      filter.transactionDate = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.transactionDate.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = end;
      }
    }

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








const calculateStockAdjustmentDeltas = (originalAdjustment, updatedData) => {
  const itemDeltas = [];
  
  // Create maps for quick lookup
  const oldItemsMap = new Map();
  originalAdjustment.items.forEach(item => {
    oldItemsMap.set(item.item.toString(), {
      ...item.toObject(),
      // Convert to signed quantity based on adjustment type
      signedQty: originalAdjustment.adjustmentType === "add" 
        ? item.quantity 
        : -item.quantity
    });
  });

  const newItemsMap = new Map();
  updatedData.items.forEach(item => {
    newItemsMap.set(item.item.toString(), {
      ...item,
      // Convert to signed quantity based on adjustment type
      signedQty: updatedData.adjustmentType === "add" 
        ? item.quantity 
        : -item.quantity
    });
  });

  // Process all items (old and new)
  const allItemIds = new Set([
    ...oldItemsMap.keys(),
    ...newItemsMap.keys()
  ]);

  allItemIds.forEach(itemId => {
    const oldItem = oldItemsMap.get(itemId);
    const newItem = newItemsMap.get(itemId);

    let adjustmentType;
    let delta = 0;
    let oldQty = 0;
    let newQty = 0;
    let oldSignedQty = 0;
    let newSignedQty = 0;

    if (oldItem && newItem) {
      // Item exists in both - calculate delta
      oldQty = oldItem.quantity;
      newQty = newItem.quantity;
      oldSignedQty = oldItem.signedQty;
      newSignedQty = newItem.signedQty;
      
      // Delta = new signed qty - old signed qty
      delta = newSignedQty - oldSignedQty;
      
      if (delta === 0) {
        adjustmentType = "unchanged";
      } else {
        adjustmentType = "quantity_changed";
      }
    } else if (newItem && !oldItem) {
      // Item was added in edit
      newQty = newItem.quantity;
      newSignedQty = newItem.signedQty;
      delta = newSignedQty;
      adjustmentType = "added";
    } else if (oldItem && !newItem) {
      // Item was removed in edit
      oldQty = oldItem.quantity;
      oldSignedQty = oldItem.signedQty;
      delta = -oldSignedQty; // Reverse the old adjustment
      adjustmentType = "removed";
    }

    // Only add to deltas if there's a change
    if (delta !== 0 || adjustmentType !== "unchanged") {
      itemDeltas.push({
        item: itemId,
        itemName: (newItem || oldItem).itemName,
        itemCode: (newItem || oldItem).itemCode,
        adjustmentType,
        oldQuantity: oldQty,
        newQuantity: newQty,
        oldSignedQuantity: oldSignedQty,
        newSignedQuantity: newSignedQty,
        quantityDelta: delta,
      });
    }
  });

  return itemDeltas;
};

/**
 * Apply stock deltas to ItemMaster
 */
const applyStockDeltas = async (itemDeltas, branchId, session) => {
  for (const delta of itemDeltas) {
    if (delta.quantityDelta === 0) continue;

    const item = await ItemMaster.findById(delta.item).session(session);
    
    if (!item) {
      throw new Error(`ItemMaster not found: ${delta.itemName}`);
    }

    const branchStock = item.stock.find(
      s => s.branch.toString() === branchId.toString()
    );

    if (!branchStock) {
      throw new Error(`Stock record not found for item: ${delta.itemName}`);
    }

    // Check for negative stock
    const newStock = branchStock.currentStock + delta.quantityDelta;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for ${delta.itemName}. ` +
        `Current: ${branchStock.currentStock}, ` +
        `Delta: ${delta.quantityDelta}, ` +
        `Would result in: ${newStock}`
      );
    }

    branchStock.currentStock = newStock;
    await item.save({ session });

    console.log(
      `📦 Stock updated for ${delta.itemName}: ` +
      `${branchStock.currentStock - delta.quantityDelta} → ` +
      `${branchStock.currentStock} (delta: ${delta.quantityDelta >= 0 ? '+' : ''}${delta.quantityDelta})`
    );
  }
};

/**
 * Mark Item Monthly Balances for recalculation
 * If edited in September, mark Sep, Oct, Nov, Dec as needing recalculation
 */
const markItemMonthlyBalancesForRecalculation = async (
  originalAdjustment,
  itemDeltas,
  session
) => {
  if (itemDeltas.length === 0) {
    console.log("ℹ️  No item changes, skipping monthly balance marking");
    return;
  }

  const transactionDate = new Date(originalAdjustment.transactionDate);
  const editMonth = transactionDate.getMonth() + 1; // 1-12
  const editYear = transactionDate.getFullYear();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  console.log(`📅 Marking monthly balances from ${editYear}-${editMonth} onwards...`);

  // Get all affected items
  const affectedItemIds = itemDeltas
    .filter(d => d.quantityDelta !== 0)
    .map(d => d.item);

  if (affectedItemIds.length === 0) {
    console.log("ℹ️  No stock quantity changes, skipping monthly balance marking");
    return;
  }

  // Calculate months to mark (from edit month to current month)
  const monthsToMark = [];
  
  let year = editYear;
  let month = editMonth;

  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    monthsToMark.push({
      year,
      month,
      periodKey: `${year}-${String(month).padStart(2, '0')}`
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  console.log(`📊 Months to mark: ${monthsToMark.map(m => m.periodKey).join(', ')}`);

  // Mark all affected items for all months
  for (const item of affectedItemIds) {
    for (const period of monthsToMark) {
      const result = await ItemMonthlyBalance.updateOne(
        {
          company: originalAdjustment.company,
          branch: originalAdjustment.branch,
          item: item,
          year: period.year,
          month: period.month,
        },
        {
          $set: {
            needsRecalculation: true,
            lastUpdated: new Date()
          }
        },
        { session }
      );

      if (result.matchedCount > 0) {
        console.log(`   ✓ Marked ${period.periodKey} for item ${item}`);
      }
    }
  }

  console.log(`✅ Marked ${affectedItemIds.length} items across ${monthsToMark.length} months`);
};
const createStockAdjustmentEntry = async (
  originalAdjustment,
  updatedData,
  itemDeltas,
  userId,
  session
) => {
  // Determine overall adjustment type
  let adjustmentType = "item_change";
  
  // Check if adjustment type changed (add ↔ remove)
  const typeChanged = originalAdjustment.adjustmentType !== updatedData.adjustmentType;
  
  // Check if amount changed
  const amountChanged = originalAdjustment.totalAmount !== updatedData.totalAmount;
  
  if (typeChanged && amountChanged) {
    adjustmentType = "mixed";
  } else if (amountChanged && itemDeltas.length === 0) {
    adjustmentType = "amount_change";
  }

  // Calculate amount delta
  const oldAmount = originalAdjustment.totalAmount || 0;
  const newAmount = updatedData.totalAmount || 0;
  const amountDelta = newAmount - oldAmount;

  // Generate adjustment number
  const adjustmentNumber  = await AdjustmentEntry.generateAdjustmentNumber(
    originalAdjustment.company,
    originalAdjustment.branch,
    session
  );

  // Create adjustment entry
  const adjustmentEntry = new AdjustmentEntry({
    company: originalAdjustment.company,
    branch: originalAdjustment.branch,
    
    // Original transaction reference
    originalTransaction: originalAdjustment._id,
    originalTransactionModel: "StockAdjustment",
    originalTransactionNumber: originalAdjustment.transactionNumber,
    originalTransactionDate: originalAdjustment.transactionDate,
    
    // Adjustment metadata
    adjustmentNumber ,
    adjustmentDate: new Date(),
    adjustmentType,
    
    // Amount details
    amountDelta,
    oldAmount,
    newAmount,
    
    // Item adjustments
    itemAdjustments: itemDeltas.map(delta => ({
      item: delta.item,
      itemName: delta.itemName,
      itemCode: delta.itemCode,
      adjustmentType: delta.adjustmentType,
      oldQuantity: delta.oldQuantity,
      newQuantity: delta.newQuantity,
      quantityDelta: delta.quantityDelta,
    })),
    
    // Audit
    reason: updatedData.reason || "Stock adjustment edited",
    notes: `Stock adjustment type changed from "${originalAdjustment.adjustmentType}" to "${updatedData.adjustmentType}"`,
    editedBy: userId,
    status: "active",
    isSystemGenerated: true,
  });

  await adjustmentEntry.save({ session });

  console.log(`✅ Adjustment entry created: ${adjustmentNumber}`);

  return adjustmentEntry;
};


export const editStockAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updatedData = req.body;
    const userId = req.user.id;

    console.log("🔵 Backend - Edit stock adjustment received");
    console.log("🔵 Backend - ID:", id);

    if (!id || id === "undefined") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment ID",
      });
    }

    // ========================================
    // STEP 1: Fetch original adjustment
    // ========================================
    const originalAdjustment = await StockAdjustment.findById(id).session(session);

    if (!originalAdjustment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found",
      });
    }

    console.log("✅ Found original adjustment:", originalAdjustment.transactionNumber);

    // ========================================
    // STEP 2: Validate - can't change company/branch
    // ========================================
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

    // ========================================
    // STEP 3: Calculate deltas
    // ========================================
    console.log("🔄 Calculating stock deltas...");
    const itemDeltas = calculateStockAdjustmentDeltas(
      originalAdjustment,
      updatedData
    );

    console.log(`📊 Deltas calculated: ${itemDeltas.length} items affected`);
    itemDeltas.forEach(delta => {
      console.log(
        `   - ${delta.itemName}: ` +
        `${delta.oldSignedQuantity >= 0 ? '+' : ''}${delta.oldSignedQuantity} → ` +
        `${delta.newSignedQuantity >= 0 ? '+' : ''}${delta.newSignedQuantity} = ` +
        `${delta.quantityDelta >= 0 ? '+' : ''}${delta.quantityDelta}`
      );
    });

    // ========================================
    // STEP 4: Apply stock deltas
    // ========================================
    if (itemDeltas.some(d => d.quantityDelta !== 0)) {
      console.log("🔄 Applying stock deltas...");
      await applyStockDeltas(
        itemDeltas,
        originalAdjustment.branch,
        session,
        
      );
      console.log("✅ Stock deltas applied");
    } else {
      console.log("ℹ️  No stock changes needed");
    }

    // ========================================
    // STEP 5: Create adjustment entry
    // ========================================
    console.log("🔄 Creating adjustment entry...");
    const adjustmentEntry = await createStockAdjustmentEntry(
      originalAdjustment,
      updatedData,
      itemDeltas,
      userId,
      session
    );

    // ========================================
    // STEP 6: Mark Item Monthly Balances for Recalculation
    // ========================================
    console.log("🔄 Marking monthly balances for recalculation...");
    await markItemMonthlyBalancesForRecalculation(
      originalAdjustment,
      itemDeltas,
      session
    );

    // ========================================
    // STEP 7: Update stock adjustment document
    // ========================================
    console.log("🔄 Updating stock adjustment document...");

    originalAdjustment.adjustmentType = updatedData.adjustmentType;
    originalAdjustment.transactionDate = updatedData.transactionDate;
    originalAdjustment.reference = updatedData.reference || "";
    originalAdjustment.reason = updatedData.reason || "";
    originalAdjustment.items = updatedData.items;
    originalAdjustment.totalAmount = updatedData.totalAmount;
    originalAdjustment.updatedBy = userId;

    await originalAdjustment.save({ session });

    console.log("✅ Stock adjustment document updated");

    // ========================================
    // STEP 8: Commit transaction
    // ========================================
    await session.commitTransaction();

    console.log("✅ Stock adjustment edited successfully");

    res.status(200).json({
      success: true,
      message: "Stock adjustment updated successfully",
      data: {
        stockAdjustment: originalAdjustment,
        adjustmentEntry,
        deltas: {
          itemCount: itemDeltas.length,
          totalDelta: itemDeltas.reduce((sum, d) => sum + d.quantityDelta, 0),
          amountDelta: adjustmentEntry.amountDelta,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("❌ Backend - Stock adjustment edit error:", error);

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
      .sort({ transactionDate: -1 })
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    const history = adjustments.map((adj) => {
      const relevantItem = adj.items.find(
        (item) => item.item.toString() === itemId
      );

      return {
        _id: adj._id,
        transactionNumber: adj.transactionNumber,
        transactionDate: adj.transactionDate,
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
