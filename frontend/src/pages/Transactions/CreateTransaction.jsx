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
import { Calendar } from "lucide-react";

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
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            {/* <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <currentTransactionType.icon className="text-white w-4 h-4" />
            </div> */}
            Sales
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-4">
            {/* Date Section */}
            <div className="flex items-center gap-2">
              <label className="flex items-center text-[9px] font-medium text-slate-700">
                <Calendar className="inline w-3 h-3 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={transactionData.date}
                onChange={(e) =>
                  onTransactionChange({
                    ...transactionData,
                    date: e.target.value,
                  })
                }
                className="px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Document Section */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-700">
                {getDocumentLabel(transactionData.type)}:
              </span>
              <span className="font-semibold text-slate-700 text-[9px]">
                {transactionData.documentNo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Panel */}
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
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
          </div>

          {/* Items table should stretch + scroll if needed */}
          <div className="flex-1 ">
            <ItemsTable
              items={transactionData.items}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
            />

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
    </div>
  );
};

export default CreateTransaction;
