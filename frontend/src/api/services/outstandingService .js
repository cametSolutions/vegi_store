// src/api/services/outstanding.service.js
import axios from "axios";
import { api } from "../client/apiClient.js";

export const outstandingService = {
  // Get all customers with outstanding balances
  getCustomersList: async (companyId, branchId, params = {}) => {
    try {
      const response = await api.get(
        `/reports/getOutstandingCustomers/${companyId}/${branchId}`,
        {
          params: {
            ...(params.search && { search: params.search }),
            ...(params.minAmount && { minAmount: params.minAmount }),
            ...(params.accountType && { accountType: params.accountType }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch outstanding customers"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get outstanding details for a specific customer
  getCustomerDetails: async (companyId, branchId, customerId, params = {}) => {
    try {
      const response = await api.get(
        `/reports/getCustomerOutstandingDetails/${companyId}/${branchId}/${customerId}`,
        {
          params: {
            ...(params.outstandingType && params.outstandingType !== 'all' && { 
              outstandingType: params.outstandingType 
            }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.page && { page: params.page }),
            ...(params.limit && { limit: params.limit }),
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch customer outstanding details"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get outstanding report
  getReport: async (companyId, branchId, params = {}) => {
    try {
      const response = await api.get(`/reports/outstanding-report`, {
        params: {
          companyId,
          branchId,
          ...(params.accountId && { accountId: params.accountId }),
          ...(params.accountType && { accountType: params.accountType }),
          ...(params.outstandingType && { outstandingType: params.outstandingType }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.status && { status: params.status }),
          ...(params.page && { page: params.page }),
          ...(params.limit && { limit: params.limit }),
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch outstanding report"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get outstanding summary
  getSummary: async (companyId, branchId, params = {}) => {
    try {
      const response = await api.get(`/reports/outstanding-summary`, {
        params: {
          companyId,
          branchId,
          ...(params.accountType && { accountType: params.accountType }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          "Failed to fetch outstanding summary"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Export to Excel
  exportToExcel: async (companyId, branchId, customerId, params = {}) => {
    try {
      const response = await api.get(
        `/reports/outstanding/${companyId}/${branchId}/${customerId}/export/excel`,
        {
          params: {
            ...(params.outstandingType && { outstandingType: params.outstandingType }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
          },
          responseType: "blob",
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `outstanding_${customerId}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
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

  // Export to PDF
  exportToPDF: async (companyId, branchId, customerId, params = {}) => {
    try {
      const response = await api.get(
        `/reports/outstanding/${companyId}/${branchId}/${customerId}/export/pdf`,
        {
          params: {
            ...(params.outstandingType && { outstandingType: params.outstandingType }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
          },
          responseType: "blob",
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `outstanding_${customerId}_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
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
