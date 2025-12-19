import React, { useEffect, useMemo, useState } from "react";
import StockAdjustmentHeader from "./components/StockAdjustmentHeader";
import StockAdjustmentTypeSelector from "./components/StockAdjustmentTypeSelector";
import AddStockItemForm from "./components/AddStockItemForm";
import StockItemsTable from "./components/StockItemsTable";
import StockAdjustmentSummary from "./components/StockAdjustmentSummary";
import StockAdjustmentActions from "./components/StockAdjustmentActions";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { useStockAdjustment } from "./hooks/useStockAdjustment";
import { useSelector } from "react-redux";

const CreateStockAdjustment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    adjustmentData,
    updateAdjustmentData,
    updateAdjustmentField,
    updateItemQuantity,
    removeItem,
    addItem,
    clickedItemInTable,
    handleItemClickInItemsTable,
    resetAdjustmentData,
  } = useStockAdjustment();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Initialize adjustment type on mount
  useEffect(() => {
    if (!adjustmentData.adjustmentType) {
      updateAdjustmentField("adjustmentType", "add_to_stock");
    }
  }, []);

  // Reset adjustment data when component unmounts
  useEffect(() => {
    return () => {
      resetAdjustmentData();
    };
  }, [resetAdjustmentData]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

      {/* Header */}
      <StockAdjustmentHeader
        date={adjustmentData.adjustmentDate}
        updateAdjustmentField={updateAdjustmentField}
      />

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100%-56px)] p-2">
        {/* Type Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
          <StockAdjustmentTypeSelector
            adjustmentType={adjustmentData.adjustmentType}
            updateAdjustmentField={updateAdjustmentField}
          />
        </div>

        {/* Add Item Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
          <AddStockItemForm
            items={adjustmentData.items}
            branch={selectedBranchFromStore?._id}
            company={selectedCompanyFromStore?._id}
            addItem={addItem}
            clickedItemInTable={clickedItemInTable}
            adjustmentType={adjustmentData.adjustmentType}
          />
        </div>

        {/* Items Table */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden mb-2">
          <StockItemsTable
            items={adjustmentData.items}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItem}
            handleItemClickInItemsTable={handleItemClickInItemsTable}
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
          <StockAdjustmentSummary totalAmount={adjustmentData.totalAmount} />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <StockAdjustmentActions
            adjustmentData={adjustmentData}
            onLoadingChange={setIsLoading}
            resetAdjustmentData={resetAdjustmentData}
            onCancel={() => {
              resetAdjustmentData();
            }}
            isEditMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateStockAdjustment;
