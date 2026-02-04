import React, { useEffect, useState } from "react";
import CreateStockAdjustment from "./CreateStockAdjustment ";
import EditStockAdjustment from "./EditStockAdjustment";
import StockAdjustmentList from "./StockAdjustmentList";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const StockAdjustmentPanel = () => {
  const isEditMode = useSelector((state) => state.transaction?.isEditMode);
  const [editMode, setEditMode] = useState(isEditMode);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  console.log(location);

  const { from, transactionId, fromPath } = location.state || {};
  // console.log(location);
  // console.log(location);

  useEffect(() => {
    if (from === "transactionSummary" && transactionId) {
      handleEditAdjustment({ _id: transactionId });
    }

    return () => {
      ///set location.state to null
      window.history.replaceState(null, "", window.location.pathname);
      setSelectedAdjustment(null);
      setEditMode(false);
    };
  }, [location.state]);

  // Handler to switch to edit mode
  const handleEditAdjustment = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setEditMode(true);
  };

  // Handler to switch back to create mode
  const handleCancelEdit = () => {
    if (from === "transactionSummary" && transactionId) {
      // Clear location state using React Router's navigate
      navigate(fromPath || location.pathname, { replace: true, state: null });
    }
    setEditMode(false);
    setSelectedAdjustment(null);
  };

  // Sync local editMode state with Redux store
  // Reset selected adjustment when edit is completed
  useEffect(() => {
    setEditMode(isEditMode);
    if (!isEditMode) {
      setSelectedAdjustment(null);
    }
  }, [isEditMode]);

  return (
    <div className="flex w-full justify-between  bg-white gap-2">
      {/* ✅ Left side: Create/Edit Form (55% width) */}
      <div className="w-[55%]">
        {editMode ? (
          <EditStockAdjustment
            editAdjustmentData={selectedAdjustment}
            handleCancelEdit={handleCancelEdit}
            onSuccess={handleCancelEdit} // Return to create mode after successful edit
            fromPath={fromPath}
          />
        ) : (
          <CreateStockAdjustment />
        )}
      </div>

      {/* ✅ Right side: List (45% width) */}
      <div
        className={` ${transactionId && from === "transactionSummary" ? "opacity-50 pointer-events-none" : ""}  w-[45%]`}
      >
        <StockAdjustmentList
          onEditAdjustment={handleEditAdjustment}
          selectedAdjustment={selectedAdjustment}
        />
      </div>
    </div>
  );
};

export default StockAdjustmentPanel;
