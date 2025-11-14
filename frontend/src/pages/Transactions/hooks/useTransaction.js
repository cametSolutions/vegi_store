import { useState, useCallback, useEffect, useRef } from "react";
import {
  calculateItemAmount,
  createEmptyTransaction,
  calculateTransactionTotals,
  recalculateTransactionOnPriceLevelChange,
} from "../utils/transactionUtils";

/**
 * Custom hook for managing transaction state and operations
 * Handles transaction data, items, calculations, and user interactions
 * 
 * @param {Object} initialData - Optional initial transaction data
 * @returns {Object} Transaction state and handler functions
 */
export const useTransaction = (initialData = null) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
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

  // ============================================================================
  // REFS FOR TRACKING COMPONENT LIFECYCLE & USER ACTIONS
  // ============================================================================
  
  /**
   * Tracks if price level recalculation should be enabled
   * Starts as false, becomes true after initial data load completes
   */
  const isPriceLevelRecalcEnabled = useRef(false);

  /**
   * Stores the previous price level to detect actual changes
   */
  const previousPriceLevel = useRef(null);

  // ============================================================================
  // ITEM MANAGEMENT HANDLERS
  // ============================================================================

  const handleItemClickInItemsTable = useCallback((item) => {
    setClickedItemInTable(item);
  }, []);

  const addItem = (items, newItem) => {
    const quantity = parseFloat(newItem.quantity) || 0;
    const rate = parseFloat(newItem.rate) || 0;
    const baseAmount = quantity * rate;
    const amountAfterTax = baseAmount;

    const normalizedItem = {
      ...newItem,
      quantity: quantity.toString(),
      rate: rate.toString(),
      baseAmount: baseAmount.toString(),
      amountAfterTax: amountAfterTax.toString(),
    };

    const existingItemIndex = items.findIndex(
      (item) => item?.item === normalizedItem?.item
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems.splice(existingItemIndex, 1);
      return [normalizedItem, ...updatedItems];
    } else {
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

  // ============================================================================
  // TRANSACTION DATA HANDLERS
  // ============================================================================

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

  // ============================================================================
  // PAYMENT & DISCOUNT HANDLERS
  // ============================================================================

  const handleDiscountChange = useCallback(
    (discount) => updateTransactionField("discount", discount),
    [updateTransactionField]
  );

  const handlePaidAmountChange = useCallback(
    (paidAmount) => updateTransactionField("paidAmount", paidAmount),
    [updateTransactionField]
  );

  // ============================================================================
  // RESET & CLEAR HANDLERS
  // ============================================================================

  const clearForm = useCallback(() => {
    setTransactionData(createEmptyTransaction());
    setNewItem({ code: "", name: "", unit: "kg", qty: 0, rate: 0 });
  }, []);

  const resetTransactionData = useCallback((transactionType) => {
    console.log("Resetting transaction data for type:", transactionType);
    
    // Reset tracking refs
    isPriceLevelRecalcEnabled.current = false;
    previousPriceLevel.current = null;
    
    setTransactionData({
      ...createEmptyTransaction(),
      transactionType,
    });
  }, []);

  // ============================================================================
  // AUTOMATIC CALCULATIONS - TOTALS RECALCULATION
  // ============================================================================

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

  // ============================================================================
  // ENABLE PRICE LEVEL RECALCULATION AFTER INITIAL LOAD
  // ============================================================================

  /**
   * Enable price level recalculation after transaction data is loaded
   * This happens when:
   * 1. In create mode: after initial empty transaction setup
   * 2. In edit mode: after fetched transaction data is populated
   * 
   * We detect completion by checking if account is set (data is loaded)
   * Use a small delay to ensure all state updates are complete
   */
  useEffect(() => {
    if (transactionData.isEditMode && transactionData.account) {
      // Edit mode: Data has been loaded from API
      const timer = setTimeout(() => {
        console.log("✅ Edit mode data loaded - enabling price level recalc");
        isPriceLevelRecalcEnabled.current = true;
        previousPriceLevel.current = transactionData.priceLevel;
      }, 100); // Small delay to ensure all updates complete

      return () => clearTimeout(timer);
    } else if (!transactionData.isEditMode && transactionData.priceLevel) {
      // Create mode: Initial price level has been set
      const timer = setTimeout(() => {
        console.log("✅ Create mode initialized - enabling price level recalc");
        isPriceLevelRecalcEnabled.current = true;
        previousPriceLevel.current = transactionData.priceLevel;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [transactionData.isEditMode, transactionData.account, transactionData.priceLevel]);

  // ============================================================================
  // PRICE LEVEL RECALCULATION (ONLY AFTER INITIALIZATION)
  // ============================================================================

  /**
   * Recalculate item rates when price level changes
   * 
   * CRITICAL: Only runs after isPriceLevelRecalcEnabled is true
   * 
   * FLOW:
   * 1. Component mounts → isPriceLevelRecalcEnabled = false
   * 2. Data loads (create or edit) → isPriceLevelRecalcEnabled = true
   * 3. User changes price level → Recalculate ✅
   * 
   * This prevents recalculation during initial data population
   */
  useEffect(() => {
    // Don't run if recalculation is not enabled yet
    if (!isPriceLevelRecalcEnabled.current) {
      console.log("⏭️ Price level recalc disabled - skipping");
      return;
    }

    const currentPriceLevel = transactionData.priceLevel;
    
    // Check if price level actually changed
    if (previousPriceLevel.current !== currentPriceLevel) {
      console.log("🔄 Price level changed:", previousPriceLevel.current, "→", currentPriceLevel);
      
      // Update the reference
      previousPriceLevel.current = currentPriceLevel;
      
      // ✅ Recalculate rates
      setTransactionData((prev) =>
        recalculateTransactionOnPriceLevelChange(prev)
      );
    }
  }, [transactionData.priceLevel]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    transactionData,
    newItem,
    clickedItemInTable,
    
    // Transaction data updates
    updateTransactionData,
    updateTransactionField,
    setTransactionData,
    
    // Item form updates
    updateNewItem,
    selectProduct,
    
    // Item operations
    addItem,
    updateItemQuantity,
    removeItem,
    handleItemClickInItemsTable,
    
    // Payment & discount
    handleDiscountChange,
    handlePaidAmountChange,
    
    // Reset & clear
    clearForm,
    resetTransactionData,
  };
};
