// hooks/useStockAdjustmentActions.js

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { stockAdjustmentMutations } from "@/hooks/mutations/stockAdjustmentMutations";
import { removeStockAdjustmentDataFromStore } from "@/store/slices/stockAdjustmentSlice ";
import { convertStringNumbersToNumbers } from "@/pages/Transactions/utils/stockadjustmentUtils";
import { useNavigate } from "react-router-dom";

export const useStockAdjustmentActions = (
  stockAdjustmentData,
  isEditMode = false,
  fromPath = null,
) => {
  const queryClient = useQueryClient();
  const company = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id,
  );
  const branch = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Initialize both mutations
  const createMutation = useMutation(
    stockAdjustmentMutations.create(queryClient),
  );
  const updateMutation = useMutation(
    stockAdjustmentMutations.update(queryClient),
  );

  const handleSave = useCallback(async () => {
    try {
      // console.log("💾 ================================");
      // console.log("💾 handleSave called");
      // console.log("💾 isEditMode:", isEditMode);
      // console.log("💾 company:", company);
      // console.log("💾 branch:", branch);
      // console.log("💾 stockAdjustmentData:", JSON.stringify(stockAdjustmentData, null, 2));
      // console.log("💾 stockAdjustmentData._id:", stockAdjustmentData._id);
      // console.log("💾 ================================");

      // Validation
      if (!company || !branch) {
        toast.error("Company and branch are required");
        return false;
      }

      if (!stockAdjustmentData.adjustmentType) {
        toast.error("Please select adjustment type (Add/Remove)");
        return false;
      }

      if (
        !stockAdjustmentData.items ||
        stockAdjustmentData.items.length === 0
      ) {
        toast.error("Please add at least one item to adjust");
        return false;
      }

      const convertedStockAdjustmentData =
        convertStringNumbersToNumbers(stockAdjustmentData);

      console.log(
        "💾 Converted data:",
        JSON.stringify(convertedStockAdjustmentData, null, 2),
      );

      // Choose mutation based on mode
      if (isEditMode) {
        // Get ID
        const adjustmentId =
          stockAdjustmentData._id || stockAdjustmentData.editAdjustmentId;

        // console.log("🔵 ================================");
        // console.log("🔵 EDIT MODE");
        // console.log("🔵 stockAdjustmentData._id:", stockAdjustmentData._id);
        // console.log("🔵 stockAdjustmentData.editAdjustmentId:", stockAdjustmentData.editAdjustmentId);
        // console.log("🔵 Final adjustmentId:", adjustmentId);
        // console.log("🔵 adjustmentId type:", typeof adjustmentId);
        // console.log("🔵 ================================");

        if (!adjustmentId || adjustmentId === "undefined") {
          toast.error("Adjustment ID is missing");
          console.error("❌ NO VALID ID!");
          return false;
        }

        // console.log("🔵 Calling updateMutation.mutateAsync");
        // console.log("🔵 Parameters:", { id: adjustmentId, formData: convertedStockAdjustmentData });

        // Update existing adjustment
        await updateMutation.mutateAsync({
          id: adjustmentId,
          formData: convertedStockAdjustmentData,
        });

        // console.log("✅ updateMutation completed successfully");

        dispatch(removeStockAdjustmentDataFromStore());
        if (fromPath) {
          navigate(fromPath);
        }
        return true;
      } else {
        console.log("🔵 CREATE MODE");

        // Create new adjustment
        await createMutation.mutateAsync({
          formData: {
            ...convertedStockAdjustmentData,
            company,
            branch,
          },
        });

        console.log("✅ createMutation completed successfully");
        if (fromPath) {
          navigate(fromPath);
        }
        return true;
      }
    } catch (error) {
      console.error("❌ ================================");
      console.error("❌ Error in handleSave");
      console.error("❌ Error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ ================================");
      toast.error(error.message || "Failed to save stock adjustment");
      return false;
    }
  }, [
    stockAdjustmentData,
    isEditMode,
    createMutation,
    updateMutation,
    company,
    branch,
    dispatch,
  ]);

  return {
    handleSave,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};
