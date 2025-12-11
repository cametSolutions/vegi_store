/**
 * Calculate subtotal from items array
 */
export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};

/**
 * Calculate taxable amount from items
 */
export const calculateTaxableAmount = (items) => {
  return items.reduce((sum, item) => {
    if (item.taxable) {
      return sum + (item.amount || 0);
    }
    return sum;
  }, 0);
};

/**
 * Calculate tax amount
 */
export const calculateTaxAmount = (items) => {
  return items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
};

/**
 * Calculate amount after tax
 */
export const calculateAmountAfterTax = (subtotal, taxAmount) => {
  return subtotal + taxAmount;
};

/**
 * Calculate discount amount (percentage or fixed)
 */
export const calculateDiscountAmount = (amount, discount, isPercentage = false) => {
  if (isPercentage) {
    return (amount * discount) / 100;
  }
  return discount;
};

/**
 * Calculate net amount
 */
export const calculateNetAmount = (amountAfterTax, discountAmount) => {
  return amountAfterTax - discountAmount;
};

/**
 * Calculate closing balance
 */
export const calculateClosingBalance = (netAmount, paidAmount) => {
  return netAmount - paidAmount;
};

/**
 * Determine payment status based on amounts
 */
export const determinePaymentStatus = (netAmount, paidAmount) => {
  if (paidAmount <= 0) {
    return "pending";
  } else if (paidAmount >= netAmount) {
    return "paid";
  } else {
    return "partial";
  }
};

/**
 * Calculate differences between original and updated transaction
 */
export const calculateTransactionDeltas = (original, updated) => {
  // Amount delta
  const netAmountDelta = updated.netAmount - original.netAmount;

  console.log("updated.netAmount", updated.netAmount);
  console.log("original.netAmount", original.netAmount);
  

  // Account changed?
  const accountChanged =
    original.account.toString() !== updated.account.toString();

  // Item deltas
  const stockDelta = calculateStockDeltas(original.items, updated.items);

  return {
    netAmountDelta,
    accountChanged,
    oldAccount: original.account,
    oldAccountName: original.accountName,
    newAccount: updated.account,
    newAccountName: updated.accountName,
    stockDelta,
    itemsChanged: stockDelta.length > 0,
  };
};

/**
 * Calculate stock deltas for items
 * Returns array of items with quantity changes
 */
/**
 * Calculate stock & rate deltas for items
 * - quantityDelta affects stock
 * - rateDelta is for valuation/amount change only
 */
export const calculateStockDeltas = (originalItems, updatedItems) => {
  const deltas = [];

  const originalMap = new Map(
    originalItems.map((item) => [item.item.toString(), item])
  );
  const updatedMap = new Map(
    updatedItems.map((item) => [item.item.toString(), item])
  );

  // 1) Items in updated (new or changed)
  updatedItems.forEach((updatedItem) => {
    const itemId = updatedItem.item.toString();
    const originalItem = originalMap.get(itemId);

    if (!originalItem) {
      // NEW item
      deltas.push({
        item: updatedItem.item,
        itemName: updatedItem.itemName,
        itemCode: updatedItem.itemCode,
        unit: updatedItem.unit,

        // stock movement
        quantityDelta: updatedItem.quantity,
        isNew: true,
        isRemoved: false,

        // rate/amount side
        oldRate: 0,
        newRate: updatedItem.rate,
        rateDelta: updatedItem.rate, // mainly for info

        // helpful classification
        changeType: "added",
      });
    } else {
      const quantityDelta = updatedItem.quantity - originalItem.quantity;
      const rateDelta = updatedItem.rate - originalItem.rate;

      // Only push if something actually changed
      if (quantityDelta !== 0 || rateDelta !== 0) {
        let changeType = null;
        if (quantityDelta !== 0 && rateDelta !== 0) {
          changeType = "quantity_and_rate_changed";
        } else if (quantityDelta !== 0) {
          changeType = "quantity_changed";
        } else if (rateDelta !== 0) {
          changeType = "rate_changed";
        }

        deltas.push({
          item: updatedItem.item,
          itemName: updatedItem.itemName,
          itemCode: updatedItem.itemCode,
          unit: updatedItem.unit,

          quantityDelta,
          isNew: false,
          isRemoved: false,

          oldQuantity: originalItem.quantity,
          newQuantity: updatedItem.quantity,

          oldRate: originalItem.rate,
          newRate: updatedItem.rate,
          rateDelta,

          changeType,
        });
      }
    }
  });

  // 2) Items removed (in original but not in updated)
  originalItems.forEach((originalItem) => {
    const itemId = originalItem.item.toString();
    if (!updatedMap.has(itemId)) {
      deltas.push({
        item: originalItem.item,
        itemName: originalItem.itemName,
        itemCode: originalItem.itemCode,
        unit: originalItem.unit,

        quantityDelta: -originalItem.quantity,
        isNew: false,
        isRemoved: true,

        oldQuantity: originalItem.quantity,
        newQuantity: 0,

        oldRate: originalItem.rate,
        newRate: 0,
        rateDelta: -originalItem.rate, // just informational

        changeType: "removed",
      });
    }
  });

  return deltas;
};


/**
 * Calculate what changed between original and updated data for receipt/payment transactions
 */
export const calculateFundTransactionDeltas = (originalTx, updateData) => {
  const deltas = {
    amountChanged: false,
    amountDelta: 0,
    oldAmount: originalTx.amount,
    newAmount: originalTx.amount,
    paymentModeChanged: false,
    chequeDetailsChanged: false,
    narrationChanged: false,
  };

  // Check amount change
  if (updateData.amount !== undefined && updateData.amount !== originalTx.amount) {
    deltas.amountChanged = true;
    deltas.amountDelta = updateData.amount - originalTx.amount;
    deltas.newAmount = updateData.amount;
  }

  // Check payment mode change
  if (
    updateData.paymentMode !== undefined &&
    updateData.paymentMode !== originalTx.paymentMode
  ) {
    deltas.paymentModeChanged = true;
  }

  // Check cheque details change
  if (
    (updateData.chequeNumber !== undefined &&
      updateData.chequeNumber !== originalTx.chequeNumber) ||
    (updateData.chequeDate !== undefined &&
      updateData.chequeDate?.toString() !== originalTx.chequeDate?.toString())
  ) {
    deltas.chequeDetailsChanged = true;
  }

  // Check narration change
  if (
    updateData.narration !== undefined &&
    updateData.narration !== originalTx.narration
  ) {
    deltas.narrationChanged = true;
  }

  return deltas;
};


