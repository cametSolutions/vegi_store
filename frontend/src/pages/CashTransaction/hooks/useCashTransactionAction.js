import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cashtransactionMutations } from "../../../hooks/mutations/cashTransaction.mutation";
import { useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../Utils/CashTransactionUtils";
import { toast } from "sonner";

export const useCashTransactionActions = (CashtransactionData, isEditMode = false) => {
  const queryClient = useQueryClient();
  
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );
  // Initialize both mutations
  const createMutation = useMutation(cashtransactionMutations.create(queryClient));
  const updateMutation = useMutation(cashtransactionMutations.update(queryClient));

  const handleSave = useCallback(async () => {
    try {
   
      const convertedData= convertStringNumbersToNumbers(CashtransactionData);

      // Choose mutation based on mode
      if (isEditMode) {
        // Update existing transaction
        await updateMutation.mutateAsync({
          id: CashtransactionData.id,
          formData: CashtransactionData,
          transactionType: CashtransactionData.transactionType
        });
      } else {
        // Create new transaction
        await createMutation.mutateAsync({
          formData: { ...convertedData, company, branch },
         
          transactionType: CashtransactionData?.transactionType
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving transaction:", error);
      return false;
    }
  }, [CashtransactionData, isEditMode, createMutation, updateMutation]);

  return {
    handleSave,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error
  };
};