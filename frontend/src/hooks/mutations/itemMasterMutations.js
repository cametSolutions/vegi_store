// hooks/mutations/itemMasterMutations.js
import { toast } from "sonner";
import { itemServices } from "../../api/services/items.service";

export const itemMasterMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => itemServices.create(formData),

    onSuccess: (response) => {
      const { company } = response?.data?.item;

      queryClient.invalidateQueries({
        queryKey: ["itemmaster", "list", company],
      });

      toast.success("Item created successfully!");
    },

    onError: (error) => {
      console.error("Item creation failed:", error);
      toast.error(error.message || "Error creating item. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData }) =>
      itemServices.update(id, formData),

    onSuccess: (response, variables) => {
      const { company } = response?.data?.item;

      queryClient.invalidateQueries({
        queryKey: ["itemmaster", "list", company],
      });

      queryClient.invalidateQueries({
        queryKey: ["itemmaster", "detail", variables.id],
      });

      toast.success("Item updated successfully!");
    },

    onError: (error) => {
      console.error("Item update failed:", error);
      toast.error(error.message || "Error updating item. Please try again.");
    },
  }),

  delete: (queryClient) => ({
    mutationFn: (id) => itemServices.delete(id),

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["itemmaster"],
      });

      toast.success("Item deleted successfully!");
    },

    onError: (error) => {
      console.error("Item deletion failed:", error);
      toast.error(error.message || "Error deleting item. Please try again.");
    },
  }),
};
