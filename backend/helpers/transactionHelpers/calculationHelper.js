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

/// to manage same item adding multiple times in transaction, we can aggregate them by item id and sum up quantity and amount
const aggregateItemsByItemId = (items) => {
  const map = new Map();

  for (const item of items) {
    const id = item.item.toString();

    if (!map.has(id)) {
      map.set(id, {
        item: item.item,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,

        quantity: Number(item.quantity),
        amount: Number(item.baseAmount || 0),
      });
    } else {
      const existing = map.get(id);
      existing.quantity += Number(item.quantity);
      existing.amount += Number(item.baseAmount || 0);
    }
  }

  return map;
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
export const calculateDiscountAmount = (
  amount,
  discount,
  isPercentage = false,
) => {
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

  // Account changed?
  const accountChanged =
    original.account.toString() !== updated.account.toString();

  // Date changed?
  const originalDate = new Date(original.transactionDate);
  const updatedDate = new Date(updated.transactionDate);
  const dateChanged = originalDate.getTime() !== updatedDate.getTime();

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

    // NEW: date change info
    dateChange: {
      hasChange: dateChanged,
      oldDate: originalDate,
      newDate: updatedDate,
    },
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

  // 🔥 Aggregate duplicates by itemId using weighted average
  const aggregate = (items) => {
    const map = new Map();

    items.forEach((item) => {
      const itemId = item.item.toString();

      const qty = Number(item.quantity);
      const amount = Number(item.baseAmount || qty * item.rate);

      if (!map.has(itemId)) {
        map.set(itemId, {
          item: item.item,
          itemName: item.itemName,
          itemCode: item.itemCode,
          unit: item.unit,

          quantity: qty,
          totalAmount: amount,
        });
      } else {
        const existing = map.get(itemId);
        existing.quantity += qty;
        existing.totalAmount += amount;
      }
    });

    // Convert totalAmount → avgRate
    map.forEach((v) => {
      v.rate =
        v.quantity > 0
          ? Number((v.totalAmount / v.quantity))
          : 0;
    });

    return map;
  };

  const originalMap = aggregate(originalItems);
  const updatedMap = aggregate(updatedItems);

  // 1) New & Changed
  updatedMap.forEach((updatedItem, itemId) => {
    const originalItem = originalMap.get(itemId);

    if (!originalItem) {
      deltas.push({
        item: updatedItem.item,
        itemName: updatedItem.itemName,
        itemCode: updatedItem.itemCode,
        unit: updatedItem.unit,

        quantityDelta: updatedItem.quantity,
        isNew: true,
        isRemoved: false,

        oldRate: 0,
        newRate: updatedItem.rate,
        rateDelta: updatedItem.rate,

        changeType: "added",
      });
    } else {
      const quantityDelta =
        updatedItem.quantity - originalItem.quantity;

      const rateDelta =
        updatedItem.rate - originalItem.rate;

      if (quantityDelta !== 0 || rateDelta !== 0) {
        let changeType = null;

        if (quantityDelta !== 0 && rateDelta !== 0) {
          changeType = "quantity_and_rate_changed";
        } else if (quantityDelta !== 0) {
          changeType = "quantity_changed";
        } else {
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

  // 2) Removed
  originalMap.forEach((originalItem, itemId) => {
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
        rateDelta: -originalItem.rate,

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
  if (
    updateData.amount !== undefined &&
    updateData.amount !== originalTx.amount
  ) {
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
