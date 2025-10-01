// ===== EditTransaction.jsx =====
import React, { useState, useEffect } from 'react';
import TransactionTypeSelector from './components/TransactionTypeSelector';
import TransactionAccountSelector from './components/TransactionAccountSelector';
import AddItemForm from './components/AddItemForm';
import ItemsTable from './components/ItemsTable';
import TransactionSummary from './components/TransactionSummary';
import TransactionActions from './components/TransactionActions';
import {
  transactionTypes,
  products,
  getTransactionType,
  calculateItemAmount,
  calculateTotal,
  calculateNetAmount,
  calculateClosingBalance
} from './utils/transactionUtils';

const EditTransaction = ({ transactionId }) => {
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    code: '',
    name: '',
    unit: 'kg',
    qty: 0,
    rate: 0
  });

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock existing transaction data
        const mockTransaction = {
          id: transactionId || 'TXN001',
          type: 'sale',
          date: '2024-01-15',
          documentNo: '544591',
          partyType: 'customer',
          partyName: 'John Doe',
          balance: 500,
          items: [
            { code: 'V001', name: 'Tomato', unit: 'kg', qty: 5, rate: 40, amount: 200 },
            { code: 'V002', name: 'Onion', unit: 'kg', qty: 3, rate: 30, amount: 90 },
            { code: 'V003', name: 'Potato', unit: 'kg', qty: 2, rate: 25, amount: 50 }
          ],
          discount: 20,
          paidAmount: 300,
          reference: 'REF-001',
          notes: 'Regular customer order'
        };
        
        setTransactionData(mockTransaction);
      } catch (error) {
        console.error('Error fetching transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transactionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 text-lg">Transaction not found</p>
        </div>
      </div>
    );
  }

  const currentTransactionType = getTransactionType(transactionData.type);
  const total = calculateTotal(transactionData.items);
  const netAmount = calculateNetAmount(total, transactionData.discount);
  const closingBalance = calculateClosingBalance(
    transactionData.balance,
    netAmount,
    transactionData.paidAmount,
    transactionData.type
  );

  const handleTransactionTypeChange = (type) => {
    setTransactionData(prev => ({ ...prev, type }));
  };

  const handleTransactionDataChange = (updatedData) => {
    setTransactionData(updatedData);
  };

  const handleNewItemChange = (updatedItem) => {
    setNewItem(updatedItem);
  };

  const handleProductSelect = (product) => {
    setNewItem(prev => ({
      ...prev,
      code: product.code,
      name: product.name,
      rate: product.rate
    }));
  };

  const handleAddItem = () => {
    if (newItem.code && newItem.qty > 0) {
      const amount = calculateItemAmount(newItem.qty, newItem.rate);
      setTransactionData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem, amount }]
      }));
      setNewItem({ code: '', name: '', unit: 'kg', qty: 0, rate: 0 });
    }
  };

  const handleUpdateQuantity = (index, qty) => {
    setTransactionData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, qty, amount: calculateItemAmount(qty, item.rate) } : item
      )
    }));
  };

  const handleRemoveItem = (index) => {
    setTransactionData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleDiscountChange = (discount) => {
    setTransactionData(prev => ({ ...prev, discount }));
  };

  const handlePaidAmountChange = (paidAmount) => {
    setTransactionData(prev => ({ ...prev, paidAmount }));
  };

  const handleUpdate = () => {
    console.log('Updating transaction:', transactionData);
    // Implement update API call
    alert('Transaction updated successfully!');
  };

  const handleView = () => {
    console.log('Viewing transaction:', transactionData);
    // Implement view logic (maybe open in new tab or modal)
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      console.log('Deleting transaction:', transactionData);
      // Implement delete API call
      alert('Transaction deleted successfully!');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      console.log('Cancelling edit');
      // Navigate back or reset form
    }
  };

  const handlePrint = () => {
    console.log('Printing transaction:', transactionData);
    // Implement print logic
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Edit Mode Indicator */}
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                You are editing transaction <strong>{transactionData.documentNo}</strong>. Make sure to save your changes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <TransactionTypeSelector
            transactionTypes={transactionTypes}
            selectedType={transactionData.type}
            onTypeChange={handleTransactionTypeChange}
          />
        </div>

        <TransactionAccountSelector
          transactionData={transactionData}
          onTransactionChange={handleTransactionDataChange}
          currentTransactionType={currentTransactionType}
        />

        <AddItemForm
          newItem={newItem}
          onNewItemChange={handleNewItemChange}
          products={products}
          onProductSelect={handleProductSelect}
          onAddItem={handleAddItem}
        />

        <ItemsTable
          items={transactionData.items}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionSummary
            total={total}
            discount={transactionData.discount}
            onDiscountChange={handleDiscountChange}
            netAmount={netAmount}
            paidAmount={transactionData.paidAmount}
            onPaidAmountChange={handlePaidAmountChange}
            closingBalance={closingBalance}
          />

          <TransactionActions
            onSave={handleUpdate}
            onView={handleView}
            onDelete={handleDelete}
            onCancel={handleCancel}
            onPrint={handlePrint}
            isEditMode={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditTransaction;