// hooks/useStockAdjustmentActions.js
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockAdjustmentMutations } from "../../../hooks/mutations/stockAdjustmentMutations ";
import { useDispatch, useSelector } from "react-redux";
import { convertStringNumbersToNumbers } from "../../Transactions/utils/stockadjustmentUtils";
import { toast } from "sonner";
import { removeStockAdjustmentDataFromStore } from "@/store/slices/stockAdjustmentSlice ";

export const useStockAdjustmentActions = (
  stockAdjustmentData,
  isEditMode = false
) => {
  const queryClient = useQueryClient();
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  const dispatch = useDispatch();

  // Initialize both mutations
  const createMutation = useMutation(
    stockAdjustmentMutations.create(queryClient)
  );
  const updateMutation = useMutation(
    stockAdjustmentMutations.update(queryClient)
  );

  const handleSave = useCallback(async () => {
    try {
      // Validation
      if (!stockAdjustmentData.reason || stockAdjustmentData.reason.trim() === "") {
        toast.error("Please provide a reason for stock adjustment");
        return false;
      }

      if (stockAdjustmentData.items.length === 0) {
        toast.error("Please add at least one item to adjust");
        return false;
      }

      const convertedStockAdjustmentData = convertStringNumbersToNumbers(
        stockAdjustmentData
      );

      // Choose mutation based on mode
      if (isEditMode) {
        // Update existing adjustment
        await updateMutation
          .mutateAsync({
            id: stockAdjustmentData.id,
            formData: stockAdjustmentData,
          })
          .finally(() => {
            dispatch(removeStockAdjustmentDataFromStore());
          });
      } else {
        // Create new adjustment
        await createMutation.mutateAsync({
          formData: { ...convertedStockAdjustmentData, company, branch },
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving stock adjustment:", error);
      toast.error("Failed to save stock adjustment");
      return false;
    }
  }, [stockAdjustmentData, isEditMode, createMutation, updateMutation]);

  return {
    handleSave,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};
