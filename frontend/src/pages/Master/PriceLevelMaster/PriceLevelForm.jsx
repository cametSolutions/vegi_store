import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { priceLevelMutations } from "../../../hooks/mutations/priceLevelMutations";
import BranchSelector from "@/components/BranchSelector";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const PriceLevelForm = ({
  companyId,
  branchId,
  editingPriceLevel,
  onClearEdit,
}) => {
  const queryClient = useQueryClient();
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );

  const [selectedBranches, setSelectedBranches] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      priceLevelName: "",
      description: "",
      branches: branchId ? [branchId] : [],
      status: "active",
      company: companyId,
    },
  });

  const createMutation = useMutation(priceLevelMutations.create(queryClient));
  const updateMutation = useMutation(priceLevelMutations.update(queryClient));

  useEffect(() => {
    if (editingPriceLevel) {
      reset({
        priceLevelName: editingPriceLevel.priceLevelName || "",
        description: editingPriceLevel.description || "",
        branches: editingPriceLevel.branches || [],
        status: editingPriceLevel.status || "active",
        company: editingPriceLevel.company,
      });
      setSelectedBranches(editingPriceLevel.branches);
    } else {
      reset({
        priceLevelName: "",
        description: "",
        branches: branchId ? [branchId] : [],
        status: "active",
        company: companyId,
      });
      if (selectedBranchFromStore) {
        setSelectedBranches([selectedBranchFromStore]);
      } else {
        setSelectedBranches([]);
      }
    }
  }, [editingPriceLevel, companyId, branchId, reset, selectedBranchFromStore]);

  const onSubmit = async (data) => {
    if (selectedBranches.length === 0) {
      toast.error("Please select at least one branch.");
      return;
    }

    const formData = {
      ...data,
      company: selectedCompanyFromStore,
      branches: selectedBranches,
    };

    if (editingPriceLevel) {
      await updateMutation.mutateAsync({
        id: editingPriceLevel._id,
        formData: formData,
      });
      onClearEdit();
      if (selectedBranchFromStore) {
        setSelectedBranches([selectedBranchFromStore]);
      } else {
        setSelectedBranches([]);
      }
    } else {
      await createMutation.mutateAsync(formData);
      reset({
        priceLevelName: "",
        description: "",
        branches: [],
        status: "active",
        company: companyId,
      });
      if (selectedBranchFromStore) {
        setSelectedBranches([selectedBranchFromStore]);
      } else {
        setSelectedBranches([]);
      }
    }
  };

  return (
    <div className="h-full min-h-[400px] flex flex-col">
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-1">
        {editingPriceLevel ? "Edit Price Level" : "Create Price Level"}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 bg-white shadow p-6"
      >
        {/* Form fields as flex-1 section */}
        <div className="flex-1 space-y-6">
          <div>
            <label className="block font-medium mb-1 text-xs">
              Price Level Name *
            </label>
            <input
              {...register("priceLevelName", {
                required: "Enter a price level name",
                maxLength: 50,
                validate: {
                  notEmpty: (value) =>
                    value?.trim().length > 0 ||
                    "Price level name cannot be empty or only whitespace",
                },
              })}
              className="w-full border text-xs px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isSubmitting}
              placeholder="Enter price level name"
            />
            {errors.priceLevelName && (
              <div className="text-red-500 text-xs mt-1">
                {errors.priceLevelName.message}
              </div>
            )}
          </div>
          <div className="text-xs">
            <label className="block font-medium mb-1">Description</label>
            <input
              {...register("description", { maxLength: 200 })}
              className="w-full border rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              placeholder="Enter description (optional)"
              disabled={isSubmitting}
            />
            {errors.description && (
              <div className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </div>
            )}
          </div>
          <BranchSelector
            companyId={selectedCompanyFromStore}
            selectedBranches={selectedBranches}
            setSelectedBranches={setSelectedBranches}
          />
          <div className="text-xs">
            <label className="block font-medium mb-1">Status *</label>
            <select
              {...register("status", { required: true })}
              className="w-full border rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {/* Buttons aligned at form bottom */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 cursor-pointer font-bold text-white text-xs py-3 rounded hover:bg-blue-700 transition"
          >
            {isSubmitting
              ? editingPriceLevel
                ? "Saving..."
                : "Creating..."
              : editingPriceLevel
              ? "Update Price Level"
              : "Create Price Level"}
          </button>
          {editingPriceLevel && (
            <button
              type="button"
              className="w-full font-bold cursor-pointer bg-gray-200 text-gray-700 text-xs py-3 rounded hover:bg-gray-300 transition"
              onClick={onClearEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PriceLevelForm;
