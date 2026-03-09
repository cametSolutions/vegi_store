import ItemMaster from "../../model/masters/ItemMasterModel.js";
import { determineTransactionBehavior } from "./modelFindHelper.js";

/**
 * Update stock for multiple items
 * @param {Array} items - Array of transaction items
 * @param {String} stockDirection - "in" or "out"
 * @param {ObjectId} branchId - Branch ID
 * @param {ClientSession} session - MongoDB session
 * @param {String} transactionType - Type of transaction
 */
export const updateStock = async (items, stockDirection, branchId, session, transactionType) => {
  // Step 1: Fetch all items in ONE query
  const itemIds = items.map((i) => i.item);
  const itemMasters = await ItemMaster.find({ _id: { $in: itemIds } }).session(session);

  const itemMasterMap = new Map(itemMasters.map((m) => [m._id.toString(), m]));

  // Step 2: Validate all items and compute new stock values
  const bulkOps = [];

  for (const item of items) {
    const itemMaster = itemMasterMap.get(item.item.toString());
    if (!itemMaster) throw new Error(`Item not found: ${item.itemName}`);

    const stockEntry = itemMaster.stock.find(
      (s) => s.branch.toString() === branchId.toString()
    );
    if (!stockEntry) throw new Error(`Stock entry not found for item ${item.itemName} in this branch`);

    const quantityChange = item.quantity;
    let stockDelta;

    if (stockDirection === "out") {
      const newStock = stockEntry.currentStock - quantityChange;
      if (newStock < 0 && (transactionType === "sale" || transactionType === "purchase_return")) {
        throw new Error(
          `Insufficient stock for ${item.itemName}. Available: ${stockEntry.currentStock}, Required: ${quantityChange}`
        );
      }
      stockDelta = -quantityChange;
    } else if (stockDirection === "in") {
      stockDelta = quantityChange;
    } else {
      throw new Error(`Invalid stock direction: ${stockDirection}`);
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: item.item, "stock.branch": branchId },
        update: { $inc: { "stock.$.currentStock": stockDelta } },
      },
    });
  }

  // Step 3: One bulkWrite for all items
  await ItemMaster.bulkWrite(bulkOps, { session });

  return { success: true };
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
    (s) => s.branch.toString() === branchId.toString(),
  );

  return stockEntry ? stockEntry.currentStock : 0;
};

/**
 * Apply stock deltas (only change what's different)
 */
export const applyStockDeltas = async (stockDeltas, branchId, session,transactionType) => {
  const behavior = determineTransactionBehavior(
    stockDeltas[0]?.transactionType || "sale",
  );

  for (const delta of stockDeltas) {
    const itemMaster = await ItemMaster.findById(delta.item).session(session);

    if (!itemMaster) {
      throw new Error(`Item not found: ${delta.itemName}`);
    }

    const stockEntry = itemMaster.stock.find(
      (s) => s.branch.toString() === branchId.toString(),
    );

    if (!stockEntry) {
      throw new Error(
        `Stock entry not found for item ${delta.itemName} in this branch`,
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
    if (stockEntry.currentStock < 0 && (transactionType == "sale" || transactionType == "purchase_return")) {
      throw new Error(
        `Insufficient stock for ${delta.itemName}. Current: ${
          stockEntry.currentStock + stockChange
        }, Delta: ${stockChange}`,
      );
    }

    await itemMaster.save({ session });
  }

  return { success: true, deltasApplied: stockDeltas.length };
};
