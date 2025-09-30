import React, { useMemo } from "react";
import TransactionAccountSelector from "./components/TransactionAccountSelector";
import AddItemForm from "./components/AddItemForm";
import ItemsTable from "./components/ItemsTable";
import TransactionSummary from "./components/TransactionSummary";
import TransactionActions from "./components/TransactionActions";
import TransactionHeader from "./components/TransactionHeader";
import { products, getTransactionType } from "./utils/transactionUtils";
import { useTransaction } from "./hooks/useTransaction";
import { useTransactionActions } from "./hooks/useTransactionActions";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const CreateTransaction = () => {
  const location = useLocation();

  // Use the centralized transaction hook
  const {
    transactionData,
    newItem,
    total,
    netAmount,
    closingBalance,
    updateTransactionData,
    updateTransactionField,
    updateNewItem,
    selectProduct,
    addItem,
    updateItemQuantity,
    removeItem,
  } = useTransaction();

  // Get current transaction type from location or state
  const currentTransactionType = useMemo(
    () => getTransactionType(location, transactionData.type),
    [location, transactionData.type]
  );

  /// to get company and branch form store
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  return (
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <TransactionHeader
        currentTransactionType={currentTransactionType}
        transactionData={transactionData}
        updateTransactionField={updateTransactionField}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Panel */}
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
            <TransactionAccountSelector
              transactionData={transactionData}
              updateTransactionField={updateTransactionField}
              updateTransactionData={updateTransactionData}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
            />

            <AddItemForm
              newItem={newItem}
              onNewItemChange={updateNewItem}
              products={products}
              onProductSelect={selectProduct}
              onAddItem={addItem}
            />
          </div>

          {/* Items table with flexible height and scrolling */}
          <div className="flex-1">
            <ItemsTable
              items={transactionData.items}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
            />

            <TransactionSummary
              total={total}
              discount={transactionData.discount}
              onDiscountChange={(discount) =>
                updateTransactionField("discount", discount)
              }
              netAmount={netAmount}
              paidAmount={transactionData.paidAmount}
              onPaidAmountChange={(paidAmount) =>
                updateTransactionField("paidAmount", paidAmount)
              }
              closingBalance={closingBalance}
            />

            <TransactionActions
              onSave={useTransactionActions?.handleSave}
              onView={useTransactionActions?.handleView}
              onDelete={useTransactionActions?.handleDelete}
              onCancel={useTransactionActions?.handleCancel}
              onPrint={useTransactionActions?.handlePrint}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTransaction;
