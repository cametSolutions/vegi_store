import { useState, useCallback, useEffect } from "react";
import {

  createEmptyTransaction,

} from "../Utils/CashTransactionUtils";

export const useCashTransaction = (initialData = null) => {
  const [transactionData, setTransactionData] = useState(
    initialData || createEmptyTransaction()
  );


   const updateTransactionData = useCallback((updates) => {
    setTransactionData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateTransactionField = useCallback((field, value) => {
    setTransactionData((prev) => ({ ...prev, [field]: value }));
  }, []);

    return {
    transactionData,
   updateTransactionData,
    updateTransactionField,
   
    setTransactionData,
  };
};