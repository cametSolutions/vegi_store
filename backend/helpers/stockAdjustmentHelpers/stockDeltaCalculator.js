// helpers/stockAdjustmentHelpers/stockDeltaCalculator.js

/**
 * Calculate deltas between original and updated stock adjustment
 */
export const calculateStockAdjustmentDeltas = (original, updated) => {
  // Adjustment type changed?
  const adjustmentTypeChanged = original.adjustmentType !== updated.adjustmentType;

  // Calculate item deltas
  const itemDeltas = calculateStockItemDeltas(original.items, updated.items);

  // Total amount delta
  const totalAmountDelta = updated.totalAmount - original.totalAmount;

  return {
    adjustmentTypeChanged,
    oldAdjustmentType: original.adjustmentType,
    newAdjustmentType: updated.adjustmentType,
    totalAmountDelta,
    oldTotalAmount: original.totalAmount,
    newTotalAmount: updated.totalAmount,
    itemDeltas,
    itemsChanged: itemDeltas.length > 0,
  };
};

/**
 * Calculate item-level deltas
 */
export const calculateStockItemDeltas = (originalItems, updatedItems) => {
  const deltas = [];

  // Create maps for easy lookup
  const originalMap = new Map(
    originalItems.map((item) => [item.item.toString(), item])
  );
  const updatedMap = new Map(
    updatedItems.map((item) => [item.item.toString(), item])
  );

  // Check removed items
  originalItems.forEach((oldItem) => {
    const itemId = oldItem.item.toString();
    if (!updatedMap.has(itemId)) {
      deltas.push({
        item: oldItem.item,
        itemName: oldItem.itemName,
        itemCode: oldItem.itemCode,
        adjustmentType: "removed",
        oldQuantity: oldItem.quantity,
        newQuantity: 0,
        quantityDelta: -oldItem.quantity,
        oldRate: oldItem.rate,
        newRate: 0,
        rateDelta: -oldItem.rate,
        oldAmount: oldItem.amount,
        newAmount: 0,
        amountDelta: -oldItem.amount,
      });
    }
  });

  // Check added and modified items
  updatedItems.forEach((newItem) => {
    const itemId = newItem.item.toString();
    const oldItem = originalMap.get(itemId);

    if (!oldItem) {
      // Item was added
      deltas.push({
        item: newItem.item,
        itemName: newItem.itemName,
        itemCode: newItem.itemCode,
        adjustmentType: "added",
        oldQuantity: 0,
        newQuantity: newItem.quantity,
        quantityDelta: newItem.quantity,
        oldRate: 0,
        newRate: newItem.rate,
        rateDelta: newItem.rate,
        oldAmount: 0,
        newAmount: newItem.amount,
        amountDelta: newItem.amount,
      });
    } else {
      // Item exists - check for changes
      const quantityChanged = oldItem.quantity !== newItem.quantity;
      const rateChanged = oldItem.rate !== newItem.rate;

      if (quantityChanged || rateChanged) {
        let adjustmentType;
        if (quantityChanged && rateChanged) {
          adjustmentType = "quantity_and_rate_changed";
        } else if (quantityChanged) {
          adjustmentType = "quantity_changed";
        } else {
          adjustmentType = "rate_changed";
        }

        deltas.push({
          item: newItem.item,
          itemName: newItem.itemName,
          itemCode: newItem.itemCode,
          adjustmentType,
          oldQuantity: oldItem.quantity,
          newQuantity: newItem.quantity,
          quantityDelta: newItem.quantity - oldItem.quantity,
          oldRate: oldItem.rate,
          newRate: newItem.rate,
          rateDelta: newItem.rate - oldItem.rate,
          oldAmount: oldItem.amount,
          newAmount: newItem.amount,
          amountDelta: newItem.amount - oldItem.amount,
        });
      }
    }
  });

  return deltas;
};

/**
 * Apply stock deltas to ItemMaster
 */
export const applyStockAdjustmentDeltas = async (
  deltas,
  adjustmentType,
  branchId,
  session
) => {
  const ItemMaster = (await import("../../model/masters/ItemMasterModel.js")).default;

  for (const delta of deltas) {
    const item = await ItemMaster.findById(delta.item).session(session);

    if (!item) {
      throw new Error(`Item not found: ${delta.itemName}`);
    }

    const branchStock = item.stock.find(
      (s) => s.branch.toString() === branchId.toString()
    );

    if (!branchStock) {
      throw new Error(`Stock record not found for item: ${delta.itemName}`);
    }

    // Calculate stock change based on adjustment type and delta
    let stockChange = 0;

    if (adjustmentType === "add") {
      stockChange = delta.quantityDelta; // Positive = add more, Negative = add less
    } else if (adjustmentType === "remove") {
      stockChange = -delta.quantityDelta; // Positive = remove less, Negative = remove more
    }

    // Check for negative stock
    const newStock = branchStock.currentStock + stockChange;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for ${delta.itemName}. Available: ${branchStock.currentStock}, Change: ${stockChange}`
      );
    }

    branchStock.currentStock = newStock;

    console.log(
      `📦 Stock adjusted for ${delta.itemName}: ${branchStock.currentStock - stockChange} ${stockChange >= 0 ? "+" : ""}${stockChange} = ${branchStock.currentStock}`
    );

    await item.save({ session });
  }
};
