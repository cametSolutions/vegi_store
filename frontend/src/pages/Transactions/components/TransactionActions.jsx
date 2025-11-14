import React, { useEffect } from "react";
import { Save, Eye, Trash2, X, FileText } from "lucide-react";
import { useTransactionActions } from "../hooks/useTransactionActions";
import { toast } from "sonner";

const TransactionActions = ({
  transactionData,
  onLoadingChange,
  isEditMode = false,
  resetTransactionData,
  onCancel,
  updateTransactionData,
  transactionType,
  // onView,
  // onDelete,
  // onPrint,
}) => {
  const { handleSave, isLoading } = useTransactionActions(
    transactionData,
    isEditMode
  );

  // 👇 Notify parent whenever loading changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleSaveClick = async () => {
    // Validation
    if (!transactionData.accountName.trim() && !transactionData.account) {
      toast.error("Add a customer");
      return false;
    }

    if (transactionData.items.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }
    await handleSave(); // save using your hook
    if (resetTransactionData) resetTransactionData(transactionData?.transactionType); // 👈 reset after success
  };

  console.log("transaction actions component renders");

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 gap-2">
        {/* Primary Action - Darkest Blue */}
        <button
          onClick={handleSaveClick}
          className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[10.5px]"
        >
          <Save className="w-3 h-3" />
          {isEditMode ? "Update" : "Save"}
        </button>

        {/* Destructive - Red (Exception) */}
        <button
          // onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[10.5px]"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>

        {/* Neutral - Light Blue */}
        <button
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[10.5px]"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionActions;
