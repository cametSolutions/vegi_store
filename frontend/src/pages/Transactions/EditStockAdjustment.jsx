import React, { useEffect, useState } from "react";
import AddItemFormComponent from "../Transactions/components/AddItemForm";
import ItemsTableComponent from "../Transactions/components/ItemsTable";
import TransactionActionsComponent from "../Transactions/components/TransactionActions";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";
import { useStockAdjustment } from "../stock/hooks/useStockAdjustment ";
import { useStockAdjustmentActions } from "../stock/hooks/useStockAdjustmentActions ";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { stockAdjustmentQueries } from "@/hooks/queries/stockAdjustmentQueries ";
import { toast } from "sonner";
import {
  addStockAdjustmentDataToStore,
  removeStockAdjustmentDataFromStore,
} from "@/store/slices/stockAdjustmentSlice ";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const TransactionActions = React.memo(TransactionActionsComponent);

const EditStockAdjustment = ({
  editAdjustmentData,
  handleCancelEdit,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const {
    stockAdjustmentData,
    updateStockAdjustmentData,
    updateStockAdjustmentField,
    updateItemQuantity,
    removeItem,
    addItem,
    clickedItemInTable,
    handleItemClickInItemsTable,
    resetStockAdjustmentData,
  } = useStockAdjustment();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Set initial edit mode state
  useEffect(() => {
    updateStockAdjustmentData({
      isEditMode: true,
      editAdjustmentId: editAdjustmentData._id,
    });

    dispatch(
      addStockAdjustmentDataToStore({
        isEditMode: true,
        editAdjustmentId: editAdjustmentData._id,
      })
    );
  }, [editAdjustmentData._id]);

  // Fetch stock adjustment details
  const {
    data: adjustmentResponse,
    isLoading: adjustmentLoading,
    isError: adjustmentError,
  } = useQuery({
    ...stockAdjustmentQueries.getStockAdjustmentById(
      selectedCompanyFromStore._id,
      selectedBranchFromStore._id,
      editAdjustmentData._id
    ),
  });

  // Update data when response changes
  useEffect(() => {
    if (adjustmentResponse) {
      updateStockAdjustmentData({
        ...adjustmentResponse,
        isEditMode: true,
        editAdjustmentId: editAdjustmentData._id,
      });
    }
  }, [adjustmentResponse, updateStockAdjustmentData]);

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

  const { handleSave } = useStockAdjustmentActions(stockAdjustmentData, true);

  const onSave = async () => {
    setIsLoading(true);
    const success = await handleSave();
    setIsLoading(false);

    if (success) {
      handleCancel();
      onSuccess();
    }
  };

  console.log("stockAdjustmentData in EditStockAdjustment:", stockAdjustmentData);

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
        date={stockAdjustmentData.adjustmentDate}
        updateTransactionField={updateStockAdjustmentField}
        isEditMode={stockAdjustmentData.isEditMode}
        transactionNumber={editAdjustmentData.adjustmentNumber}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
            {/* Add To Stock / Remove From Stock Radio Buttons */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustmentType"
                    value="add"
                    checked={stockAdjustmentData.adjustmentType === "add"}
                    onChange={(e) =>
                      updateStockAdjustmentField("adjustmentType", e.target.value)
                    }
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ⊕ Add To Stock
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustmentType"
                    value="remove"
                    checked={stockAdjustmentData.adjustmentType === "remove"}
                    onChange={(e) =>
                      updateStockAdjustmentField("adjustmentType", e.target.value)
                    }
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ⊖ Remove From Stock
                  </span>
                </label>
              </div>
            </div>

            {/* Add Item Form */}
            <AddItemForm
  requireAccount={false} // ✅ Just add this line
  items={stockAdjustmentData?.items}
  branch={selectedBranchFromStore?._id}
  company={selectedCompanyFromStore?._id}
  priceLevel={null}
  updateTransactionField={updateStockAdjustmentField}
  addItem={addItem}
  clickedItemInTable={clickedItemInTable}
  transactionType={null}
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
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-base font-semibold text-gray-700">
                      Total Amount:
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {stockAdjustmentData.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <TransactionActions
              onSave={onSave}
              transactionData={stockAdjustmentData}
              onLoadingChange={setIsLoading}
              resetTransactionData={resetStockAdjustmentData}
              isEditMode={true}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStockAdjustment;
