import { api } from "../client/apiClient";
import { createResourceApi } from "../client/apiFactory";

export const downloadApi = createResourceApi("download", {});

export const downloadServices = {
  // Inherit all base methods
  ...downloadApi,

  // Initiate download for account summary - FIXED: GET request with query params, not POST with body
  initiateDownload: async (filters, format) => {
    try {
      const response = await api.get("/download/account-summary", {
        params: { ...filters, format }, // This is correct for query params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  initiateDownloadItemSummary: async (filters, format) => {
    try {
 
      
      const response = await api.get("/download/item-summary", {
        params: { ...filters, format }, // This is correct for query params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  initiateDownloadTransactionSummary: async (filters, format) => {
    try {
      const response = await api.get("/download/transaction-summary", {
        params: { ...filters, format }, // This is correct for query params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },



  // Check job status - FIXED: Use axios response format
  getJobStatus: async (jobId) => {
    try {
      const response = await api.get(`/download/status/${jobId}`);
      return response.data; // axios uses response.data, not response.json()
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },
};
