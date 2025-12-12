import axios from "axios";
import { api } from "../client/apiClient.js";

export const transactionSummaryService = {
  // Get transaction summary with filters
  getSummary: async (companyId, branchId, transactionType, params = {}) => {
    try {
      const response = await api.get(
        `/reports/transaction-summary/${companyId}/${branchId}/${transactionType}`,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.search && { search: params.search }),
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch transaction summary"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Export to Excel (if needed in future)
  exportToExcel: async (companyId, branchId, transactionType, params = {}) => {
    try {
      const response = await api.get(
        `/reports/transaction-summary/${companyId}/${branchId}/${transactionType}/export/excel`,
        {
          params: {
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.search && { search: params.search }),
          },
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          "Failed to export to Excel"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Export to PDF (if needed in future)
  exportToPDF: async (companyId, branchId, transactionType, params = {}) => {
    try {
      const response = await api.get(
        `/reports/transaction-summary/${companyId}/${branchId}/${transactionType}/export/pdf`,
        {
          params: {
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.search && { search: params.search }),
          },
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          "Failed to export to PDF"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },
};