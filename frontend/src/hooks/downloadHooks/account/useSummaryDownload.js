// src/hooks/downloadHooks/useReportDownload.js

import { downloadHelper } from '@/helper//downloadHelper/account/summaryDownloadHelper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { downloadMutations } from '../../mutations/downloadMutations';
import { downloadQueries } from '../../queries/download.queries';

export const useReportDownload = () => {
  const queryClient = useQueryClient();
  
  const [jobId, setJobId] = useState(null);
  
  // ✅ Get selected company from Redux
  const selectedCompany = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  
  const formatRef = useRef(null);
  const contextRef = useRef({ 
    type: 'sale',
    startDate: null,
    endDate: null,
    company: null // ✅ Store company details
  });

  const initiateMutation = useMutation(
    downloadMutations.initiateDownload(queryClient)
  );
  
  const { data: statusData, isLoading: isPolling } = useQuery({
    ...downloadQueries.getJobStatus(jobId),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (statusData?.status === 'completed' && formatRef.current) {
      const { data, fileName } = statusData;
      
      try {
        if (formatRef.current === 'excel') {
          downloadHelper.generateExcel(data, fileName, contextRef.current);
          toast.success("Excel file downloaded successfully!");
        } else if (formatRef.current === 'pdf') {
          // ✅ Pass company details to PDF
          downloadHelper.generatePDF(data, fileName, contextRef.current);
          toast.success("PDF file downloaded successfully!");
        }
      } catch (error) {
        toast.error("Failed to generate file");
        console.error("File generation error:", error);
      }
      
      const timer = setTimeout(() => {
        setJobId(null);
        formatRef.current = null;
        contextRef.current = { type: 'sale', startDate: null, endDate: null, company: null };
        queryClient.removeQueries({ queryKey: ["download", "current-job"] });
      }, 2000);

      return () => clearTimeout(timer);
    }
    
    if (statusData?.status === 'failed') {
      toast.error(statusData.error || "Report generation failed");
      setJobId(null);
      formatRef.current = null;
      contextRef.current = { type: 'sale', startDate: null, endDate: null, company: null };
      queryClient.removeQueries({ queryKey: ["download", "current-job"] });
    }
  }, [statusData, queryClient]);

  const initiateDownload = async (filters, format) => {
    formatRef.current = format;
    
    // ✅ Capture all details including company
    contextRef.current = { 
      type: filters.transactionType || 'sale',
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: selectedCompany // ✅ Pass company object
    };
    
    try {
      const result = await initiateMutation.mutateAsync({ filters, format });
      setJobId(result.jobId);
    } catch (error) {
      console.error('Download initiation failed:', error);
      formatRef.current = null;
      contextRef.current = { type: 'sale', startDate: null, endDate: null, company: null };
    }
  };

  return {
    initiateDownload,
    isDownloading: initiateMutation.isPending || (!!jobId && statusData?.status !== 'completed'),
    progress: statusData?.status === 'completed' ? 100 : (statusData?.progress || 0),
    error: initiateMutation.error?.message || 
           (statusData?.status === 'failed' ? statusData.error : null),
    status: statusData?.status || 'idle',
  };
};
