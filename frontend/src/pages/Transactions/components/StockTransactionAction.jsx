import React, { useEffect,useState } from "react";
import { Save, Trash2, X, Loader2 } from "lucide-react";
import { useStockAdjustmentActions } from "../../stock/hooks/useStockAdjustmentActions ";
import { toast } from "sonner";

const TransactionActions = ({
  transactionData,
  onLoadingChange,
  isEditMode = false,
  resetTransactionData,
  onCancel,
  transactionType,
  requireAccount = true,
   onSave,
  // onView,
  // onDelete,
}) => {
//   const { handleSave, isLoading } = useStockAdjustmentActions (
//     transactionData,
//     isEditMode
//   );

const [isLoading, setIsLoading] = useState(false);

  // Notify parent whenever loading changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleSaveClick = async () => {
    // Validation
     if (requireAccount && !transactionData?.account) {
      toast.error("Please select a customer/supplier");
      return;
    }

    // if (!transactionData.accountName?.trim() && !transactionData.account) {
    //   toast.error("Add a customer");
    //   return false;
    // }

    if (transactionData.items.length === 0) {
      toast.error("Items Missing");
      return false;
    }
    
    if (onSave) {
      setIsLoading(true);
      await onSave();
      setIsLoading(false);
    }

    if (resetTransactionData) {
      resetTransactionData(transactionData?.transactionType);
    }
  };

  return (
    <div className=" pt-2 border-t border-slate-100">
      <div className="flex items-center gap-2">
        
        {/* Cancel (Secondary) */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="h-10 px-3 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>

        {/* Delete (Destructive) - Keep it even if unused for layout consistency */}
        <button
          // onClick={onDelete}
          disabled={isLoading}
          className="h-10 px-3 rounded border border-red-100 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>

        {/* Save (Primary - Fill remaining) */}
        <button
          onClick={handleSaveClick}
          disabled={isLoading}
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
  );
};

export default TransactionActions;
