// src/hooks/downloadHooks/item/useItemSummaryDownload.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

import { itemSummaryDownloadHelper } from "@/helper/downloadHelper/item/itemSummaryDownloadHelper";
import { downloadMutations } from "../../mutations/downloadMutations";
import { downloadQueries } from "../../queries/download.queries";
import { useSelector } from "react-redux";

export const useReportDownload = () => {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState(null);

  // Refs to hold download context
  const formatRef = useRef(null);
  const contextRef = useRef({
    transactionType: "sale",
    startDate: null,
    endDate: null,
    company: null,
    branch: null,
    searchTerm: null,
  });

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );

  // 1. Mutation to start the background job
  // We spread the config from downloadMutations, then overwrite onSuccess/onError with our local logic
  const initiateMutation = useMutation({
    ...downloadMutations.initiateDownloadItemSummary(queryClient),

    onSuccess: (data) => {
      console.log("✅ Mutation Success:", data);
      setJobId(data.jobId);
      toast.info("Report generation started...");
    },
    onError: (error) => {
      console.error("❌ Mutation Error:", error);
      toast.error(error.message || "Failed to start download");
    },
  });

  // 2. Poll for status (only when jobId exists)
  const { data: statusData, isLoading: isPolling } = useQuery({
    ...downloadQueries.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });

  // 3. Handle Completion
  useEffect(() => {
    if (statusData?.status === "completed" && formatRef.current) {
      const { data, fileName } = statusData;

      const dataObj = {
        ...contextRef.current,
        company: selectedCompanyFromStore,
      };

      try {
        if (formatRef.current === "excel") {
          itemSummaryDownloadHelper.generateExcel(
            data,
            fileName,
            dataObj
          );
          toast.success("Excel file downloaded successfully!");
        } else if (formatRef.current === "pdf") {
          itemSummaryDownloadHelper.generatePDF(
            data,
            fileName,
            dataObj
          );
          toast.success("PDF file downloaded successfully!");
        }
      } catch (error) {
        toast.error("Failed to generate file");
        console.error("File generation error:", error);
      }

      // Cleanup
      const timer = setTimeout(() => {
        setJobId(null);
        formatRef.current = null;
        queryClient.removeQueries({ queryKey: ["download", "status", jobId] });
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (statusData?.status === "failed") {
      toast.error(statusData.error || "Report generation failed");
      setJobId(null);
    }
  }, [statusData, queryClient, jobId]);

  // Public function called by the UI
  const initiateDownload = async (
    filters,
    format,
    reportType = "item-summary"
  ) => {
    formatRef.current = format;

    // Store context for the helper
    contextRef.current = {
      transactionType: filters.transactionType,
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: filters.company,
      branch: filters.branch,
      searchTerm: filters.searchTerm,
    };

    // Prepare payload
    // Note: We construct the exact object structure expected by mutationFn ({ filters, format })
    const payload = {
      format,
      filters: {
        company: filters.company,
        branch: filters.branch,
        startDate: filters.startDate,
        endDate: filters.endDate,
        transactionType: filters.transactionType,
        search: filters.searchTerm,
      },
    };

    console.log("🚀 Triggering Download Mutation with:", payload);
    initiateMutation.mutate(payload);
  };

  return {
    initiateDownload,
    isDownloading:
      initiateMutation.isPending ||
      (!!jobId && statusData?.status !== "completed"),
    progress: statusData?.progress || 0,
    status: statusData?.status,
  };
};
