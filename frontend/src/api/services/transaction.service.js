import axios from "axios";
import { api } from "../client/apiClient.js";
import { createResourceApi } from "../client/apiFactory.js";

// Base account master API using the generic factory
export const transactionApi = createResourceApi("transaction", {
  //   create: "create",
  getAll: "getall",
  update: "update",
  delete: "delete",
});

// Account Master specific additional methods
export const transactionServices = {
  // Inherit all base methods
  ...transactionApi,

  // Custom search method specific to account master
  create: async (formData, transactionType) => {
    try {
      const response = await api.post(
        `/transaction/${transactionType}/create`,
        formData
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  getAll: async (
    transactionType,
    pageParam = 1,
    limit = 25,
    searchTerm = "",
    companyId,
    branchId,
    sortBy,
    sortOrder, 
     startDate, // ✅ ADD
    endDate 
  ) => {
    try {
      const response = await api.get(`/transaction/${transactionType}/getall`, {
        params: {
          page: pageParam,
          limit,
          searchTerm,
          companyId,
          branchId,
          transactionType,
          sortBy,
          sortOrder,
          startDate: startDate?.toISOString(), // ✅ ADD
          endDate: endDate?.toISOString(), 
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  getById: async (companyId, branchId, transactionId, transactionType) => {
    try {
      const response = await api.get(
        `/transaction/${transactionType}/getTransactionDetails/${transactionId}?companyId=${companyId}&branchId=${branchId}&transactionId=${transactionId}&transactionType=${transactionType}`
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

    update: async (id, formData, transactionType ) => {
    try {
      const response = await api.put(
        `/transaction/${transactionType}/edit/${id}`,
        formData
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

};
