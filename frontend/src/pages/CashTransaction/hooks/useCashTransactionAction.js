import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cashtransactionMutations } from "../../../hooks/mutations/cashTransaction.mutation";
import { useDispatch, useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../Utils/CashTransactionUtils";
import { toast } from "sonner";
import { removeTransactionDataFromStore } from "@/store/slices/transactionSlice";
import { useNavigate } from "react-router-dom";

export const useCashTransactionActions = (
  CashtransactionData,
  isEditMode = false,
  fromPath=null,
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id,
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id,
  );

  // Initialize mutations
  const createMutation = useMutation(
    cashtransactionMutations.create(queryClient),
  );
  const updateMutation = useMutation(
    cashtransactionMutations.update(queryClient),
  );
  const deleteMutation = useMutation(
    cashtransactionMutations.delete(queryClient),
  );

const handleSave = useCallback(async () => {
  try {
    const convertedData = convertStringNumbersToNumbers(CashtransactionData);

    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: CashtransactionData._id,
        formData: { ...convertedData, company, branch },
        transactionType: CashtransactionData.transactionType,
      }); 
      // Ideally, clear store here or in mutation onSuccess
      dispatch(removeTransactionDataFromStore());
    } else {
      await createMutation.mutateAsync({
        formData: { ...convertedData, company, branch },
        transactionType: CashtransactionData?.transactionType,
      });
    }

    // ✅ MOVE NAVIGATION HERE
    // This line is only reached if the lines above do not throw an error
    if (fromPath) {
      navigate(fromPath);
    }

    return true;
  } catch (error) {
    console.error("Error saving transaction:", error);
    // ❌ Do not navigate on error, let the user fix the issue
    return false;
  }
}, [CashtransactionData, isEditMode, createMutation, updateMutation, fromPath, dispatch, navigate, company, branch]);


const handleDelete = useCallback(
  async (reason) => {
    try {
      await deleteMutation.mutateAsync({
        id: CashtransactionData._id,
        transactionType: CashtransactionData.transactionType,
        reason,
      });

      // ✅ Only runs if delete succeeds
      dispatch(removeTransactionDataFromStore());
      
      if (fromPath) {
        navigate(fromPath);
      }
      
    } catch (error) {
      // ❌ Stay on page so user sees the error toast/alert
      console.error("Delete failed:", error);
    }
  },
  [CashtransactionData, deleteMutation, fromPath, dispatch, navigate] 
);


  return {
    handleSave,
    handleDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};
