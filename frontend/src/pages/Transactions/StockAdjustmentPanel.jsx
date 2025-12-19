import React, { useEffect, useState } from "react";
import CreateStockAdjustment from "./CreateStockAdjustment";
import EditStockAdjustment from "./EditStockAdjustment";
import StockAdjustmentList from "./components/StockAdjustmentList/StockAdjustmentList";
import { useSelector } from "react-redux";

const StockAdjustmentPanel = () => {
  const isEditMode = useSelector((state) => state.stockAdjustment?.isEditMode);
  const [editMode, setEditMode] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  // Handler to switch to edit mode
  const handleEditAdjustment = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setEditMode(true);
  };

  // Handler to switch back to create mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedAdjustment(null);
  };

  // Sync local editMode state with Redux store
  useEffect(() => {
    setEditMode(isEditMode);
    if (!isEditMode) {
      setSelectedAdjustment(null);
    }
  }, [isEditMode]);

  return (
    <div className="flex w-full justify-between bg-white gap-2 h-[calc(100vh-99px)]">
      <div className="w-[45%] border-r border-gray-200">
        <StockAdjustmentList
          onEditAdjustment={handleEditAdjustment}
          selectedAdjustment={selectedAdjustment}
        />
      </div>
      <div className="w-[55%]">
        {editMode ? (
          <EditStockAdjustment
            editAdjustmentData={selectedAdjustment}
            handleCancelEdit={handleCancelEdit}
            onSuccess={handleCancelEdit}
          />
        ) : (
          <CreateStockAdjustment />
        )}
      </div>
    </div>
  );
};

export default StockAdjustmentPanel;
