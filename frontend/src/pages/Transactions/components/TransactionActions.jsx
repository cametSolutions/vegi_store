import React, { useEffect, useState } from "react";
import { Save, Trash2, X, Loader2 } from "lucide-react";
import { useTransactionActions } from "../hooks/useTransactionActions";
import { toast } from "sonner";
import { DeleteTransactionDialog } from "@/components/modals/DeleteTransactionDialog";


const TransactionActions = ({
  transactionData,
  onLoadingChange,
  isEditMode = false,
  resetTransactionData,
  onCancel,
  transactionType,
  requireAccount = true,
  onDeleteSuccess, // Callback after successful deletion
}) => {
  const { handleSave, handleDelete, isLoading, isDeleting } = useTransactionActions(
    transactionData,
    isEditMode
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Notify parent whenever loading changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading || isDeleting);
    }
  }, [isLoading, isDeleting, onLoadingChange]);

  const handleSaveClick = async () => {
    // Validation
    if (requireAccount && !transactionData?.account) {
      toast.error("Please select a customer/supplier");
      return;
    }

    if (transactionData.items.length === 0) {
      toast.error("Items Missing");
      return false;
    }
    
    await handleSave(); 
    if (resetTransactionData) resetTransactionData(transactionData?.transactionType);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await handleDelete();
      setShowDeleteDialog(false);
      toast.success("Transaction deleted successfully");
      
      // Call success callback (e.g., navigate away or refresh list)
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete transaction");
    }
  };

  return (
    <>
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          
          {/* Cancel (Secondary) */}
          <button
            onClick={onCancel}
            disabled={isLoading || isDeleting}
            className="h-10 px-3 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>

          {/* Delete (Destructive) */}
          {isEditMode && (
            <button
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
              className="h-10 px-3 rounded border border-red-100 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}

          {/* Save (Primary - Fill remaining) */}
          <button
            onClick={handleSaveClick}
            disabled={isLoading || isDeleting}
            className={`flex-1 h-10 px-4 rounded font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm text-white
              ${isLoading 
                ? "bg-blue-400 cursor-wait" 
                : "bg-blue-600 hover:bg-blue-700 hover:shadow active:scale-[0.98]"
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span>
              {isLoading 
                ? "Saving..." 
                : isEditMode 
                  ? "Update" 
                  : "Save Transaction"
              }
            </span>
          </button>

        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTransactionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default TransactionActions;
