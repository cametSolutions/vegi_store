import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import { accountMasterQueries } from "../../../hooks/queries/accountMaster.queries";
import { accountMasterMutations } from "../../../hooks/mutations/accountMaster.mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, X, LoaderCircle, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import DeleteConfirmDialog from "../../../components/modals/DeleteConfirmDialog";

const AccountMasterList = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const DEBOUNCE_DELAY = 500;
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    ...accountMasterQueries.list(debouncedSearchTerm, selectedCompanyFromStore),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        const loadedRecords = allPages.reduce(
          (acc, page) => acc + (page.data.length || 0),
          0
        );
        return loadedRecords;
      }
      return undefined;
    },
    enabled: !!selectedCompanyFromStore,
  });

  const deleteMutation = useMutation(
    accountMasterMutations.delete(queryClient)
  );

  const allAccounts = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data || []) || [];
  }, [data]);

  const handleDelete = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate(accountToDelete._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setAccountToDelete(null);
          refetch();
        },
      });
    }
  };

  return (
    <div className="bg-white flex flex-col h-full border rounded">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <h2 className="text-sm font-bold shadow-lg p-2 px-4">Account List</h2>
        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error and Loading handling */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-red-500 gap-2 h-[calc(100vh-200px)]">
          <p className="text-gray-500 text-xs font-semibold">
            !Oops..Error loading items
          </p>
          <button
            onClick={refetch}
            className="text-[10px] cursor-pointer font-semibold bg-blue-400 p-1 px-2 text-white rounded mt-2"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500 h-[calc(100vh-200px)] text-xs">
          <LoaderCircle className="animate-spin w-6 h-6" />
          <span>Loading accounts...</span>
        </div>
      ) : (
        !isError && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Fixed Table Header */}
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="bg-slate-400 text-white">
                  <th className="p-2 text-left w-[30%]">Name</th>
                  <th className="p-2 text-center w-[25%]">Type</th>
                  <th className="p-2 text-center w-[20%]">Status</th>
                  <th className="p-2 text-center w-[20%]">Price Level</th>
                  <th className="p-2 text-right pr-4 w-[25%]">Actions</th>
                </tr>
              </thead>
            </table>

            {/* Scrollable Table Body */}
            <InfiniteScroll
              dataLength={allAccounts.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage && !isFetchingNextPage}
                 height="calc(100vh - 200px)"
              loader={
                <div className="text-center py-4 text-gray-500">
                  <LoaderCircle className="animate-spin mx-auto w-5 h-5" />
                  <p className="mt-2 text-xs">Loading more...</p>
                </div>
              }
              endMessage={
                allAccounts.length > 0 && (
                  <div className="text-center text-xs py-4  text-gray-400 ">
                    No more accounts
                  </div>
                )
              }
              scrollThreshold={0.8}
            >
              {allAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No accounts found.
                </div>
              ) : (
                <table className="w-full text-xs table-fixed">
                  <tbody>
                    {allAccounts.map((acc) => (
                      <tr key={acc._id} className="hover:bg-gray-50 border-b">
                        <td className="p-2 w-[30%]">{acc.accountName}</td>
                        <td className="p-2 capitalize text-center w-[25%]">
                          {acc.accountType}
                        </td>
                        <td className="p-2 capitalize text-center w-[20%]">
                          {acc.status}
                        </td>
                        <td className="p-2 capitalize text-center w-[20%] truncate">
                          {acc.priceLevel?.priceLevelName || "N/A"}
                        </td>
                        <td className="p-2 text-right space-x-2 w-[25%]">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => onEdit(acc)}
                            disabled={deleteMutation.isLoading}
                            className="h-6 w-6"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(acc)}
                            disabled={deleteMutation.isLoading}
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </InfiniteScroll>
          </div>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Account"
        description={`Are you sure you want to delete "${accountToDelete?.accountName}"? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default AccountMasterList;
