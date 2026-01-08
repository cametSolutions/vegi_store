// src/hooks/downloadHooks/transaction/useTransactionSummaryDownload.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import { transactionSummaryDownloadHelper } from "@/helper/downloadHelper/transaction/transactionSummaryDownloadHelper";
import { downloadMutations } from "../../mutations/downloadMutations";
import { downloadQueries } from "../../queries/download.queries";

export const useTransactionSummaryDownload = () => {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState(null);

  const reportTypeRef = useRef("transaction-summary");
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

  // Mutation to start the background job
  const initiateMutation = useMutation({
    ...downloadMutations.initiateDownloadTransactionSummary(queryClient),
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast.info("Report generation started...");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start download");
    },
  });

  // Poll for status
  const { data: statusData } = useQuery({
    ...downloadQueries.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });

  // Handle Completion
  useEffect(() => {
    if (statusData?.status === "completed" && jobId && formatRef.current) {
      const { data, fileName } = statusData;

      const dataObj = {
        ...contextRef.current,
        company: selectedCompanyFromStore,
      };

      try {
        if (formatRef.current === "excel") {
          transactionSummaryDownloadHelper.generateExcel(data, fileName, dataObj);
          toast.success("Excel file downloaded successfully!");
        } else if (formatRef.current === "pdf") {
          transactionSummaryDownloadHelper.generatePDF(data, fileName, dataObj);
          toast.success("PDF file downloaded successfully!");
        }
      } catch (error) {
        toast.error("Failed to generate file");
        console.error("File generation error:", error);
      }

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
  }, [statusData, queryClient, jobId, selectedCompanyFromStore]);

  // Public function called by the UI
  const initiateDownload = async (
    filters,
    format,
    reportType = "transaction-summary"
  ) => {
    reportTypeRef.current = reportType;
    formatRef.current = format;

    contextRef.current = {
      transactionType: filters.transactionType,
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: filters.company,
      branch: filters.branch,
      searchTerm: filters.searchTerm,
    };

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

    initiateMutation.mutate(payload);
  };

  return {
    initiateDownload,
    isDownloading: initiateMutation.isPending || (!!jobId && statusData?.status !== "completed"),
    progress: statusData?.progress || 0,
    status: statusData?.status,
  };
};
