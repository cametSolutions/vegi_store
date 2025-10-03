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
  { code: "V001", name: "Tomato", rate: 40 },
  { code: "V002", name: "Onion", rate: 30 },
  { code: "V003", name: "Potato", rate: 25 },
  { code: "V004", name: "Carrot", rate: 45 },
  { code: "V005", name: "Cabbage", rate: 20 },
  { code: "V006", name: "Cauliflower", rate: 35 },
  { code: "V007", name: "Brinjal", rate: 30 },
  { code: "V008", name: "Okra", rate: 50 },
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
  transactionType: "sale",
  transactionDate: new Date().toISOString().split("T")[0],
  transactionNumber: "",
  accountType: "customer",
  accountName: "",
  items: [],

  // Amount breakdown
  subtotal: 0, // sum of product amounts (price * qty)
  taxableAmount: 0, // subtotal of taxable products
  taxAmount: 0, // total tax on taxableAmount
  amountAfterTax: 0, // subtotal + taxAmount
  discount: 0, // discount % or fixed amount
  discountAmount: 0, // discount value
  openingBalance: 0, // previous dues of customer
  netAmount: 0, // amountAfterTax - discountAmount + openingBalance
  paidAmount: 0, // amount paid by customer
  closingBalanceAmount: 0, // netAmount - paidAmount

  reference: "",
  notes: "",
});

// ==================== TRANSACTION CALCULATIONS ====================
export const calculateTransactionTotals = (transaction) => {
  console.log("heavy calculations1");

  // 1️⃣ Subtotal
  const subtotal = transaction.items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // 2️⃣ Taxable Amount (default taxable = true)
  const taxableAmount = transaction.items
    .filter((item) => item.taxable !== false)
    .reduce((sum, item) => sum + item.amount, 0);

  // 3️⃣ Tax Amount
  const taxRate = transaction.taxRate || 0;
  const taxAmount = (taxableAmount * taxRate) / 100;

  // 4️⃣ Amount after tax
  const amountAfterTax = subtotal + taxAmount;

  // 5️⃣ Discount
  let discountAmount = 0;
  if (transaction.discountType === "percent") {
    discountAmount = (amountAfterTax * transaction.discount) / 100;
  } else {
    discountAmount = transaction.discount; // fixed discount
  }

  // 6️⃣ Net Amount
  const netAmount =
    amountAfterTax - discountAmount + transaction.openingBalance;

  // 7️⃣ Closing Balance
  const closingBalanceAmount = netAmount - transaction.paidAmount;

  return {
    ...transaction,
    subtotal,
    taxableAmount,
    taxAmount,
    amountAfterTax,
    discountAmount,
    netAmount,
    closingBalanceAmount,
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

// ==================== REACT-HOOK FRIENDLY MEMOIZED CALC ====================
import { useMemo } from "react";


export const useTransactionTotals = (transaction) => {
  return useMemo(() => {
    console.log("heavy calculations2"); // runs only when transaction changes
    return calculateTransactionTotals(transaction);
  }, [transaction.openingBalance]);
};
