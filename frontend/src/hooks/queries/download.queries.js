import { queryOptions } from "@tanstack/react-query";
import { downloadServices } from "@/api/services/download.service";

export const downloadQueries = {
  all: () => ["download"],

  // Query for job status
  getJobStatus: (jobId) =>
    queryOptions({
      queryKey: [...downloadQueries.all(), "status", jobId],
      queryFn: () => downloadServices.getJobStatus(jobId),
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Stop polling if completed or failed
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 3000; // Poll every 3 seconds
      },
      retry: false,
      staleTime: 0, // Always fresh, don't cache
    }),
};
