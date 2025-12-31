import { queryOptions } from "@tanstack/react-query";
import { downloadServices } from "@/api/services/download.service";

export const downloadQueries = {
  all: () => ["download"],

  getJobStatus: (jobId) =>
    queryOptions({
      queryKey: [...downloadQueries.all(), "status", jobId],
      queryFn: () => downloadServices.getJobStatus(jobId),
      enabled: !!jobId,
      // ✅ FIX 3: Robust Refetch Logic
      refetchInterval: (query) => {
        // Handle both v4 (data) and v5 (query object) patterns safely
        const data = query?.state?.data || query; 
        
        if (!data) return 3000; // Keep polling if no data yet

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          return false;
        }
        
        return 3000; // Poll every 3 seconds
      },
      retry: false,
      staleTime: 0,
    }),
};
