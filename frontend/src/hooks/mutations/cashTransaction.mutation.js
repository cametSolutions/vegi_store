// hooks/mutations/transactionMutations.js
import { cashTransactionServices } from "../../api/services/cashTransaction.service";

export const cashtransactionMutations = {
  create: (queryClient) => ({
    mutationFn: ({ formData, transactionType }) =>
      cashTransactionServices.create(formData, transactionType),

    onSuccess: (data, variables) => {
      console.log("Transaction created successfully:", data);
    //   queryClient.invalidateQueries({
    //     queryKey: ['transaction', variables.transactionType]
    //   });
      alert('Transaction created successfully!');
    },

    onError: (error) => {
      console.error("Transaction creation failed:", error);
      alert('Error creating transaction. Please try again.');
    },
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