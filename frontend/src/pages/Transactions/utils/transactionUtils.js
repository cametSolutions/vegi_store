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

export const unitOptions = [
  { value: "kg", label: "kg" },
  { value: "piece", label: "piece" },
  { value: "dozen", label: "dozen" },
  { value: "liter", label: "liter" },
  { value: "box", label: "box" },
];

export const getTransactionType = (location) => {
  const pathName = location?.pathname || "";
  const transactionType = pathName?.split("/")[2];
  return transactionType;
};

export const getPartyLabel = (transactionType) => {
  return transactionType === "sale" || transactionType === "credit_note"
    ? "Customer"
    : "Supplier";
};

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

export const calculateItemAmount = (qty, rate) => {
  return qty * rate;
};

export const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateNetAmount = (total, discount) => {
  return total - discount;
};

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

export const createEmptyTransaction = () => ({
  type: "sale",
  date: new Date().toISOString().split("T")[0],
  documentNo: generateDocumentNo(),
  accountType: "customer",
  accountName: "",
  balance: 0,
  items: [],
  discount: 0,
  paidAmount: 0,
  reference: "",
  notes: "",
});

export const generateDocumentNo = () => {
  return Math.floor(Math.random() * 900000) + 100000;
};
