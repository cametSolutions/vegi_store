// src/hooks/mutations/downloadMutations.js
import { downloadServices } from "@/api/services/download.service";

export const downloadMutations = {
  // Existing Account Download
  initiateDownload: (queryClient) => ({
    mutationFn: ({ filters, format }) => 
      downloadServices.initiateDownload(filters, format),
  }),

  // ✅ FIXED: Removed 'async' keyword here
  initiateDownloadItemSummary: (queryClient) => ({
    mutationFn: ({ filters, format }) => 
      downloadServices.initiateDownloadItemSummary(filters, format),
  }),  

    initiateDownloadTransactionSummary: (queryClient) => ({
    mutationFn: ({ filters, format }) => 
      downloadServices.initiateDownloadTransactionSummary(filters, format),
  }),  


};
