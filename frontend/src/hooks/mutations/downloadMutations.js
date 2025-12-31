import { downloadServices } from "@/api/services/download.service";
import { toast } from "sonner";

export const downloadMutations = {
  initiateDownload: (queryClient) => ({
    mutationFn: ({ filters, format }) => 
      downloadServices.initiateDownload(filters, format),
    onSuccess: (response, variables) => {
      toast.success("Report generation started...");
      // Note: We are using local state (setJobId) to drive the UI, 
      // but keeping this here is fine for debugging or advanced caching.
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate download");
    },
  }),
};
