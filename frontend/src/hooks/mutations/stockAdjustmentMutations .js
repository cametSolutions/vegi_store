// hooks/mutations/stockAdjustmentMutations.js
import { toast } from "sonner";
import { stockAdjustmentServices } from "../../api/services/stockAdjustmentServices ";

export const stockAdjustmentMutations = {
  create: (queryClient) => ({
    mutationFn: ({ formData }) =>
      stockAdjustmentServices.create(formData),

    onSuccess: (response, variables) => {
      // The response structure is { success, message, data: { stockAdjustment, ... } }
      const { company, branch, _id } = response?.data?.stockAdjustment;
      
      // Invalidate stock adjustment list queries
      queryClient.invalidateQueries({
        queryKey: ["stockAdjustments", company, branch],
      });

      // Invalidate item/inventory queries since stock levels changed
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });

      // Invalidate reports that depend on stock levels
      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });

      toast.success("Stock adjustment created successfully!");
    },

    onError: (error) => {
      console.error("Stock adjustment creation failed:", error);
      toast.error(
        error?.response?.data?.message || 
        "Error creating stock adjustment. Please try again."
      );
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData }) =>
      stockAdjustmentServices.update(id, formData),

    onSuccess: (response, variables) => {
      const { company, branch, _id } = response?.data?.stockAdjustment;

      // Invalidate specific stock adjustment query
      queryClient.invalidateQueries({
        queryKey: ["stockAdjustments", "getById", company, branch, _id],
      });

      // Invalidate stock adjustment list
      queryClient.invalidateQueries({
        queryKey: ["stockAdjustments", company, branch],
      });

      // Invalidate items since stock changed
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });

      // Invalidate reports
      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });

      toast.success("Stock adjustment updated successfully!");

      // Also invalidate the specific adjustment query
      queryClient.invalidateQueries({
        queryKey: ["stockAdjustment", variables.id],
      });
    },

    onError: (error) => {
      console.error("Stock adjustment update failed:", error);
      toast.error(
        error?.response?.data?.message || 
        "Error updating stock adjustment. Please try again."
      );
    },
  }),

  delete: (queryClient) => ({
    mutationFn: ({ id, companyId, branchId }) =>
      stockAdjustmentServices.delete(id, companyId, branchId),

    onSuccess: (response, variables) => {
      const { companyId, branchId } = variables;

      // Invalidate stock adjustment list
      queryClient.invalidateQueries({
        queryKey: ["stockAdjustments", companyId, branchId],
      });

      // Invalidate items since stock reverted
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });

      // Invalidate reports
      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });

      toast.success("Stock adjustment deleted successfully!");
    },

    onError: (error) => {
      console.error("Stock adjustment deletion failed:", error);
      toast.error(
        error?.response?.data?.message || 
        "Error deleting stock adjustment. Please try again."
      );
    },
  }),
};
