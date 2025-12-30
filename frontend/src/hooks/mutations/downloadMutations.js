import { downloadServices } from "@/api/services/download.service";
import { toast } from "sonner";

export const downloadMutations = {
  initiateDownload: (queryClient) => ({
    mutationFn: ({ filters, format }) => 
      downloadServices.initiateDownload(filters, format),
    onSuccess: (response, variables) => { // ← Add 'variables' parameter
      toast.success("Report generation started!");
      // Store jobId and format in cache for polling
      queryClient.setQueryData(
        ["download", "current-job"], 
        { jobId: response.jobId, format: variables.format } // ← Use variables.format
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate download");
    },
  }),
};
