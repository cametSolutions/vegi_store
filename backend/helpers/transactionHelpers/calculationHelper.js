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
export const calculateStockDeltas = (originalItems, updatedItems) => {
  const deltas = [];

  // Create maps for easy lookup
  const originalMap = new Map(
    originalItems.map((item) => [item.item.toString(), item])
  );
  const updatedMap = new Map(
    updatedItems.map((item) => [item.item.toString(), item])
  );

  // Find items in updated but not in original (NEW items)
  updatedItems.forEach((updatedItem) => {
    const itemId = updatedItem.item.toString();
    const originalItem = originalMap.get(itemId);

    if (!originalItem) {
      // New item added
      deltas.push({
        item: updatedItem.item,
        itemName: updatedItem.itemName,
        itemCode: updatedItem.itemCode,
        unit: updatedItem.unit,
        quantityDelta: updatedItem.quantity, // Full quantity (new item)
        isNew: true,
      });
    } else {
      // Item exists - check quantity change
      const quantityDelta = updatedItem.quantity - originalItem.quantity;

      if (quantityDelta !== 0) {
        deltas.push({
          item: updatedItem.item,
          itemName: updatedItem.itemName,
          itemCode: updatedItem.itemCode,
          unit: updatedItem.unit,
          quantityDelta,
          isNew: false,
        });
      }
    }
  });

  // Find items removed (in original but not in updated)
  originalItems.forEach((originalItem) => {
    const itemId = originalItem.item.toString();
    if (!updatedMap.has(itemId)) {
      // Item removed
      deltas.push({
        item: originalItem.item,
        itemName: originalItem.itemName,
        itemCode: originalItem.itemCode,
        unit: originalItem.unit,
        quantityDelta: -originalItem.quantity, // Negative (removing)
        isRemoved: true,
      });
    }
  });

  return deltas;
};

