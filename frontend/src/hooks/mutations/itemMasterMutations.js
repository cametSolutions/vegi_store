// hooks/mutations/itemMasterMutations.js
import { toast } from "sonner";
import { itemServices } from "../../api/services/items.service";

export const itemMasterMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => itemServices.create(formData),

    onSuccess: (response) => {
      const { company } = response?.data?.item;

      queryClient.invalidateQueries({
        queryKey: ["item", "list", company],
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
        queryKey: ["item", "list", company],
      });

      queryClient.invalidateQueries({
        queryKey: ["item", "detail", variables.id],
      });

      toast.success("Item updated successfully!");
    },

    onError: (error) => {
      console.error("Item update failed:", error);
      toast.error(error.response?.data?.message || "Error updating item. Please try again.");
    },
  }),

  delete: (queryClient) => ({
    mutationFn: (id) => itemServices.delete(id),

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["item"],
      });

      toast.success("Item deleted successfully!");
    },

    onError: (error) => {
      console.error("Item deletion failed:", error);
      toast.error(error.message || "Error deleting item. Please try again.");
    },
  }),

 updateRate: (queryClient) => ({
  mutationFn: ({ itemId, priceLevelId, rate }) => 
    itemServices.updateRate(itemId, priceLevelId, rate),

  onSuccess: (response) => {
    queryClient.invalidateQueries({
      queryKey: ["item","list",response?.data?.company,""],
    });

    // Optional: also invalidate specific item query if you have one
    // queryClient.invalidateQueries({
    //   queryKey: ["item", response.data._id],
    // });

    // toast.success("Rate updated successfully!");
  },

  onError: (error) => {
    console.error("Rate update failed:", error);
    toast.error(error.message || "Error updating rate. Please try again.");
  },
}),

};
