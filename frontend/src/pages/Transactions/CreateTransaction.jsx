import React from 'react';
import { useTransaction } from './hooks/useTransaction';
import TransactionTypeSelector from './components/TransactionTypeSelector';
import TransactionHeader from './components/TransactionHeader';
import AddItemForm from './components/AddItemForm';
import ItemsTable from './components/ItemsTable';
import TransactionSummary from './components/TransactionSummary';
import TransactionActions from './components/TransactionActions';
import { transactionTypes, products, getTransactionTypeByValue, createEmptyTransaction } from './utils/transactionUtils';
import { useTransactionActions } from './hooks/useTransactionActions';


const CreateTransaction = () => {
  const transaction = useTransaction({
    // Initialize with some demo data
    ...createEmptyTransaction(),
    items: [
      { code: 'V001', name: 'Tomato', unit: 'kg', qty: 2, rate: 40, amount: 80 },
      { code: 'V002', name: 'Onion', unit: 'kg', qty: 1, rate: 30, amount: 30 }
    ]
  });

  const actions = useTransactionActions(transaction.transactionData, false);
  const currentTransactionType = getTransactionTypeByValue(transaction.transactionData.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="px-2 mx-auto">
        {/* <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <TransactionTypeSelector
            transactionTypes={transactionTypes}
            selectedType={transaction.transactionData.type}
            onTypeChange={transaction.updateTransactionType}
          />
        </div> */}

        <TransactionHeader
          transactionData={transaction.transactionData}
          onTransactionChange={transaction.updateTransactionData}
          currentTransactionType={currentTransactionType}
        />

        <AddItemForm
          newItem={transaction.newItem}
          onNewItemChange={transaction.updateNewItem}
          products={products}
          onProductSelect={transaction.selectProduct}
          onAddItem={transaction.addItem}
        />

        <ItemsTable
          items={transaction.transactionData.items}
          onUpdateQuantity={transaction.updateItemQuantity}
          onRemoveItem={transaction.removeItem}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionSummary
            total={transaction.total}
            discount={transaction.transactionData.discount}
            onDiscountChange={transaction.updateDiscount}
            netAmount={transaction.netAmount}
            paidAmount={transaction.transactionData.paidAmount}
            onPaidAmountChange={transaction.updatePaidAmount}
            closingBalance={transaction.closingBalance}
          />

          <TransactionActions
            onSave={actions.handleSave}
            onView={actions.handleView}
            onDelete={actions.handleDelete}
            onCancel={actions.handleCancel}
            onPrint={actions.handlePrint}
            isEditMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTransaction;