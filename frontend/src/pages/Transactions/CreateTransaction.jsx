import React from "react";
import { useTransaction } from "./hooks/useTransaction";
import TransactionTypeSelector from "./components/TransactionTypeSelector";
import TransactionHeader from "./components/TransactionHeader";
import AddItemForm from "./components/AddItemForm";
import ItemsTable from "./components/ItemsTable";
import TransactionSummary from "./components/TransactionSummary";
import TransactionActions from "./components/TransactionActions";
import {
  transactionTypes,
  products,
  getTransactionTypeByValue,
  createEmptyTransaction,
  getDocumentLabel,
} from "./utils/transactionUtils";
import { useTransactionActions } from "./hooks/useTransactionActions";

const CreateTransaction = () => {
  const [transactionData, setTransactionData] = React.useState({
    ...createEmptyTransaction(),
    items: [
      {
        code: "V001",
        name: "Tomato",
        unit: "kg",
        qty: 2,
        rate: 40,
        amount: 80,
      },
      { code: "V002", name: "Onion", unit: "kg", qty: 1, rate: 30, amount: 30 },
    ],
  });

  const [newItem, setNewItem] = React.useState({
    code: "",
    name: "",
    unit: "kg",
    qty: 0,
    rate: 0,
  });

  const currentTransactionType = getTransactionTypeByValue(
    transactionData.type
  );
  const total = transactionData.items.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const netAmount = total - transactionData.discount;
  const closingBalance =
    transactionData.balance + netAmount - transactionData.paidAmount;

  const addItem = () => {
    if (newItem.name && newItem.qty > 0 && newItem.rate > 0) {
      const amount = newItem.qty * newItem.rate;
      setTransactionData({
        ...transactionData,
        items: [...transactionData.items, { ...newItem, amount }],
      });
      setNewItem({ code: "", name: "", unit: "kg", qty: 0, rate: 0 });
    }
  };

  const removeItem = (index) => {
    const newItems = transactionData.items.filter((_, i) => i !== index);
    setTransactionData({ ...transactionData, items: newItems });
  };

  const updateItemQuantity = (index, newQty) => {
    const newItems = [...transactionData.items];
    newItems[index].qty = newQty;
    newItems[index].amount = newQty * newItems[index].rate;
    setTransactionData({ ...transactionData, items: newItems });
  };

  const selectProduct = (product) => {
    setNewItem({
      ...newItem,
      code: product.code,
      name: product.name,
      rate: product.rate,
    });
  };

  const handleSave = () => console.log("Save transaction");
  const handleView = () => console.log("View transaction");
  const handleDelete = () => console.log("Delete transaction");
  const handleCancel = () => console.log("Cancel transaction");
  const handlePrint = () => console.log("Print transaction");

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <currentTransactionType.icon className="text-white w-5 h-5" />
            </div>
            Transaction Manager
          </h1>
          <div className="text-sm text-slate-500">
            {getDocumentLabel(transactionData.type)}:{" "}
            <span className="font-semibold text-slate-700">
              {transactionData.documentNo}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          <TransactionHeader
            transactionData={transactionData}
            onTransactionChange={setTransactionData}
            currentTransactionType={currentTransactionType}
          />

          <AddItemForm
            newItem={newItem}
            onNewItemChange={setNewItem}
            products={products}
            onProductSelect={selectProduct}
            onAddItem={addItem}
          />

          <ItemsTable
            items={transactionData.items}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItem}
          />
        </div>

        {/* Right Panel */}
        <div className="w-80 p-4 bg-slate-100 border-l">
          <TransactionSummary
            total={total}
            discount={transactionData.discount}
            onDiscountChange={(discount) =>
              setTransactionData({ ...transactionData, discount })
            }
            netAmount={netAmount}
            paidAmount={transactionData.paidAmount}
            onPaidAmountChange={(paidAmount) =>
              setTransactionData({ ...transactionData, paidAmount })
            }
            closingBalance={closingBalance}
          />

          <TransactionActions
            onSave={handleSave}
            onView={handleView}
            onDelete={handleDelete}
            onCancel={handleCancel}
            onPrint={handlePrint}
            isEditMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTransaction;
