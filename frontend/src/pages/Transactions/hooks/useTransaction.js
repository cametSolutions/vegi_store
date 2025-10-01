import { useState, useCallback, useEffect } from "react";
import {
  calculateItemAmount,
  createEmptyTransaction,
  calculateTransactionTotals,
} from "../utils/transactionUtils";

export const useTransaction = (initialData = null) => {
  const [transactionData, setTransactionData] = useState(
    initialData || createEmptyTransaction()
  );

  const [newItem, setNewItem] = useState({
    code: "",
    name: "",
    unit: "kg",
    qty: 0,
    rate: 0,
  });

  // ===================== UPDATE TOTALS AUTOMATICALLY =====================
  useEffect(() => {
    setTransactionData((prev) => calculateTransactionTotals(prev));
  }, [
    transactionData.items,
    transactionData.discount,
    transactionData.discountType,
    transactionData.openingBalance,
    transactionData.paidAmount,
    transactionData.taxRate,
  ]);

  // ===================== TRANSACTION HANDLERS =====================
  const updateTransactionData = useCallback((updates) => {
    setTransactionData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateTransactionField = useCallback((field, value) => {
    setTransactionData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNewItem = useCallback((updates) => {
    setNewItem((prev) => ({ ...prev, ...updates }));
  }, []);

  const selectProduct = useCallback((product) => {
    setNewItem((prev) => ({
      ...prev,
      code: product.code,
      name: product.name,
      rate: product.rate,
    }));
  }, []);

  const addItem = useCallback(() => {
    if (newItem.code && newItem.qty > 0) {
      const amount = calculateItemAmount(newItem.qty, newItem.rate);
      setTransactionData((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem, amount }],
      }));
      setNewItem({ code: "", name: "", unit: "kg", qty: 0, rate: 0 });
      return true;
    }
    return false;
  }, [newItem]);

  const updateItemQuantity = useCallback((index, qty) => {
    setTransactionData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? { ...item, qty, amount: calculateItemAmount(qty, item.rate) }
          : item
      ),
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setTransactionData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const clearForm = useCallback(() => {
    setTransactionData(createEmptyTransaction());
    setNewItem({ code: "", name: "", unit: "kg", qty: 0, rate: 0 });
  }, []);

  const handleDiscountChange = useCallback(
    (discount) => updateTransactionField("discount", discount),
    [updateTransactionField]
  );

  const handlePaidAmountChange = useCallback(
    (paidAmount) => updateTransactionField("paidAmount", paidAmount),
    [updateTransactionField]
  );

  return {
    transactionData, // ⚡ always contains updated totals
    newItem,

    updateTransactionData,
    updateTransactionField,
    updateNewItem,
    selectProduct,
    addItem,
    updateItemQuantity,
    removeItem,
    handleDiscountChange,
    handlePaidAmountChange,
    clearForm,
    setTransactionData,
  };
};
