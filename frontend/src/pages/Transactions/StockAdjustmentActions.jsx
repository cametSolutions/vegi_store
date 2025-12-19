import React, { useEffect } from "react";
import { Save, Trash2, X } from "lucide-react";
import { useStockAdjustmentActions } from "../hooks/useStockAdjustmentActions";
import { toast } from "sonner";

const StockAdjustmentActions = ({
  adjustmentData,
  onLoadingChange,
  isEditMode = false,
  resetAdjustmentData,
  onCancel,
}) => {
  const { handleSave, isLoading } = useStockAdjustmentActions(
    adjustmentData,
    isEditMode
  );

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleSaveClick = async () => {
    // Validation
    if (adjustmentData.items.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }
    await handleSave();
    if (resetAdjustmentData) resetAdjustmentData();
  };

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleSaveClick}
          className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
        >
          <Save className="w-3 h-3" />
          {isEditMode ? "Update" : "Save"}
        </button>

        <button className="bg-red-600 hover:bg-red-700 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[11px]">
          <Trash2 className="w-3 h-3" />
          Delete
        </button>

        <button
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StockAdjustmentActions;
