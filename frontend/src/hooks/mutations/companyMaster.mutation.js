import { companyMasterService } from "@/api/services/companyMaster.service";
import { toast } from "sonner";

export const companyMasterMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => companyMasterService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyMaster"] });
      toast.success("Company created successfully!");
    },
    onError: (error) => {
      console.error("Company creation failed:", error);
      toast.error(error.message || "Error creating company. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData }) => companyMasterService.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyMaster"] });
      toast.success("Company updated successfully!");
    },
    onError: (error) => {
      console.error("Company update failed:", error);
      toast.error(error.message || "Error updating company. Please try again.");
    },
  }),

  delete: (queryClient) => ({
    mutationFn: (id) => companyMasterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyMaster"] });
      toast.success("Company deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Error deleting company.");
    },
  }),
};