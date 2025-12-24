import React, { useEffect, useMemo, useState } from "react";
import AddItemFormComponent from "../Transactions/components/AddItemForm";
import ItemsTableComponent from "../Transactions/components/ItemsTable";
import TransactionActionsComponent from "../Transactions/components/TransactionActions";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";
import { useStockAdjustment } from "../stock/hooks/useStockAdjustment ";
import { useStockAdjustmentActions } from "../stock/hooks/useStockAdjustmentActions ";
import { useSelector } from "react-redux";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const TransactionActions = React.memo(TransactionActionsComponent);

const CreateStockAdjustment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    stockAdjustmentData,
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

  // Initialize with default adjustment type
  useEffect(() => {
    updateStockAdjustmentField("adjustmentType", "add");
  }, [updateStockAdjustmentField]);

// CreateStockAdjustment.jsx - Add this useEffect

useEffect(() => {
  if (selectedCompanyFromStore?._id) {
    updateStockAdjustmentField("company", selectedCompanyFromStore._id);
  }
  if (selectedBranchFromStore?._id) {
    updateStockAdjustmentField("branch", selectedBranchFromStore._id);
  }
}, [selectedCompanyFromStore, selectedBranchFromStore, updateStockAdjustmentField]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetStockAdjustmentData();
    };
  }, [resetStockAdjustmentData]);

  const { handleSave } = useStockAdjustmentActions(stockAdjustmentData, false);

  const onSave = async () => {
    setIsLoading(true);
    const success = await handleSave();
    setIsLoading(false);

    if (success) {
      resetStockAdjustmentData();
    }
  };

  console.log("stockAdjustmentData", stockAdjustmentData);

  return (
    // ✅ ADDED: overflow-hidden to prevent page scroll
    <div className="h-[calc(100vh-64px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden relative">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <TransactionHeader
          currentTransactionType="stock_adjustment"
          date={stockAdjustmentData.adjustmentDate}
          updateTransactionField={updateStockAdjustmentField}
        />
      </div>

      {/* Radio Buttons - Fixed below header */}
      <div className="flex-shrink-0 bg-white px-4 py-3 border-b border-gray-200">
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

      {/* Add Item Form - Fixed */}
      <div className="flex-shrink-0">
        <AddItemForm
          requireAccount={false}
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

      {/* Items Table - Scrollable middle section - ✅ ONLY THIS SECTION SCROLLS */}
      <div className="flex-1 overflow-auto min-h-0">
        <ItemsTable
          items={stockAdjustmentData?.items}
          onUpdateQuantity={updateItemQuantity}
          onRemoveItem={removeItem}
          handleItemClickInItemsTable={handleItemClickInItemsTable}
        />
      </div>

      {/* Action Buttons - Fixed at bottom - ✅ ALWAYS VISIBLE */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <TransactionActions
          onSave={onSave}
          transactionData={stockAdjustmentData}
          onLoadingChange={setIsLoading}
          resetTransactionData={resetStockAdjustmentData}
          isEditMode={false}
          requireAccount={false}
          onCancel={() => {
            resetStockAdjustmentData();
           
          }}
        />
      </div>
    </div>
  );
};

export default CreateStockAdjustment;
