// utils/stockAdjustmentUtils.js

// ==================== CONSTANTS ====================
export const adjustmentTypes = [
  { value: "add", label: "Add Stock", icon: "Plus", color: "green" },
  { value: "remove", label: "Remove Stock", icon: "Minus", color: "red" },
];

export const adjustmentReasons = [
  { value: "damage", label: "Damaged Goods" },
  { value: "theft", label: "Theft/Loss" },
  { value: "expired", label: "Expired Items" },
  { value: "correction", label: "Stock Correction" },
  { value: "audit", label: "Audit Adjustment" },
  { value: "return", label: "Customer Return (Non-saleable)" },
  { value: "other", label: "Other" },
];

// ==================== STOCK ADJUSTMENT CREATION ====================
// utils/stockAdjustmentUtils.js

export const createEmptyStockAdjustment = () => ({
  transactionDate: new Date().toISOString().split("T")[0],
  adjustmentType: "add", // "add" or "remove"
  items: [],
  totalAmount: 0,

  // Edit mode details
  isEditMode: false,
  editAdjustmentId: null,
});

export const calculateStockAdjustmentTotals = (adjustment) => {
  console.log("Calculating stock adjustment totals");

  // Calculate total amount from all items
  const totalAmount = adjustment.items.reduce((sum, item) => {
    const amount = parseFloat(item?.amountAfterTax || item?.baseAmount || 0);
    return sum + amount;
  }, 0);

  return {
    ...adjustment,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

export const convertStringNumbersToNumbers = (data) => {
  if (Array.isArray(data)) {
    return data.map(convertStringNumbersToNumbers);
  } else if (data !== null && typeof data === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertStringNumbersToNumbers(value);
    }
    return converted;
  } else if (typeof data === "string" && data.trim() !== "" && !isNaN(data)) {
    return Number(data);
  } else {
    return data;
  }
};
