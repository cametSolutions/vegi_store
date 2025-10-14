// hooks/mutations/transactionMutations.js
import { toast } from "sonner";
import { transactionServices } from "../../api/services/transaction.service";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";

export const transactionMutations = {
  create: (queryClient) => ({
    mutationFn: ({ formData, transactionType }) =>
      transactionServices.create(formData, transactionType),

    onSuccess: (data, variables) => {
      //   queryClient.invalidateQueries({
      //     queryKey: ['transaction', variables.transactionType]
      //   });
      toast.success(
        `${capitalizeFirstLetter(
          data?.transaction?.transactionType || "Transaction"
        )} created successfully!`
      );
    },

    onError: (error) => {
      console.error("Transaction creation failed:", error);
      toast.error("Error creating transaction. Please try again.");
    },
  }),

  update: (queryClient) => ({
    mutationFn: ({ id, formData, transactionType }) =>
      transactionServices.update(id, formData, transactionType),

    onSuccess: (data, variables) => {
      console.log("Transaction updated successfully:", data);
      queryClient.invalidateQueries({
        queryKey: ["transaction", variables.transactionType],
      });
      // Also invalidate the specific transaction query
      queryClient.invalidateQueries({
        queryKey: ["transaction", variables.id],
      });
      alert("Transaction updated successfully!");
    },

    onError: (error) => {
      console.error("Transaction update failed:", error);
      alert("Error updating transaction. Please try again.");
    },
  }),
};
