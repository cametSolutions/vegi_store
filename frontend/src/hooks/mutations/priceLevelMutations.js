import { priceLevelServices } from "@/api/services/priceLevel.service";
import { toast } from "sonner";

export const priceLevelMutations = {
  create: (queryClient) => ({
    mutationFn: (formData) => priceLevelServices.create(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["pricelevel"] });
      toast.success("Price level created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Error creating price level.");
    },
  }),
  update: (queryClient) => ({
    mutationFn: ({ id, formData }) => priceLevelServices.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricelevel"] });
      toast.success("Price level updated successfully!");
    },
    onError: (error) => toast.error(error.message || "Error updating."),
  }),
  delete: (queryClient) => ({
    mutationFn: (id) => priceLevelServices.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricelevel"] });
      toast.success("Deleted successfully!");
    },
    onError: (error) => toast.error(error.message || "Delete failed."),
  }),
};
