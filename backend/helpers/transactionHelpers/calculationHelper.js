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
