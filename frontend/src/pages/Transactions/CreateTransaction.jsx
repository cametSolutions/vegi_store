import React, { useEffect, useMemo, useCallback } from "react";
import TransactionAccountSelectorComponent from "./components/TransactionAccountSelector";
import AddItemFormComponent from "./components/AddItemForm";
import ItemsTableComponent from "./components/ItemsTable";
import TransactionSummaryComponent from "./components/TransactionSummary";
import TransactionActionsComponent from "./components/TransactionActions";
import TransactionHeaderComponent from "./components/TransactionHeader";
import { products, getTransactionType } from "./utils/transactionUtils";
import { useTransaction } from "./hooks/useTransaction";
import { useTransactionActions } from "./hooks/useTransactionActions";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const TransactionAccountSelector = React.memo(
  TransactionAccountSelectorComponent
);
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const TransactionSummary = React.memo(TransactionSummaryComponent);
const TransactionActions = React.memo(TransactionActionsComponent);

const CreateTransaction = () => {
  const location = useLocation();

  const {
    transactionData,
    newItem,
    updateTransactionData,
    updateTransactionField,
    updateNewItem,
    selectProduct,
    addItem,
    updateItemQuantity,
    removeItem,
    setTransactionData,
    handleDiscountChange,
    handlePaidAmountChange,
  } = useTransaction();

  const currentTransactionType = useMemo(
    () => getTransactionType(location, transactionData.type),
    [location, transactionData.type]
  );

  useEffect(() => {
    updateTransactionField("currentTransactionType", currentTransactionType);
  }, [currentTransactionType, updateTransactionField]);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Recalculate totals automatically
  // useEffect(() => {
  //   setTransactionData((prev) => calculateTransactionTotals(prev));
  // }, [
  //   transactionData.openingBalance,
  //   // transactionData.items,
  //   // transactionData.discount,
  //   // transactionData.discountType,
  //   // transactionData.paidAmount,
  //   // transactionData.taxRate,
  //   setTransactionData,
  // ]);

  console.log("transactionData", transactionData);

  // Memoized callbacks to prevent child re-renders

  return (
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <TransactionHeader
        currentTransactionType={currentTransactionType}
        date={transactionData.transactionDate}
        updateTransactionField={updateTransactionField}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
            <TransactionAccountSelector
              accountType={transactionData?.accountType}
              accountName={transactionData?.accountName}
              openingBalance={transactionData?.openingBalance}
              accountId={transactionData?.accountId}
              // transactionData={transactionData}
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

          <div className="flex-1">
            <ItemsTable
              items={transactionData.items}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
            />

            <TransactionSummary
              total={transactionData.total}
              netAmount={transactionData.netAmount}
              discount={transactionData.discount}
              paidAmount={transactionData.paidAmount}
              onDiscountChange={handleDiscountChange}
              onPaidAmountChange={handlePaidAmountChange}
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
