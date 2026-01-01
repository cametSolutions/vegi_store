import React, { useEffect, useMemo, useState } from "react";
import AddItemFormComponent from "../Transactions/components/AddItemForm";
import ItemsTableComponent from "../Transactions/components/ItemsTable";
import TransactionActionsComponent from "../Transactions/components/StockTransactionAction";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";
import { useStockAdjustment } from "../stock/hooks/useStockAdjustment ";
import { useStockAdjustmentActions } from "../stock/hooks/useStockAdjustmentActions ";
import TransactionSummaryComponent from "../Transactions/components/TransactionSummary";
import { useSelector } from "react-redux";

// Memoized components
const TransactionHeader = React.memo(TransactionHeaderComponent);
const AddItemForm = React.memo(AddItemFormComponent);
const ItemsTable = React.memo(ItemsTableComponent);
const StockTransactionAction = React.memo(TransactionActionsComponent);
const TransactionSummary = React.memo(TransactionSummaryComponent);

const CreateStockAdjustment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    stockAdjustmentData,
    updateStockAdjustmentField,
    updateItemQuantity,
    removeItem,
    addItem,
    handleDiscountChange,
    handlePaidAmountChange,
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

  // Set company and branch
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
    <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

      {/* Header */}
      <TransactionHeader
        currentTransactionType="stock_adjustment"
        date={stockAdjustmentData.transactionDate}
        updateTransactionField={updateStockAdjustmentField}
      />

      {/* Main Content - Same structure as CreateTransaction */}
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <div className="flex flex-col py-2 bg-white">
            {/* Radio Buttons - Add To Stock / Remove From Stock */}
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
                    Add To Stock
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
                    Remove From Stock
                  </span>
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

            {/* Transaction Summary */}
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

            {/* Action Buttons */}
            <StockTransactionAction
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
      </div>
    </div>
  );
};

export default CreateStockAdjustment;