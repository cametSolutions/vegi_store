import React, { useState, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import { branchMasterQueries } from "../../../hooks/queries/branchMaster.queries";
import { branchMasterMutations } from "../../../hooks/mutations/branchMasterMutation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, X, LoaderCircle, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import DeleteConfirmDialog from "../../../components/modals/DeleteConfirmDialog";

const BranchMasterList = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

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
    ...branchMasterQueries.list(debouncedSearchTerm),
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
  });

  const deleteMutation = useMutation(
    branchMasterMutations.delete(queryClient)
  );

  const allBranches = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data || []) || [];
  }, [data]);

  const handleDelete = (branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      deleteMutation.mutate(branchToDelete._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setBranchToDelete(null);
          refetch();
        },
      });
    }
  };

  return (
    <div className="bg-white flex flex-col h-full border rounded">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <h2 className="text-sm font-bold shadow-lg p-2 px-4">Branch List</h2>
        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search branches..."
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
            !Oops..Error loading branches
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
          <span>Loading branches...</span>
        </div>
      ) : (
        !isError && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Fixed Table Header */}
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="bg-slate-400 text-white">
                  <th className="p-2 text-left w-[25%]">Branch Name</th>
                  <th className="p-2 text-center w-[20%]">City</th>
                  <th className="p-2 text-center w-[15%]">Mobile</th>
                  <th className="p-2 text-center w-[15%]">Status</th>
                  <th className="p-2 text-right pr-4 w-[25%]">Actions</th>
                </tr>
              </thead>
            </table>

            {/* Scrollable Table Body */}
            <InfiniteScroll
              dataLength={allBranches.length}
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
                allBranches.length > 0 && (
                  <div className="text-center text-xs py-4 text-gray-400">
                    No more branches
                  </div>
                )
              }
              scrollThreshold={0.8}
            >
              {allBranches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No branches found.
                </div>
              ) : (
                <table className="w-full text-xs table-fixed">
                  <tbody>
                    {allBranches.map((branch) => (
                      <tr
                        key={branch._id}
                        className="hover:bg-gray-50 border-b"
                      >
                        <td className="p-2 w-[25%] truncate">
                          {branch.branchName}
                        </td>
                        <td className="p-2 text-center w-[20%]">
                          {branch.city}
                        </td>
                        <td className="p-2 text-center w-[15%]">
                          {branch.mobile}
                        </td>
                        <td className="p-2 text-center w-[15%]">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              branch.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {branch.status}
                          </span>
                        </td>
                        <td className="p-2 text-right space-x-2 w-[25%]">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => onEdit(branch)}
                            disabled={deleteMutation.isLoading}
                            className="h-6 w-6"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(branch)}
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
        title="Delete Branch"
        description={`Are you sure you want to delete "${branchToDelete?.branchName}"? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default BranchMasterList;