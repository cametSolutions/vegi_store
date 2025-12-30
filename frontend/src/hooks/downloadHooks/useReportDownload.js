import { downloadHelper } from '@/helper/downloadHelper/downloadHelper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { downloadMutations } from '../mutations/downloadMutations';
import { downloadQueries } from '../queries/download.queries';

export const useReportDownload = () => {
  const queryClient = useQueryClient();
  const jobIdRef = useRef(null);
  const formatRef = useRef(null);
  
  // Mutation to initiate download
  const initiateMutation = useMutation(
    downloadMutations.initiateDownload(queryClient)
  );
  
  // Query to poll job status
  const { data: statusData, isLoading: isPolling } = useQuery({
    ...downloadQueries.getJobStatus(jobIdRef.current),
    enabled: !!jobIdRef.current,
  });

  // Handle completion
  useEffect(() => {
    if (statusData?.status === 'completed' && formatRef.current) {
      const { data, fileName } = statusData;
      
      try {
        if (formatRef.current === 'excel') {
          downloadHelper.generateExcel(data, fileName);
          toast.success("Excel file downloaded successfully!");
        } else if (formatRef.current === 'pdf') {
          downloadHelper.generatePDF(data, fileName);
          toast.success("PDF file downloaded successfully!");
        }
      } catch (error) {
        toast.error("Failed to generate file");
        console.error(error);
      }
      
      // Reset refs after download
      jobIdRef.current = null;
      formatRef.current = null;
      
      // Clear current job from cache
      queryClient.removeQueries({ queryKey: ["download", "current-job"] });
    }
    
    // Handle failure
    if (statusData?.status === 'failed') {
      toast.error(statusData.error || "Report generation failed");
      jobIdRef.current = null;
      formatRef.current = null;
      queryClient.removeQueries({ queryKey: ["download", "current-job"] });
    }
  }, [statusData, queryClient]);

  const initiateDownload = async (filters, format) => {

    // console.log(filters,format);
    
    formatRef.current = format;
    
    try {
      const result = await initiateMutation.mutateAsync({ filters, format });
      jobIdRef.current = result.jobId;
    } catch (error) {
      console.error('Download initiation failed:', error);
      formatRef.current = null;
    }
  };

  return {
    initiateDownload,
    isDownloading: initiateMutation.isPending || isPolling,
    progress: statusData?.progress || 0,
    error: initiateMutation.error?.message || 
           (statusData?.status === 'failed' ? statusData.error : null),
    status: statusData?.status || 'idle',
  };
};
