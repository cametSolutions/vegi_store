import React, { useEffect, useState } from "react";
import AddItemFormComponent from "../Transactions/components/AddItemForm";
import ItemsTableComponent from "../Transactions/components/ItemsTable";
import TransactionActionsComponent from "../Transactions/components/StockTransactionAction";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";
import { useStockAdjustment } from "../stock/hooks/useStockAdjustment ";
import { useStockAdjustmentActions } from "../stock/hooks/useStockAdjustmentActions ";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import TransactionSummaryComponent from "../Transactions/components/TransactionSummary";

import { stockAdjustmentQueries } from "@/hooks/queries/stockAdjustmentQueries ";
import { toast } from "sonner";
import {
  addStockAdjustmentDataToStore,
  removeStockAdjustmentDataFromStore,
} from "@/store/slices/stockAdjustmentSlice ";
import { transactionTypes } from "../CashTransaction/Utils/CashTransactionUtils";
import { addTransactionDataToStore, removeTransactionDataFromStore } from "@/store/slices/transactionSlice";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const StockTransactionAction = React.memo(TransactionActionsComponent);
const TransactionSummary = React.memo(TransactionSummaryComponent);

// EditStockAdjustment.jsx

const EditStockAdjustment = ({
  editAdjustmentData,
  handleCancelEdit,
  onSuccess,
  fromPath,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const {
    stockAdjustmentData,
    updateStockAdjustmentData,
    updateStockAdjustmentField,
    updateItemQuantity,
    removeItem,
    handleDiscountChange,
    handlePaidAmountChange,
    addItem,
    clickedItemInTable,
    handleItemClickInItemsTable,
    resetStockAdjustmentData,
  } = useStockAdjustment();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany,
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch,
  );

  // ✅ Set initial edit mode state with _id
  useEffect(() => {
    updateStockAdjustmentData({
      _id: editAdjustmentData?._id, // ✅ Add this
      isEditMode: true,
      editAdjustmentId: editAdjustmentData?._id,
    });

    dispatch(
      addStockAdjustmentDataToStore({
        _id: editAdjustmentData?._id, // ✅ Add this
        isEditMode: true,
        editAdjustmentId: editAdjustmentData?._id,
      }),
    );
  }, [editAdjustmentData?._id, updateStockAdjustmentData, dispatch]);

  // Fetch stock adjustment details
  const {
    data: adjustmentResponse,
    isLoading: adjustmentLoading,
    isError: adjustmentError,
  } = useQuery({
    ...stockAdjustmentQueries.getStockAdjustmentById(
      selectedCompanyFromStore._id,
      selectedBranchFromStore._id,
      editAdjustmentData?._id,
    ),
  });

  // ✅ Update data when response changes - preserve _id
  useEffect(() => {
    if (adjustmentResponse) {
      updateStockAdjustmentData({
        ...adjustmentResponse,
        _id: adjustmentResponse._id, // ✅ Explicitly set _id
        isEditMode: true,
        editAdjustmentId: editAdjustmentData?._id,
        transactionType: "stock_adjustment",
      });

      //// this is to  prevent the navigation in the nav bar when we are in edit mode
      dispatch(
        addTransactionDataToStore({
          isEditMode: true,
          editTransactionId: editAdjustmentData?._id,
          transactionType: "stock_adjustment",
        }),
      );

      return () => {
        dispatch(removeTransactionDataFromStore());
      };
    }
  }, [adjustmentResponse, updateStockAdjustmentData, editAdjustmentData?._id, dispatch]);

  console.log(stockAdjustmentData);

  // Handle error
  useEffect(() => {
    if (adjustmentError) {
      toast.error("An error occurred while loading stock adjustment details");
      handleCancel();
    }
  }, [adjustmentError]);

  // Cleanup
  useEffect(() => {
    return () => {
      resetStockAdjustmentData();
    };
  }, [resetStockAdjustmentData]);

  const handleCancel = () => {
    resetStockAdjustmentData();
    handleCancelEdit();
    dispatch(removeStockAdjustmentDataFromStore());
  };

  const { handleSave } = useStockAdjustmentActions(
    stockAdjustmentData,
    true,
    fromPath,
  );

  const onSave = async () => {
    console.log("💾 onSave - stockAdjustmentData:", stockAdjustmentData);
    console.log(
      "💾 onSave - stockAdjustmentData._id:",
      stockAdjustmentData._id,
    );

    setIsLoading(true);
    const success = await handleSave();
    setIsLoading(false);

    if (success) {
      handleCancel();
      onSuccess();
    }
  };
  console.log(stockAdjustmentData);
  return (
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
      {/* Loader */}
      {(isLoading || adjustmentLoading) && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

      {/* Header */}
      <TransactionHeader
        currentTransactionType="stock_adjustment"
        date={stockAdjustmentData.transactionDate}
        updateTransactionField={updateStockAdjustmentField}
        isEditMode={stockAdjustmentData.isEditMode}
        transactionNumber={stockAdjustmentData.transactionNumber}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col  bg-white">
            {/* Add To Stock / Remove From Stock Radio Buttons */}
            <div className="px-3 py-6 border-b border-gray-200 ">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium text-gray-700">
                    Add To Stock
                  </span>
                  <input
                    disabled
                    type="radio"
                    name="adjustmentType"
                    value="add"
                    checked={stockAdjustmentData.adjustmentType === "add"}
                    onChange={(e) =>
                      updateStockAdjustmentField(
                        "adjustmentType",
                        e.target.value,
                      )
                    }
                    className="w-3 h-3 text-green-600 focus:ring-green-500"
                  />
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium text-gray-700">
                    Remove From Stock
                  </span>
                  <input
                    disabled
                    type="radio"
                    name="adjustmentType"
                    value="remove"
                    checked={stockAdjustmentData.adjustmentType === "remove"}
                    onChange={(e) =>
                      updateStockAdjustmentField(
                        "adjustmentType",
                        e.target.value,
                      )
                    }
                    className="w-3 h-3 text-red-600 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>

            {/* Add Item Form */}
            <AddItemForm
              requireAccount={false}
              items={stockAdjustmentData?.items}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
              priceLevel={null}
              updateTransactionField={updateStockAdjustmentField}
              addItem={addItem}
              clickedItemInTable={clickedItemInTable}
              transactionType={stockAdjustmentData.transactionType}
              account={null}
            />
          </div>

          <div className="flex-1">
            {/* Items Table */}
            <ItemsTable
              items={stockAdjustmentData?.items}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
              handleItemClickInItemsTable={handleItemClickInItemsTable}
            />

            {/* Summary */}
            <TransactionSummary
              total={stockAdjustmentData.totalAmount}
              netAmount={stockAdjustmentData.totalAmount}
              discount={stockAdjustmentData.discount}
              paidAmount={stockAdjustmentData.paidAmount}
              balanceAmount={stockAdjustmentData.totalAmount}
              totalDue={stockAdjustmentData.totalDue}
              onDiscountChange={handleDiscountChange}
              onPaidAmountChange={handlePaidAmountChange}
              transactionType={stockAdjustmentData.transactionType}
            />

            {/* Actions */}
            <StockTransactionAction
              onSave={onSave}
              transactionData={stockAdjustmentData}
              onLoadingChange={setIsLoading}
              resetTransactionData={resetStockAdjustmentData}
              isEditMode={true}
              onCancel={handleCancel}
              requireAccount={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStockAdjustment;
