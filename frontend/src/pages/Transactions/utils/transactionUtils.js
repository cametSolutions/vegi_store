// ==================== CONSTANTS ====================
export const transactionTypes = [
  { value: "sale", label: "Sale Invoice", icon: "ShoppingCart", color: "blue" },
  {
    value: "purchase",
    label: "Purchase Invoice",
    icon: "TrendingDown",
    color: "green",
  },
  {
    value: "credit_note",
    label: "Credit Note",
    icon: "TrendingUp",
    color: "emerald",
  },
  {
    value: "debit_note",
    label: "Debit Note",
    icon: "RefreshCw",
    color: "orange",
  },
];

export const products = [
  { itemCode: "V001", itemName: "Tomato", rate: 40 },
  { itemCode: "V002", itemName: "Onion", rate: 30 },
  { itemCode: "V003", itemName: "Potato", rate: 25 },
  { itemCode: "V004", itemName: "Carrot", rate: 45 },
  { itemCode: "V005", itemName: "Cabbage", rate: 20 },
  { itemCode: "V006", itemName: "Cauliflower", rate: 35 },
  { itemCode: "V007", itemName: "Brinjal", rate: 30 },
  { itemCode: "V008", itemName: "Okra", rate: 50 },
];

// ==================== LABEL HELPERS ====================
export const getTransactionType = (location) => {
  const pathName = location?.pathname || "";
  return pathName?.split("/")[2];

  
};

export const getPartyLabel = (transactionType) =>
  transactionType === "sale" || transactionType === "credit_note"
    ? "Customer"
    : "Supplier";

export const getDocumentLabel = (transactionType) => {
  switch (transactionType) {
    case "sale":
      return "Invoice No";
    case "purchase":
      return "Bill No";
    case "credit_note":
      return "Credit Note No";
    case "debit_note":
      return "Debit Note No";
    default:
      return "Document No";
  }
};

// ==================== ITEM CALCULATIONS ====================
export const calculateItemAmount = (qty, rate) => qty * rate;

// ==================== TRANSACTION CREATION ====================
export const createEmptyTransaction = () => ({
  transactionType: "",
  transactionDate: new Date().toISOString().split("T")[0],
  // transactionNumber: "",
  account: "",
  accountType: "customer",
  accountName: "",
  priceLevel: "",
  priceLevelName: "",
  items: [],

  // Amount breakdown totals (numeric)
  subtotal: 0, // sum of product base amounts (price * qty)
  totalTaxAmount: 0, // total tax amount summed from items
  totalAmountAfterTax: 0, // total of amounts after tax from all items(subtotal + totalTaxAmount-discountAmount)
  discount: 0, // discount % or fixed amount
  discountAmount: 0, // discount value in currency
  openingBalance: 0, // previous customer dues
  netAmount: 0, // totalAmountAfterTax - discountAmount
  totalDue: 0, // netAmount + openingBalance
  paidAmount: 0, // amount paid by customer
  balanceAmount: 0, // totalDue - paidAmount

  reference: "",
  notes: "",
});

// ==================== TRANSACTION CALCULATIONS ====================
export const calculateTransactionTotals = (transaction) => {
  console.log("heavy calculations1");

  // 1️⃣ Subtotal - Parse each item's baseAmount
  const subtotal = transaction.items.reduce(
    (sum, item) => sum + parseFloat(item?.baseAmount || 0),
    0
  );

  // 2️⃣ Total Tax Amount - Parse each item's taxAmount
  const totalTaxAmount = transaction.items.reduce(
    (sum, item) => sum + parseFloat(item?.taxAmount || 0),
    0
  );

  // 3️⃣ Amount after tax
  const totalAmountAfterTax = parseFloat(subtotal) + parseFloat(totalTaxAmount);

  // 4️⃣ Discount calculation
  let discountAmount = 0;
  const discountValue = parseFloat(transaction.discount || 0);

  if (transaction.discountType === "percent") {
    discountAmount = (parseFloat(totalAmountAfterTax) * discountValue) / 100;
  } else {
    discountAmount = discountValue; // fixed discount
  }

  // 5️⃣ Net Amount
  const netAmount =
    parseFloat(totalAmountAfterTax) - parseFloat(discountAmount);

    console.log( parseFloat(netAmount));
    console.log( parseFloat(transaction?.openingBalance || 0));
    

  /// total due
  /// if transaction type is purchase or credit note the net amount is considered as -ve value
  /// so we need to reflect that in showing total due

  const multiplier =
    transaction.transactionType === "sale" ||
    transaction.transactionType === "debit_note"
      ? 1
      : -1;

  const totalDue =
    parseFloat(netAmount*multiplier) + parseFloat(transaction?.openingBalance || 0);

  // 6️⃣ Balance Amount (NOT closing balance - just balance)
  const balanceAmount =
    parseFloat(totalDue) - parseFloat(transaction?.paidAmount || 0);

  return {
    ...transaction,
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalTaxAmount: parseFloat(totalTaxAmount.toFixed(2)),
    totalDue: parseFloat(totalDue.toFixed(2)),
    totalAmountAfterTax: parseFloat(totalAmountAfterTax.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
    balanceAmount: parseFloat(balanceAmount.toFixed(2)),
  };
};

// ==================== CLOSING BALANCE HELPER ====================
export const calculateClosingBalance = (
  openingBalance,
  netAmount,
  paidAmount,
  transactionType
) => {
  const multiplier =
    transactionType === "sale" || transactionType === "debit_note" ? 1 : -1;
  return openingBalance + netAmount * multiplier - paidAmount;
};

// ==================== RECALCULATE PRICE LEVEL  ====================
export const recalculateTransactionOnPriceLevelChange = (transaction) => {
  const selectedPriceLevelId = transaction.priceLevel;

  // update each item rate and recalc baseAmount and tax amounts
  const updatedItems = transaction.items.map((item) => {
    const priceLevelObj = item.priceLevels.find(
      (pl) => pl.priceLevel._id === selectedPriceLevelId
    );
    const newRate = priceLevelObj
      ? parseFloat(priceLevelObj.rate)
      : parseFloat(item.rate);

    const qty = parseFloat(item.quantity);
    const baseAmount = newRate * qty;

    const taxable = item.taxable;
    const taxRate = parseFloat(item.taxRate || 0);
    const taxAmount = taxable ? (baseAmount * taxRate) / 100 : 0;

    const amountAfterTax = baseAmount + taxAmount;

    return {
      ...item,
      rate: newRate,
      baseAmount,
      taxAmount,
      amountAfterTax,
    };
  });

  // update items in transaction
  const updatedTransaction = {
    ...transaction,
    items: updatedItems,
  };

  // recalc transaction totals using existing calculateTransactionTotals function
  const recalculatedTransaction =
    calculateTransactionTotals(updatedTransaction);

  return recalculatedTransaction;
};


// Utility function to convert string numbers to actual numbers
export const convertStringNumbersToNumbers=(data) =>{
  if (Array.isArray(data)) {
    return data.map(convertStringNumbersToNumbers);
  } else if (data !== null && typeof data === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertStringNumbersToNumbers(value);
    }
    return converted;
  } else if (typeof data === "string" && data.trim() !== "" && !isNaN(data)) {
    // Convert only if it’s a valid numeric string (integer or float)
    return Number(data);
  } else {
    return data;
  }
}


