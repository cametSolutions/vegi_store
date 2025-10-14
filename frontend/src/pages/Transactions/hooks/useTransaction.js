import { useState, useCallback, useEffect } from "react";
import {
  calculateItemAmount,
  createEmptyTransaction,
  calculateTransactionTotals,
  recalculateTransactionOnPriceLevelChange,
} from "../utils/transactionUtils";
import { set } from "zod";

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

  const [clickedItemInTable, setClickedItemInTable] = useState(null);

  ///handle itemClick from the items table and pass it to item adding form for edit////

  const handleItemClickInItemsTable = useCallback((item) => {
    setClickedItemInTable(item);
  }, []);

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

  // Utility function to handle adding/updating items
  const addItem = (items, newItem) => {
    // Convert quantity and rate to numbers
    const quantity = parseFloat(newItem.quantity) || 0;
    const rate = parseFloat(newItem.rate) || 0;
    const baseAmount = quantity * rate;
    const amountAfterTax = baseAmount; //// currently assuming no tax

    const normalizedItem = {
      ...newItem,
      quantity: quantity.toString(), // for consistent input field use
      rate: rate.toString(),
      baseAmount: baseAmount.toString(),
      amountAfterTax: amountAfterTax.toString(),
    };

    // Check for item existence
    const existingItemIndex = items.findIndex(
      (item) => item?.item === normalizedItem?.item
    );

    if (existingItemIndex !== -1) {
      // Update and move to top
      const updatedItems = [...items];
      updatedItems.splice(existingItemIndex, 1);
      return [normalizedItem, ...updatedItems];
    } else {
      // Add new item to top
      return [normalizedItem, ...items];
    }
  };

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

  const resetTransactionData = useCallback(() => {
    console.log("resetting transaction data");
    setTransactionData(createEmptyTransaction());
  }, []);

  /// ===================== UPDATE TOTALS AUTOMATICALLY =====================
  useEffect(() => {
    setTransactionData((prev) =>
      recalculateTransactionOnPriceLevelChange(prev)
    );
  }, [transactionData.priceLevel]);

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
    clickedItemInTable,
    handleItemClickInItemsTable,
    resetTransactionData,
    
  };
};
