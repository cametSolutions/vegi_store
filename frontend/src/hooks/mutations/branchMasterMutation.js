import { branchMasterService } from "@/api/services/branchMaster.service";
import { toast } from "sonner";

export const branchMasterMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => branchMasterService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branchMaster"] });
      toast.success("Branch created successfully!");
    },
    onError: (error) => {
      console.error("Branch creation failed:", error);
      toast.error(error.message || "Error creating branch. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData }) => branchMasterService.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branchMaster"] });
      toast.success("Branch updated successfully!");
    },
    onError: (error) => {
      console.error("Branch update failed:", error);
      toast.error(error.message || "Error updating branch. Please try again.");
    },
  }),

  delete: (queryClient) => ({
    mutationFn: (id) => branchMasterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branchMaster"] });
      toast.success("Branch deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Error deleting branch.");
    },
  }),
};