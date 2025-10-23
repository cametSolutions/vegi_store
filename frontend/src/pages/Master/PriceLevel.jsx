import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { priceLevelQueries } from "../../hooks/queries/priceLevel.queries";
import { priceLevelMutations } from "../../hooks/mutations/priceLevel.mutation";

import { branchQueries } from "../../hooks/queries/branch.queries";


const PriceLevelForm = ({  editId = null, onSuccess }) => {
  const selectedCompany = useSelector(
    (state) => state.companyBranch.selectedCompany
  );

  const companyId = selectedCompany?._id || selectedCompany?.id; // adjust based on your state

  // ==================== FORM SETUP ====================
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      priceLevelName: "",
      description: "",
      status: "active",
      branches: [],
    },
  });

  // ==================== FETCH DATA FOR EDIT ====================
  const { data: editData, isLoading: isLoadingEdit } = useQuery(
    priceLevelQueries?.detail(editId)
  );

  // Use effect to populate form when edit data is loaded
  useEffect(() => {
    if (editData) {
      reset({
        priceLevelName: editData.priceLevelName || "",
        description: editData.description || "",
        status: editData.status || "active",
        branches: editData.branches?.map((b) => b._id) || [],
      });
    }
  }, [editData, reset]);

  // ==================== FETCH ALL PRICE LEVELS ====================
 // ==================== FETCH ALL PRICE LEVELS ====================
const {
  data: allPriceLevels,
  isLoading: isLoadingAll,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  ...priceLevelQueries.infiniteList(companyId, "", "active")
});

console.log("copany", companyId);

// Flatten the data for the list
const allPriceLevelsFlat = allPriceLevels?.pages
  ?.flatMap(page => page.data || []) || [];


console.log("allPriceLevels", allPriceLevels);

// ==================== FETCH BRANCH OPTIONS ====================
const { data: branchData, isLoading: isBranchLoading } = useQuery(
  branchQueries.list(companyId)
);

const branchOptions = branchData?.data || [];


  // ==================== MUTATIONS ====================
  const createMutation = priceLevelMutations.useCreate({
    onSuccess: (data) => {
      reset();
      onSuccess?.("Price Level created successfully!", data);
    },
    onError: (error) => {
      console.error("Create error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create price level";
      alert(`Error: ${errorMessage}`); // Show error to user
    },
  });

  const updateMutation = priceLevelMutations.useUpdate({
    onSuccess: (data) => {
      onSuccess?.("Price Level updated successfully!", data);
    },
    onError: (error) => {
      console.error("Update error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update price level";
      alert(`Error: ${errorMessage}`); // Show error to user
    },
  });

  // ==================== FORM SUBMIT ====================
  const onSubmit = (data) => {
    // Ensure company is included
    if (!companyId) {
      console.error("Company ID is required but not provided");
      return;
    }

    const payload = {
      priceLevelName: data.priceLevelName,
      description: data.description,
      status: data.status,
      company: companyId, // Always include company ID
      branches: data.branches || [],
    };

    console.log("Submitting payload:", payload); // Debug log

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ==================== LOADING STATE ====================
  if (isLoadingEdit) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if companyId is provided
  // if (!companyId) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="text-center">
  //         <p className="text-red-600 text-sm font-semibold">Error: Company ID is required</p>
  //         <p className="text-gray-500 text-xs mt-2">Please provide a valid company ID</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Flatten all pages for serial number calculation
 
  return (
    <div className="h-screen bg-gray-50 p-3 overflow-hidden">
      <div className="max-w-full h-full flex flex-col">
        <h1 className="text-sm font-bold text-gray-900 mb-3">
          Price Level Management
        </h1>

        <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* ==================== LEFT SIDE - FORM ==================== */}
          <div className="bg-white shadow-lg rounded-lg p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-center mb-3 text-blue-700">
              {editId ? "Edit Price Level" : "Add Price Level"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Price Level Name */}
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-1">
                  Price Level Name <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="priceLevelName"
                  control={control}
                  rules={{
                    required: "Price level name is required",
                    maxLength: {
                      value: 50,
                      message: "Price level name cannot exceed 50 characters",
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter price level name"
                      className={`w-full px-2 py-1 text-[9px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.priceLevelName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.priceLevelName && (
                  <p className="mt-0.5 text-[9px] text-red-600">
                    {errors.priceLevelName.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 200,
                      message: "Description cannot exceed 200 characters",
                    },
                  }}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="Enter description (optional)"
                      rows={3}
                      className={`w-full px-2 py-1 text-[9px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
                        errors.description
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-0.5 text-[9px] text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-2 py-1 text-[9px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                />
              </div>

              {/* Branches - Multi-select */}
              {branchOptions && branchOptions.length > 0 && (
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-1">
                    Branches (Optional)
                  </label>
                  <Controller
                    name="branches"
                    control={control}
                    render={({ field }) => (
                      <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
                        {branchOptions.map((branch) => (
                          <label
                            key={branch._id || branch.id}
                            className="flex items-center space-x-2 text-[9px] py-1 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(branch._id || branch.id)}
                              onChange={(e) => {
                                const branchId = branch._id || branch.id;
                                const currentValue = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValue, branchId]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((id) => id !== branchId)
                                  );
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{branch.branchName || branch.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  <p className="mt-1 text-[8px] text-gray-500">
                    Selected: {watch("branches")?.length || 0} branch(es)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="w-full bg-blue-600 text-white py-1.5 rounded text-[9px] hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                {isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
                  ? "Submitting..."
                  : editId
                  ? "Update Price Level"
                  : "Create Price Level"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    reset({
                      priceLevelName: "",
                      description: "",
                      status: "active",
                      branches: [],
                    });
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-1.5 rounded text-[9px] hover:bg-gray-300 transition-all font-semibold focus:outline-none"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* ==================== RIGHT SIDE - LIST ==================== */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
  <div className="bg-blue-700 text-white p-3">
    <h2 className="text-sm font-bold">All Price Levels</h2>
    <p className="text-blue-100 text-[9px] mt-0.5">
      Total: {allPriceLevelsFlat.length} price levels
    </p>
  </div>

  {isLoadingAll ? (
    <div className="flex justify-center items-center flex-1 p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ) : (
    <div className="flex-1 overflow-y-auto">
      {allPriceLevelsFlat.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-gray-400">
          <p className="text-[9px] font-medium">No price levels found</p>
          <p className="text-[8px]">Create your first price level using the form</p>
        </div>
      ) : (
 allPriceLevelsFlat.map((priceLevel, index) => (
  <div
    key={priceLevel._id}
    className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-200 hover:bg-blue-50 cursor-pointer items-center"
  >
    {/* SL No */}
    <div className="col-span-1 text-gray-600 text-[9px]">{index + 1}</div>

    {/* Name & Status */}
    <div className="col-span-4 text-[9px] font-semibold text-gray-900">
      {priceLevel.priceLevelName}
      <div className="flex gap-1 mt-0.5">
        <span
          className={`text-[7px] px-1 py-0.5 rounded font-medium ${
            priceLevel.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {priceLevel.status}
        </span>
        <span className="text-[7px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
          {priceLevel.branches?.length || 0} branches
        </span>
      </div>
    </div>

    {/* Description */}
    <div className="col-span-5 text-gray-600 text-[9px] truncate">
      {priceLevel.description || (
        <span className="italic text-gray-400">No description</span>
      )}
    </div>

    {/* Actions */}
    <div className="col-span-2 flex justify-end gap-1">
      {/* Edit Button */}
      <button
        type="button"
        onClick={() => {
          reset({
            priceLevelName: priceLevel.priceLevelName || "",
            description: priceLevel.description || "",
            status: priceLevel.status || "active",
            branches: priceLevel.branches?.map((b) => b._id) || [],
          });
        }}
        className="text-blue-600 hover:text-blue-800 text-[9px] font-semibold"
      >
        ✏️ 
      </button>

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Delete ${priceLevel.priceLevelName}?`)) {
            priceLevelMutations
              .useDelete({
                onSuccess: () => {
                  alert("Price level deleted successfully!");
                },
                onError: (error) => {
                  console.error("Delete failed:", error);
                  alert("Failed to delete price level");
                },
              })
              .mutate(priceLevel._id);
          }
        }}
        className="text-red-600 hover:text-red-800 text-[9px] font-semibold"
      >
        🗑️ 
      </button>
    </div>
  </div>
))


      )}
    </div>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

export default PriceLevelForm;