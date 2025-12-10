// hooks/mutations/transactionMutations.js
import { toast } from "sonner";
import { cashTransactionServices } from "../../api/services/cashTransaction.service";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";

export const cashtransactionMutations = {
  create: (queryClient) => ({
    mutationFn: ({ formData, transactionType }) =>
      cashTransactionServices.create(formData, transactionType),

    onSuccess: (response, variables) => {
      // The response structure based on your logs shows the transaction is directly in response
      const transaction = response?.data.transaction;

      const company = transaction?.company;
      const branch = transaction?.branch;
      const transactionType = transaction?.transactionType;

      // Invalidate the transaction list query
      queryClient.invalidateQueries({
        queryKey: ["transactions", transactionType, "", company, branch],
      });

      toast.success(
        `${capitalizeFirstLetter(transactionType)} created successfully!`
      );

      // Invalidate account balance if needed
      if (transaction?.account) {
        const accountId = transaction.account._id || transaction.account;
        queryClient.invalidateQueries({
          queryKey: ["account", accountId],
        });
      }
    },

    onError: (error) => {
      console.error("Transaction creation failed:", error);
      toast.error("Error creating transaction. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData, transactionType }) =>
      cashTransactionServices.update(id, formData, transactionType),

    onSuccess: (data, variables) => {
      const transaction = data.data.transaction;
      const { company, branch, transactionType } = transaction;
      toast.success(
        `${capitalizeFirstLetter(transactionType)}  updated successfully!`
      );

      // Invalidate the transaction list query
      queryClient.invalidateQueries({
        queryKey: ["transactions", transactionType, "", company, branch],
      });
      // Invalidate account balance if needed
      if (transaction?.account) {
        const accountId = transaction.account._id || transaction.account;
        queryClient.invalidateQueries({
          queryKey: ["account", accountId],
        });
      }
    },

    onError: (error) => {
      console.error("Transaction update failed:", error);
      toast.error("Error updating transaction. Please try again.");
    },
  }),
};
