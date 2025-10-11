import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionMutations } from "../../../hooks/mutations/transaction.mutations";
import { useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../utils/transactionUtils";

export const useTransactionActions = (transactionData, isEditMode = false) => {
  const queryClient = useQueryClient();
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  // Initialize both mutations
  const createMutation = useMutation(transactionMutations.create(queryClient));
  const updateMutation = useMutation(transactionMutations.update(queryClient));

  const handleSave = useCallback(async () => {
    try {
      console.log("Saving transaction:", transactionData);

      const convertedTransactionData=convertStringNumbersToNumbers(transactionData);

      // Validation
      // if (!transactionData.partyName.trim()) {
      //   alert("Please enter party name");
      //   return false;
      // }

      // if (transactionData.items.length === 0) {
      //   alert("Please add at least one item");
      //   return false;
      // }

      // Choose mutation based on mode
      if (isEditMode) {
        // Update existing transaction
        await updateMutation.mutateAsync({
          id: transactionData.id,
          formData: transactionData,
          transactionType: transactionData.transactionType,
        });
      } else {
        // Create new transaction
        await createMutation.mutateAsync({
          formData: { ...convertedTransactionData, company, branch },
          transactionType: transactionData.transactionType,
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction:", error);
      return false;
    }
  }, [transactionData, isEditMode, createMutation, updateMutation]);

  return {
    handleSave,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};
