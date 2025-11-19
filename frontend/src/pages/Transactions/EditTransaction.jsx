import React, { useEffect, useMemo, useState } from "react";
import TransactionAccountSelectorComponent from "./components/TransactionAccountSelector";
import AddItemFormComponent from "./components/AddItemForm";
import ItemsTableComponent from "./components/ItemsTable";
import TransactionSummaryComponent from "./components/TransactionSummary";
import TransactionActionsComponent from "./components/TransactionActions";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader"; // Import the loader
import { getTransactionType } from "./utils/transactionUtils";
import { useTransaction } from "./hooks/useTransaction";
import { useTransactionActions } from "./hooks/useTransactionActions";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { transactionQueries } from "@/hooks/queries/transaction.queries";
import { toast } from "sonner";
import {
  addTransactionDataToStore,
  removeTransactionDataFromStore,
} from "@/store/slices/transactionSlice";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const TransactionAccountSelector = React.memo(
  TransactionAccountSelectorComponent
);

///
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const TransactionSummary = React.memo(TransactionSummaryComponent);
const TransactionActions = React.memo(TransactionActionsComponent);

const EditTransaction = ({ editTransactionData, handleCancelEdit }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const {
    transactionData,
    updateTransactionData,
    updateTransactionField,
    updateItemQuantity,
    removeItem,
    handleDiscountChange,
    handlePaidAmountChange,
    addItem,
    clickedItemInTable,
    handleItemClickInItemsTable,
    resetTransactionData,
  } = useTransaction();
  const dispatch = useDispatch();

  //// get current transaction type from the url////
  const currentTransactionType = useMemo(
    () => getTransactionType(location),
    [location]
  );

  ////  for adding transaction type to the transaction data when the component loads or when the transaction type changes////
  useEffect(() => {
    resetTransactionData(currentTransactionType);
    //// add to global state that edit mode is true and the transaction id
    updateTransactionData({
      isEditMode: true,
      editTransactionId: editTransactionData._id,
      transactionType: currentTransactionType,
    });
  }, [currentTransactionType, updateTransactionField]);

  // Reset transaction data when navigating away from this page
  useEffect(() => {
    return () => {
      resetTransactionData(currentTransactionType);
    };
  }, [resetTransactionData]);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  //// fetch the details of the tns for which we need the edit to be done///
  const {
    data: transactionResponse,
    isLoading: transactionLoading,
    isError: transactionError,
  } = useQuery({
    ...transactionQueries.getTransactionById(
      selectedCompanyFromStore._id,
      selectedBranchFromStore._id,
      editTransactionData._id,
      currentTransactionType
    ),
  });

  /// update the transaction data when the transaction response changes
  useEffect(() => {
    if (transactionResponse) {
      updateTransactionData(transactionResponse);

      //// this is to  prevent the navigation in the nav bar when we are in edit mode
      dispatch(
        addTransactionDataToStore({
          isEditMode: true,
          editTransactionId: editTransactionData._id,
          transactionType: currentTransactionType,
        })
      );
    }
  }, [transactionResponse, updateTransactionData]);

  // Handle error state with useEffect
  useEffect(() => {
    if (transactionError) {
      toast.error("An error occurred while loading transaction details");
      handleCancel();
    }
  }, [transactionError]);

  const handleCancel = () => {
    resetTransactionData(currentTransactionType);
    handleCancelEdit();
    dispatch(removeTransactionDataFromStore());
  };

  return (
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
      {/* Loader Overlay */}
      {(isLoading || transactionLoading) && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

      {/* Header */}
      <TransactionHeader
        currentTransactionType={currentTransactionType}
        date={transactionData.transactionDate}
        updateTransactionField={updateTransactionField}
        isEditMode={transactionData.isEditMode}
        transactionNumber={editTransactionData.transactionNumber}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
            <TransactionAccountSelector
              accountType={transactionData?.accountType}
              accountName={transactionData?.accountName}
              openingBalance={transactionData?.openingBalance}
              account={transactionData?.account}
              transactionType={transactionData?.transactionType}
              priceLevel={transactionData?.priceLevel}
              priceLevelName={transactionData?.priceLevelName}
              // transactionData={transactionData}
              updateTransactionField={updateTransactionField}
              updateTransactionData={updateTransactionData}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
            />

            <AddItemForm
              items={transactionData?.items}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
              priceLevel={transactionData?.priceLevel}
              updateTransactionField={updateTransactionField}
              addItem={addItem}
              clickedItemInTable={clickedItemInTable}
              transactionType={transactionData?.transactionType}
            />
          </div>

          <div className="flex-1">
            <ItemsTable
              items={transactionData?.items}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
              handleItemClickInItemsTable={handleItemClickInItemsTable}
            />

            <TransactionSummary
              total={transactionData.subtotal}
              netAmount={transactionData.netAmount}
              discount={transactionData.discount}
              paidAmount={transactionData.paidAmount}
              balanceAmount={transactionData.balanceAmount}
              totalDue={transactionData.totalDue}
              onDiscountChange={handleDiscountChange}
              onPaidAmountChange={handlePaidAmountChange}
              transactionType={transactionData.transactionType}
            />

            <TransactionActions
              onSave={useTransactionActions?.handleSave}
              transactionData={transactionData}
              onLoadingChange={setIsLoading}
              resetTransactionData={resetTransactionData}
              isEditMode={true}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransaction;
