import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionMutations } from "../../../hooks/mutations/transaction.mutations";
import { useDispatch, useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../utils/transactionUtils";
import { toast } from "sonner";
import { removeTransactionDataFromStore } from "@/store/slices/transactionSlice";

export const useTransactionActions = (transactionData, isEditMode = false) => {
  const queryClient = useQueryClient();
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  const dispatch = useDispatch();

  // Initialize all mutations
  const createMutation = useMutation(transactionMutations.create(queryClient));
  const updateMutation = useMutation(transactionMutations.update(queryClient));
  const deleteMutation = useMutation(transactionMutations.delete(queryClient));

  const handleSave = useCallback(async () => {
    try {
      if (transactionData.transactionType == "") {
        toast.error("Having some issue with transaction type");
        return false;
      }

      const convertedTransactionData =
        convertStringNumbersToNumbers(transactionData);

      // Choose mutation based on mode
      if (isEditMode) {
        // Update existing transaction
        await updateMutation.mutateAsync({
          id: transactionData?._id,
          formData: transactionData,
          transactionType: transactionData.transactionType,
        });
        queryClient.invalidateQueries({ queryKey: ['items'] });
        
        dispatch(removeTransactionDataFromStore());
      } else {
        // Create new transaction
        await createMutation.mutateAsync({
          formData: { ...convertedTransactionData, company, branch },
          transactionType: transactionData.transactionType,
        });
        queryClient.invalidateQueries({ queryKey: ['items'] });
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction:", error);
      return false;
    }
  }, [transactionData, isEditMode, createMutation, updateMutation, company, branch, dispatch, queryClient]);

  const handleDelete = useCallback(async () => {
    try {
      if (!transactionData?._id) {
        throw new Error("Transaction ID is missing");
      }

      await deleteMutation.mutateAsync({
        id: transactionData._id,
        transactionType: transactionData.transactionType,
        company,
        branch,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionData._id] });

      // Clear transaction data from store
      dispatch(removeTransactionDataFromStore());

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error; // Re-throw to be caught by the component
    }
  }, [transactionData, deleteMutation, company, branch, dispatch, queryClient]);

  return {
    handleSave,
    handleDelete,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};
