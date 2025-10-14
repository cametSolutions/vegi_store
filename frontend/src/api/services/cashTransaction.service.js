import axios from "axios";
import { api } from "../client/apiClient.js";
import { createResourceApi } from "../client/apiFactory.js";

// Base account master API using the generic factory
export const cashTransactionApi = createResourceApi("transaction", {
  //   create: "create",
  getAll: "getall",
  update: "update",
  delete: "delete",
});

// Account Master specific additional methods
export const cashTransactionServices = {
  // Inherit all base methods
  ...cashTransactionApi,

  // Custom search method specific to account master
  create: async (formData, transactionType) => {
    console.log("formdata",transactionType)
    try {
      const response = await api.post(
        `/transaction/${transactionType}/createFundTransaction`,
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
