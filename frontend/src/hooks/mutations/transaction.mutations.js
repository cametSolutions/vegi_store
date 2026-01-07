// hooks/mutations/transactionMutations.js
import { toast } from "sonner";
import { transactionServices } from "../../api/services/transaction.service";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";

export const transactionMutations = {
  create: (queryClient) => ({
    mutationFn: ({ formData, transactionType }) =>
      transactionServices.create(formData, transactionType),

    onSuccess: (response, variables) => {
      // The response structure is { success, message, data: { transaction, ... } }
      const { company, branch, transactionType, _id } =
        response?.data?.transaction;
      queryClient.invalidateQueries({
        queryKey: ["transactions", transactionType, "", company, branch],
      });
 
      queryClient.invalidateQueries({
        queryKey: ["reports" ]
      });

queryClient.invalidateQueries({
        queryKey: ["items"], refetchType: 'all'
      });

      toast.success(
        `${capitalizeFirstLetter(
          response?.data?.transaction?.transactionType || "Transaction"
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

    onSuccess: (response, variables) => {
      const { company, branch, transactionType, _id } =
        response?.data?.transaction;

      queryClient.invalidateQueries({
        queryKey: [
          "transactions",
          "getById",
          company,
          branch,
          _id,
          transactionType,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ["transactions", transactionType, "", company, branch],
      });

       queryClient.invalidateQueries({
        queryKey: ["reports"]
      });

      queryClient.invalidateQueries({
        queryKey: ["items"], refetchType: 'all'
      });

      toast.success(
        `${capitalizeFirstLetter(
          response?.data?.transaction?.transactionType || "Transaction"
        )} created successfully!`
      );
      // Also invalidate the specific transaction query
      queryClient.invalidateQueries({
        queryKey: ["transaction", variables.id],
      });
    },

    onError: (error) => {
      console.error("Transaction update failed:", error);
      toast.error("Error updating transaction. Please try again.");
    },
  }),
};
