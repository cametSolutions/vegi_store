export const transactionTypes = [
  { value: "reciept", label: "Reciept Invoice", icon: "ShoppingCart", color: "blue" },
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
export const getTransactionType = (location) => {
  const pathName = location?.pathname || "";
  return pathName?.split("/")[2];
};
export const createEmptyTransaction = () => ({
    accountName: '',
     transactionNumber: "",
  accountType: "customer",
    amount: '',
    previousBalanceAmount: '',
    narration: '',
    closingBalanceAmount: '',

     chequeNumber: '',
    bank: '',
    description: '',
    paymentMode: 'cheque',
    transactionDate: new Date().toISOString().split("T")[0],
    transactionType: "reciept",
});