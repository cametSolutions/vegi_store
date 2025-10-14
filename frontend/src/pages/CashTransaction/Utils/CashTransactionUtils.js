export const transactionTypes = [
  { value: "receipt" , label: "Reciept Invoice", icon: "ShoppingCart", color: "blue" },
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
    //  transactionNumber: "",
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
    transactionType: 'receipt',
});
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