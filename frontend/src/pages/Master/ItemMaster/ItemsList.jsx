import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import { itemMasterQueries } from "../../../hooks/queries/item.queries";
import { itemMasterMutations } from "../../../hooks/mutations/itemMasterMutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DeleteConfirmDialog from "../../../components/modals/DeleteConfirmDialog";
import { Search, Edit, Trash2, X, LoaderCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { truncate } from "../../../../../shared/utils/string";

const ItemsList = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
  } = useInfiniteQuery(
    itemMasterQueries.list(selectedCompanyFromStore, debouncedSearchTerm)
  );

  const deleteMutation = useMutation(itemMasterMutations.delete(queryClient));

  const allItems = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data.items) || [];
  }, [data]);

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          // Optionally refetch list after delete
          refetch();
        },
      });
    }
  };

  // Main render logic
  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <h2 className="text-sm font-bold shadow-lg p-2 px-4">Items List</h2>
        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search items..."
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

      {/* Error Handling */}
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

      {/* Table Container */}
      {!isError && (
        <div className="flex-1 border overflow-hidden flex flex-col">
          {/* Fixed Table Header - Outside Scroll */}
          <div className="flex-shrink-0 bg-slate-400 text-white border-b">
            <div className="flex w-full">
              <div className="p-2 font-semibold text-xs w-[40%] text-left">
                Item Name
              </div>
              <div className="p-2 font-semibold text-xs w-[25%] text-left">
                Code
              </div>
              <div className="p-2 font-semibold text-xs w-[20%] text-left">
                Unit
              </div>
              <div className="p-2 pr-8 font-semibold text-xs w-[15%] text-right">
                Actions
              </div>
            </div>
          </div>
          {/* Scrollable Body */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500  h-[calc(100vh-200px)]">
                <LoaderCircle className="animate-spin mx-auto w-5 h-5" />
                <div className="text-xs">Loading items...</div>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={allItems.length}
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
                  allItems.length > 0 && (
                    <div className="text-center py-4 text-xs text-gray-400">
                      No more items
                    </div>
                  )
                }
                scrollThreshold={0.8}
              >
                <div className="w-full">
                  {allItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No items found
                    </div>
                  ) : (
                    allItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex w-full border-b hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-3 py-2 text-xs font-medium w-[40%]">
                          {truncate(item.itemName,20)}
                        </div>
                        <div className="px-3 py-2 text-xs w-[25%]">
                          {item.itemCode}
                        </div>
                        <div className="px-3 py-2 text-xs uppercase w-[20%]">
                          {item.unit}
                        </div>
                        <div className="px-3 py-2 w-[15%]">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => onEdit(item)}
                              className="h-6 w-6"
                              disabled={deleteMutation.isPending}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </InfiniteScroll>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.itemName}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ItemsList;
