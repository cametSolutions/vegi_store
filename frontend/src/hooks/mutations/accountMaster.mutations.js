import { accountMasterService } from "@/api/services/accountMaster.service";
import { toast } from "sonner";

export const accountMasterMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => accountMasterService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountMaster"] });
      toast.success("Account created successfully!");
    },
    onError: (error) => {
      console.error("Account creation failed:", error);
      toast.error(error.message || "Error creating account. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData }) => accountMasterService.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountMaster"] });
      toast.success("Account updated successfully!");
    },
    onError: (error) => {
      console.error("Account update failed:", error);
      toast.error(error.message || "Error updating account. Please try again.");
    },
  }),

  delete: (queryClient) => ({
    mutationFn: (id) => accountMasterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountMaster"] });
      toast.success("Account deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Error deleting account.");
    },
  }),
};
