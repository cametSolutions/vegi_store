import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { priceLevelQueries } from "../../../hooks/queries/priceLevel.queries";
import { priceLevelMutations } from "../../../hooks/mutations/priceLevelMutations";
import { useSelector } from "react-redux";
import { Edit, LoaderCircle, Search, Trash2, X } from "lucide-react";
import DeleteConfirmDialog from "../../../components/modals/DeleteConfirmDialog";
import { Input } from "@mui/material";
import ListSearch from "@/pages/CommonTransactionListComponents/ListSearch";
import { capitalizeFirstLetter } from "../../../../../shared/utils/string";

const PriceLevelList = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  // Local state for search and delete dialog
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceLevelToDelete, setPriceLevelToDelete] = useState(null);

  // Fetch all price levels for selected company/branch
  const {
    data: priceLevels = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(priceLevelQueries.getAll(selectedCompanyFromStore, ""));

  const deleteMutation = useMutation(priceLevelMutations.delete(queryClient));

  // Client-side filtered list (by name)
  const filteredPriceLevels = useMemo(() => {
    if (!searchTerm) return priceLevels?.data || [];
    const lowerSearch = searchTerm.toLowerCase();
    return (priceLevels?.data || []).filter((pl) =>
      pl.priceLevelName.toLowerCase().includes(lowerSearch)
    );
  }, [priceLevels, searchTerm]);

  // Delete modal confirmation logic
  const handleDeleteConfirm = async () => {
    if (priceLevelToDelete) {
      await deleteMutation.mutateAsync(priceLevelToDelete._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPriceLevelToDelete(null);
          refetch();
        },
      });
    }
  };

  // Open delete modal
  const handleDelete = (pl) => {
    setPriceLevelToDelete(pl);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-1">
        Price Level List
      </h2>
      <ListSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by price level name..."
        textSize={10}
      />
      {!isError && (
        <div className="h-[calc(100vh-175px)] overflow-auto border bg-white shadow-md ">
          <table className="min-w-full table-fixed border border-gray-300 text-xs">
            <thead className="bg-slate-400 text-white sticky top-0 z-10">
              <tr>
                <th className="w-3/5 px-3 py-2 text-left border border-gray-300">
                  Price Level Name
                </th>
                <th className="w-1/5 px-3 py-2 text-center border border-gray-300">
                  Status
                </th>
                <th className="w-1/5 px-3 py-2 text-center border border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="h-[calc(100vh-250px)] border border-gray-300">
                  <td
                    colSpan={3}
                    className="py-6 text-center text-gray-500 border border-gray-300"
                  >
                    <LoaderCircle className="animate-spin mx-auto w-5 h-5" />
                    <div className="text-xs">Loading Price Levels...</div>
                  </td>
                </tr>
              ) : filteredPriceLevels.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-gray-500 border border-gray-300"
                  >
                    No price levels found.
                  </td>
                </tr>
              ) : (
                filteredPriceLevels.map((pl) => (
                  <tr
                    key={pl._id}
                    className="border border-gray-300 hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-2 truncate border border-gray-300">
                      {pl.priceLevelName}
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold  
                        
                        
                        `}
                      >
                        {capitalizeFirstLetter(pl.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center border border-gray-300">
                      <button
                        className="inline-flex items-center justify-center p-1.5 rounded text-gray-700 mx-1"
                        onClick={() => onEdit(pl)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center p-1.5 rounded text-red-700 mx-1"
                        onClick={() => handleDelete(pl)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Price Level"
        description={`Are you sure you want to delete "${priceLevelToDelete?.priceLevelName}"? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default PriceLevelList;
