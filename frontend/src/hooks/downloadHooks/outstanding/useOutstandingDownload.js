// src/hooks/downloadHooks/outstanding/useOutstandingDownload.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { outstandingDownloadHelper } from "@/helper/downloadHelper/outstanding/outstandingDownloadHelper";
import { downloadServices } from "@/api/services/download.service"; 

export const useOutstandingDownload = () => {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState(null);
  const formatRef = useRef(null);
  const contextRef = useRef({});

  const selectedCompany = useSelector(state => state.companyBranch?.selectedCompany);

  // Mutation to start job
  const initiateMutation = useMutation({
    mutationFn: ({ filters, format }) => downloadServices.initiateDownloadOutstandingSummary(filters, format),
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast.info("Generating statement...");
    },
    onError: (err) => toast.error(err.message || "Download failed to start"),
  });

  // Poll status
  // ✅ FIX: 'netOutstanding' etc are INSIDE 'statusData', not siblings.
  // We only need to destructure 'data' as 'statusData'.
  const { data: statusData } = useQuery({
    queryKey: ["download", "status", jobId],
    queryFn: () => downloadServices.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === "completed" || status === "failed") ? false : 2000;
    },
  });

  // Handle Completion
  useEffect(() => {
    if (statusData?.status === "completed" && jobId && formatRef.current) {
      
      // ✅ We extract fileName, but we pass the WHOLE statusData object to the helper
      // because it contains: data[], totalOutstanding, totalDr, totalCr
      const { fileName } = statusData;
      
      const context = {
        ...contextRef.current,
        company: selectedCompany
      };

      try {
        if (formatRef.current === "excel") {
          // ✅ Passing full statusData object
          outstandingDownloadHelper.generateExcel(statusData, fileName, context);
        } else {
          // ✅ Passing full statusData object
          outstandingDownloadHelper.generatePDF(statusData, fileName, context);
        }
        toast.success("Statement downloaded successfully");
      } catch (err) {
        console.error(err);
        toast.error("File generation failed");
      }

      // Cleanup
      setTimeout(() => {
        setJobId(null);
        formatRef.current = null;
      }, 1000);
    }
  }, [statusData, jobId, selectedCompany]);

  const initiateDownload = (filters, format) => {
    formatRef.current = format;
    contextRef.current = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      partyName: filters.partyName
    };

    initiateMutation.mutate({ filters, format });
  };

  return {
    initiateDownload,
    isDownloading: initiateMutation.isPending || (!!jobId && statusData?.status !== "completed"),
    progress: statusData?.progress || 0
  };
};
