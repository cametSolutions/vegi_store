// hooks/mutations/transactionMutations.js
import { cashTransactionServices } from "../../api/services/cashTransaction.service";

export const cashtransactionMutations = {
  create: (queryClient) => ({
  mutationFn: ({ formData, transactionType }) =>
    cashTransactionServices.create(formData, transactionType),

  onSuccess: (response, variables) => {
    // The response structure based on your logs shows the transaction is directly in response
    const transaction = response?.data || response;
    
    const company = transaction?.company?._id || transaction?.company;
    const branch = transaction?.branch?._id || transaction?.branch;
    const transactionType = transaction?.__t?.toLowerCase() || variables.transactionType;

    console.log("Invalidating queries for:", { company, branch, transactionType });

    // Invalidate the transaction list query
    queryClient.invalidateQueries({
      queryKey: ["transactions", transactionType, "", company, branch],
    });

    // Also invalidate without filters to refresh all lists
    queryClient.invalidateQueries({
      queryKey: ["transactions", transactionType],
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
    console.error("Transaction creation failed:", error);
  }
}),

  update: (queryClient) => ({
    mutationFn: ({ id, formData, transactionType }) =>
      cashTransactionServices.update(id, formData, transactionType),

    onSuccess: (data, variables) => {
      console.log("Transaction updated successfully:", data);
      queryClient.invalidateQueries({
        queryKey: ['transaction', variables.transactionType]
      });
      // Also invalidate the specific transaction query
      queryClient.invalidateQueries({
        queryKey: ['transaction', variables.id]
      });
      alert('Transaction updated successfully!');
    },

    onError: (error) => {
      console.error("Transaction update failed:", error);
      alert('Error updating transaction. Please try again.');
    },
  }),
}