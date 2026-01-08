import React, { useEffect } from "react";
import { Save, Trash2, X, Loader2 } from "lucide-react";
import { useCashTransactionActions } from "../hooks/useCashTransactionAction";
import { toast } from "sonner";

const CashTransactionAction = ({
  CashtransactionData,
  resetCashTransactionData,
  onLoadingChange,
  handleCancel,
  isEditMode = false,
  // onView,
  // onDelete,
  // onPrint,
}) => {
  const { handleSave, isLoading } = useCashTransactionActions(
    CashtransactionData,
    isEditMode
  );

  // Notify parent whenever loading changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleSaveClick = async () => {
    const { paymentMode, chequeNumber, accountName, account } = CashtransactionData;

    if (paymentMode === "cheque" && chequeNumber.trim() === "") {
      toast.error("Enter cheque number");
      return;
    }

    // Validation
    if (!accountName?.trim() && !account) {
      toast.error("Add a customer");
      return false;
    }

    await handleSave(); // save using your hook
    if (resetCashTransactionData) {
      resetCashTransactionData(CashtransactionData.transactionType);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="flex items-center gap-2">
        
        {/* Cancel (Secondary) */}
        <button
          onClick={handleCancel}
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

export default CashTransactionAction;
