import { useMutation, useQueryClient } from "@tanstack/react-query";
import { priceLevelServices } from "../../api/services/priceLevel.service";
import { priceLevelQueries } from "../../hooks/queries/priceLevel.queries";

export const priceLevelMutations = {
  // Create price level
  useCreate: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data) => priceLevelServices.create(data),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        options.onSuccess?.(data, variables);
      },
      onError: options.onError,
    });
  },

  // Update price level
  useUpdate: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }) => priceLevelServices.update(id, data),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        queryClient.setQueryData(
          [...priceLevelQueries.all(), "detail", variables.id],
          data
        );
        options.onSuccess?.(data, variables);
      },
      onError: options.onError,
    });
  },

  // Delete price level
  useDelete: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id) => priceLevelServices.delete(id),
      onSuccess: (data, id) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        options.onSuccess?.(data, id);
      },
      onError: options.onError,
    });
  },

  // Allocate to branches
  useAllocateBranches: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, branchIds }) =>
        priceLevelServices.allocateToBranches(id, branchIds),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        options.onSuccess?.(data, variables);
      },
      onError: options.onError,
    });
  },

  // Remove from branches
  useRemoveBranches: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, branchIds }) =>
        priceLevelServices.removeFromBranches(id, branchIds),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        options.onSuccess?.(data, variables);
      },
      onError: options.onError,
    });
  },

  // Update status
  useUpdateStatus: (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, status }) =>
        priceLevelServices.updateStatus(id, status),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: priceLevelQueries.all(),
        });
        options.onSuccess?.(data, variables);
      },
      onError: options.onError,
    });
  },
};
