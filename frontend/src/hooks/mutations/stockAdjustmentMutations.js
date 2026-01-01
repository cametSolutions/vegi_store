// hooks/mutations/stockAdjustmentMutations.js
import { toast } from "sonner";
import { stockAdjustmentServices } from "../../api/services/stockAdjustmentServices";

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
        queryKey: ["reports"]
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
    mutationFn: async ({ id, formData }) => {
      console.log("🟡 ================================");
      console.log("🟡 Mutation - mutationFn called");
      console.log("🟡 Mutation - id:", id);
      console.log("🟡 Mutation - id type:", typeof id);
      console.log("🟡 Mutation - formData:", formData);
      console.log("🟡 ================================");
      
      if (!id || id === "undefined") {
        throw new Error("Invalid adjustment ID in mutation");
      }
      
      const response = await stockAdjustmentServices.update(id, formData);
      
      console.log("🟡 Mutation - Response:", response);
      
      return response;
    },

    onSuccess: (response, variables) => {
      console.log("✅ ================================");
      console.log("✅ Mutation Success");
      console.log("✅ response:", response);
      console.log("✅ variables:", variables);
      console.log("✅ ================================");

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      toast.success("Stock adjustment updated successfully!");
    },

    onError: (error, variables) => {
      console.error("❌ ================================");
      console.error("❌ Mutation Error");
      console.error("❌ error:", error);
      console.error("❌ error.message:", error.message);
      console.error("❌ error.response:", error.response);
      console.error("❌ variables:", variables);
      console.error("❌ ================================");
      
      toast.error(
        error?.message || 
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
