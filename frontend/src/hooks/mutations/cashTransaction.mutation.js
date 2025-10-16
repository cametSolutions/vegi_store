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
    const transaction = response?.data || response;
    
    const company = transaction?.company?._id || transaction?.company;
    const branch = transaction?.branch?._id || transaction?.branch;
    const transactionType = transaction?.__t?.toLowerCase() || variables.transactionType;


    // Invalidate the transaction list query
    queryClient.invalidateQueries({
      queryKey: ["transactions", transactionType, "", company, branch],
    });

    toast.success(`${capitalizeFirstLetter(transactionType)} Transaction created successfully!`);


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
    toast.error('Error creating transaction. Please try again.');
    
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