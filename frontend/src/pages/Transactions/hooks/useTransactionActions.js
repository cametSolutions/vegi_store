import { use, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionMutations } from "../../../hooks/mutations/transaction.mutations";
import { useDispatch, useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../utils/transactionUtils";
import { toast } from "sonner";
import { removeTransactionDataFromStore } from "@/store/slices/transactionSlice";
import { useNavigate } from "react-router-dom";

export const useTransactionActions = (
  transactionData,
  isEditMode = false,
  fromPath = null,
) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id,
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id,
  );

  const dispatch = useDispatch();

  // Initialize all mutations
  const createMutation = useMutation(transactionMutations.create(queryClient));
  const updateMutation = useMutation(transactionMutations.update(queryClient));
  const deleteMutation = useMutation(transactionMutations.delete(queryClient));

  const handleSave = useCallback(async () => {
    try {
      // 1. Validation
      if (!transactionData.transactionType) {
        toast.error("Transaction type is missing");
        return false;
      }

      // Handle Price Level
      const dataToProcess = { ...transactionData };
      if (!dataToProcess.priceLevel) {
        dataToProcess.priceLevel = null;
      }

      const convertedTransactionData =
        convertStringNumbersToNumbers(dataToProcess);

      // 2. Perform Mutation
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: transactionData._id,
          formData: convertedTransactionData,
          transactionType: transactionData.transactionType,
        });
      } else {
        await createMutation.mutateAsync({
          formData: { ...convertedTransactionData, company, branch },
          transactionType: transactionData.transactionType,
        });
      }

      // 3. Cleanup & Navigation (ONLY on Success)
      dispatch(removeTransactionDataFromStore());

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      if (fromPath) {
        navigate(fromPath);
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction:", error);
      // Stay on page so user sees the error
      return false;
    }
  }, [
    transactionData,
    isEditMode,
    createMutation,
    updateMutation,
    company,
    branch,
    dispatch,
    queryClient,
    fromPath,
    navigate, // Added navigate to dependency array
  ]);

  const handleDelete = useCallback(
    async (reason) => {
      try {
        if (!transactionData?._id) {
          toast.error("Cannot delete: Transaction ID is missing");
          return false;
        }

        // 1. Perform Delete Mutation
        await deleteMutation.mutateAsync({
          id: transactionData._id,
          transactionType: transactionData.transactionType,
          company,
          branch,
          reason,
        });

        // 2. Cleanup & Navigation (ONLY on Success)
        dispatch(removeTransactionDataFromStore());

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["items"] });
        queryClient.invalidateQueries({
          queryKey: ["transaction", transactionData._id],
        });

        if (fromPath) {
          navigate(fromPath);
        }

        return true;
      } catch (error) {
        console.error("Error deleting transaction:", error);
        // Stay on page so user sees the error
        return false;
      }
    },
    [
      transactionData,
      deleteMutation,
      company,
      branch,
      dispatch,
      queryClient,
      fromPath,
      navigate,
    ],
  );

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
