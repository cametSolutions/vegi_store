import { useState, useCallback } from 'react';
import {
  calculateItemAmount,
  calculateTotal,
  calculateNetAmount,
  calculateClosingBalance,
  createEmptyTransaction
} from '../utils/transactionUtils';

export const useTransaction = (initialData = null) => {
  const [transactionData, setTransactionData] = useState(
    initialData || createEmptyTransaction()
  );
  
  const [newItem, setNewItem] = useState({
    code: '',
    name: '',
    unit: 'kg',
    qty: 0,
    rate: 0
  });

  // Calculated values
  const total = calculateTotal(transactionData.items);
  const netAmount = calculateNetAmount(total, transactionData.discount);
  const closingBalance = calculateClosingBalance(
    transactionData.balance,
    netAmount,
    transactionData.paidAmount,
    transactionData.type
  );

  // Transaction data handlers
  const updateTransactionData = useCallback((updates) => {
    setTransactionData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTransactionType = useCallback((type) => {
    setTransactionData(prev => ({ ...prev, type }));
  }, []);

  const updateDiscount = useCallback((discount) => {
    setTransactionData(prev => ({ ...prev, discount }));
  }, []);

  const updatePaidAmount = useCallback((paidAmount) => {
    setTransactionData(prev => ({ ...prev, paidAmount }));
  }, []);

  // Item management handlers
  const updateNewItem = useCallback((updates) => {
    setNewItem(prev => ({ ...prev, ...updates }));
  }, []);

  const selectProduct = useCallback((product) => {
    setNewItem(prev => ({
      ...prev,
      code: product.code,
      name: product.name,
      rate: product.rate
    }));
  }, []);

  const addItem = useCallback(() => {
    if (newItem.code && newItem.qty > 0) {
      const amount = calculateItemAmount(newItem.qty, newItem.rate);
      setTransactionData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem, amount }]
      }));
      setNewItem({ code: '', name: '', unit: 'kg', qty: 0, rate: 0 });
      return true;
    }
    return false;
  }, [newItem]);

  const updateItemQuantity = useCallback((index, qty) => {
    setTransactionData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, qty, amount: calculateItemAmount(qty, item.rate) } : item
      )
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setTransactionData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const clearForm = useCallback(() => {
    setTransactionData(createEmptyTransaction());
    setNewItem({ code: '', name: '', unit: 'kg', qty: 0, rate: 0 });
  }, []);

  return {
    // State
    transactionData,
    newItem,
    
    // Calculated values
    total,
    netAmount,
    closingBalance,
    
    // Transaction handlers
    updateTransactionData,
    updateTransactionType,
    updateDiscount,
    updatePaidAmount,
    
    // Item handlers
    updateNewItem,
    selectProduct,
    addItem,
    updateItemQuantity,
    removeItem,
    
    // Utility
    clearForm,
    setTransactionData // For external data loading
  };
};
