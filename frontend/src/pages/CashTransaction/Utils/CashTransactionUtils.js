export const transactionTypes = [
  { value: "receipt" , label: "Reciept Invoice", icon: "ShoppingCart", color: "blue" },
  {
    value: "purchase",
    label: "Purchase Invoice",
    icon: "TrendingDown",
    color: "green",
  },
  {
    value: "sales_return",
    label: "Sales Return",
    icon: "TrendingUp",
    color: "emerald",
  },
  {
    value: "purchase_return",
    label: "Purchase Return",
    icon: "RefreshCw",
    color: "orange",
  },
];
export const getTransactionType = (location) => {
  const pathName = location?.pathname || "";
  return pathName?.split("/")[2];
};
export const createEmptyTransaction = (transactionType) => ({
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
    paymentMode: 'cash',
    transactionDate: new Date().toISOString().split("T")[0],
    transactionType: transactionType??'receipt',
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