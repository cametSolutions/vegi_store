import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cashtransactionMutations } from "../../../hooks/mutations/cashTransaction.mutation";
import { useDispatch, useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../Utils/CashTransactionUtils";
import { toast } from "sonner";
import { removeTransactionDataFromStore } from "@/store/slices/transactionSlice";

export const useCashTransactionActions = (
  CashtransactionData,
  isEditMode = false
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  // Initialize mutations
  const createMutation = useMutation(
    cashtransactionMutations.create(queryClient)
  );
  const updateMutation = useMutation(
    cashtransactionMutations.update(queryClient)
  );
  const deleteMutation = useMutation(
    cashtransactionMutations.delete(queryClient)
  );

  const handleSave = useCallback(async () => {
    try {
      const convertedData = convertStringNumbersToNumbers(CashtransactionData);

      if (isEditMode) {
        await updateMutation
          .mutateAsync({
            id: CashtransactionData._id,
            formData: { ...convertedData, company, branch },
            transactionType: CashtransactionData.transactionType,
          })
          .finally(() => {
            dispatch(removeTransactionDataFromStore());
          });
      } else {
        await createMutation.mutateAsync({
          formData: { ...convertedData, company, branch },
          transactionType: CashtransactionData?.transactionType,
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction:", error);
      return false;
    }
  }, [CashtransactionData, isEditMode, createMutation, updateMutation]);

  const handleDelete = useCallback((reason) => {
    return deleteMutation.mutateAsync({
      id: CashtransactionData._id,
      transactionType: CashtransactionData.transactionType,
      reason
    });
  }, [CashtransactionData, deleteMutation]);

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
