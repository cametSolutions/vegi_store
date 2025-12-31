import { downloadHelper } from "@/helper/downloadHelper/downloadHelper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { downloadMutations } from "../mutations/downloadMutations";
import { downloadQueries } from "../queries/download.queries";

export const useReportDownload = () => {
  const queryClient = useQueryClient();

  // State for polling control
  const [jobId, setJobId] = useState(null);

  // Refs to persist data across renders without triggering re-renders
  const formatRef = useRef(null);
  const contextRef = useRef({}); // Stores 'sale' or 'purchase' context

  // Mutation to initiate download
  const initiateMutation = useMutation(
    downloadMutations.initiateDownload(queryClient)
  );

  // Query to poll job status
  const { data: statusData, isLoading: isPolling } = useQuery({
    ...downloadQueries.getJobStatus(jobId),
    enabled: !!jobId,
  });

  // Handle completion
  useEffect(() => {
    // Check if job is completed and we have the user's requested format
    if (statusData?.status === "completed" && formatRef.current) {
      const { data, fileName } = statusData;

      try {
        if (formatRef.current === "excel") {
          downloadHelper.generateExcel(data, fileName, contextRef.current);
          toast.success("Excel file downloaded successfully!");
        } else if (formatRef.current === "pdf") {
          downloadHelper.generatePDF(data, fileName, contextRef.current);
          toast.success("PDF file downloaded successfully!");
        }
      } catch (error) {
        toast.error("Failed to generate file");
        console.error("File generation error:", error);
      }

      // / 3. ✅ WAIT 2 SECONDS (Let user see 100% / Checkmark)
      const timer = setTimeout(() => {
        setJobId(null);
        formatRef.current = null;
        contextRef.current = {};
        queryClient.removeQueries({ queryKey: ["download", "current-job"] });
      }, 2000);

      // Clear cache to prevent old data from reappearing
      queryClient.removeQueries({ queryKey: ["download", "current-job"] });
    }

    // Handle failure
    if (statusData?.status === "failed") {
      toast.error(statusData.error || "Report generation failed");
      setJobId(null);
      formatRef.current = null;
      contextRef.current = {};
      queryClient.removeQueries({ queryKey: ["download", "current-job"] });
    }
  }, [statusData, queryClient]);

  const initiateDownload = async (filters, format) => {
    formatRef.current = format;

    // Capture transaction type for dynamic headers (defaults to 'sale')
    contextRef.current = {
      type: filters.transactionType || "sale",
    };

    try {
      const result = await initiateMutation.mutateAsync({ filters, format });
      // Start polling by setting state
      setJobId(result.jobId);
    } catch (error) {
      console.error("Download initiation failed:", error);
      formatRef.current = null;
      contextRef.current = {};
    }
  };

  return {
    initiateDownload,
    isDownloading:
      initiateMutation.isPending ||
      (!!jobId && statusData?.status !== "completed"),
    progress: statusData?.progress || 0,
    error:
      initiateMutation.error?.message ||
      (statusData?.status === "failed" ? statusData.error : null),
    status: statusData?.status || "idle",
  };
};
