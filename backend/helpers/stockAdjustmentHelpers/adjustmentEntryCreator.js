// helpers/stockAdjustmentHelpers/adjustmentEntryCreator.js

import AdjustmentEntry from "../../model/AdjustmentEntryModel.js";

/**
 * Create adjustment entry for stock adjustment edit
 */
export const createStockAdjustmentEntry = async (
  original,
  updated,
  deltas,
  userId,
  session
) => {
  // Generate adjustment number
  const adjustmentNumber = await AdjustmentEntry.generateAdjustmentNumber(
    updated.company,
    updated.branch,
    session
  );

  // Determine adjustment type
  let adjustmentType;
  if (deltas.adjustmentTypeChanged && deltas.itemsChanged) {
    adjustmentType = "mixed";
  } else if (deltas.adjustmentTypeChanged) {
    adjustmentType = "amount_change"; // Type change affects amounts
  } else if (deltas.itemsChanged) {
    adjustmentType = "item_change";
  } else {
    adjustmentType = "amount_change"; // Only metadata changed
  }

  // Create adjustment entry
  const adjustmentEntry = await AdjustmentEntry.create(
    [
      {
        company: updated.company,
        branch: updated.branch,
        originalTransaction: original._id,
        originalTransactionModel: "StockAdjustment",
        originalTransactionNumber: original.adjustmentNumber,
        originalTransactionDate: original.adjustmentDate,
        adjustmentNumber,
        adjustmentDate: new Date(),
        adjustmentType,
        amountDelta: deltas.totalAmountDelta,
        oldAmount: deltas.oldTotalAmount,
        newAmount: deltas.newTotalAmount,
        itemAdjustments: deltas.itemDeltas,
        reason: updated.reason || "Stock adjustment edited",
        notes: `Adjustment type: ${deltas.oldAdjustmentType} → ${deltas.newAdjustmentType}`,
        editedBy: userId,
        status: "active",
        isSystemGenerated: true,
      },
    ],
    { session }
  );

  return adjustmentEntry[0];
};
