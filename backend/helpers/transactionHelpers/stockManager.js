import ItemMaster from "../../model/masters/ItemMasterModel.js";
import { determineTransactionBehavior } from "./modelFindHelper.js";

/**
 * Update stock for multiple items
 * @param {Array} items - Array of transaction items
 * @param {String} stockDirection - "in" or "out"
 * @param {ObjectId} branchId - Branch ID
 * @param {ClientSession} session - MongoDB session
 */
export const updateStock = async (items, stockDirection, branchId, session) => {
  try {
    for (const item of items) {
      // console.log(item);

      // Find the item in ItemMaster
      const itemMaster = await ItemMaster.findById(item.item).session(session);

      if (!itemMaster) {
        throw new Error(`Item not found: ${item.itemName}`);
      }

      // Find the stock entry for this branch
      const stockEntry = itemMaster.stock.find(
        (s) => s.branch.toString() === branchId.toString()
      );

      if (!stockEntry) {
        throw new Error(
          `Stock entry not found for item ${item.itemName} in this branch`
        );
      }

      // Calculate new stock
      const quantityChange = item.quantity;
      let newStock;

      if (stockDirection === "out") {
        newStock = stockEntry.currentStock - quantityChange;

        // Validate stock availability
        // if (newStock < 0) {
        //   throw new Error(
        //     `Insufficient stock for ${item.itemName}. Available: ${stockEntry.currentStock}, Required: ${quantityChange}`
        //   );
        // }
      } else if (stockDirection === "in") {
        newStock = stockEntry.currentStock + quantityChange;
      } else {
        throw new Error(`Invalid stock direction: ${stockDirection}`);
      }

      // Update stock
      stockEntry.currentStock = newStock;
      await itemMaster.save({ session });
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

/**
 * Get current stock for an item in a branch
 */
export const getCurrentStock = async (itemId, branchId, session = null) => {
  const query = ItemMaster.findById(itemId);

  if (session) {
    query.session(session);
  }

  const itemMaster = await query;

  if (!itemMaster) {
    throw new Error("Item not found");
  }

  const stockEntry = itemMaster.stock.find(
    (s) => s.branch.toString() === branchId.toString()
  );

  return stockEntry ? stockEntry.currentStock : 0;
};

/**
 * Apply stock deltas (only change what's different)
 */
export const applyStockDeltas = async (stockDeltas, branchId, session) => {
  const behavior = determineTransactionBehavior(
    stockDeltas[0]?.transactionType || "sale"
  );

  for (const delta of stockDeltas) {
    const itemMaster = await ItemMaster.findById(delta.item).session(session);

    if (!itemMaster) {
      throw new Error(`Item not found: ${delta.itemName}`);
    }

    const stockEntry = itemMaster.stock.find(
      (s) => s.branch.toString() === branchId.toString()
    );

    if (!stockEntry) {
      throw new Error(
        `Stock entry not found for item ${delta.itemName} in this branch`
      );
    }

    // Apply the delta based on transaction type
    let stockChange = delta.quantityDelta;

    // For sales/debit notes, positive delta means MORE stock out
    // For purchase/credit notes, positive delta means MORE stock in
    if (behavior.stockDirection === "out") {
      stockEntry.currentStock -= stockChange; // Delta is positive = more out
    } else {
      stockEntry.currentStock += stockChange; // Delta is positive = more in
    }

    // console.log("stockEntry.currentStock", stockEntry.currentStock);
    

    // Validate stock
    // if (stockEntry.currentStock < 0) {
    //   throw new Error(
    //     `Insufficient stock for ${delta.itemName}. Current: ${
    //       stockEntry.currentStock + stockChange
    //     }, Delta: ${stockChange}`
    //   );
    // }

    await itemMaster.save({ session });
  }

  return { success: true, deltasApplied: stockDeltas.length };
};

