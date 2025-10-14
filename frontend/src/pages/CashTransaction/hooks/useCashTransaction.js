import { useState, useCallback, useEffect } from "react";
import {

  createEmptyTransaction,

} from "../Utils/CashTransactionUtils";

export const useCashTransaction = (initialData = null) => {
  const [CashtransactionData, setCashtransactionData] = useState(
    initialData || createEmptyTransaction()
  );


   const updateCashtransactionData = useCallback((updates) => {
    setCashtransactionData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateTransactionField = useCallback((field, value) => {
    setCashtransactionData((prev) => ({ ...prev, [field]: value }));
  }, []);

   const resetCashTransactionData = useCallback(() => {
    console.log("resetCashTransactionData");
    setCashtransactionData(createEmptyTransaction());
  }, []);
    
  
  return {
    CashtransactionData,
   updateCashtransactionData,
    updateTransactionField,
    resetCashTransactionData,
   
    setCashtransactionData,
  };
};