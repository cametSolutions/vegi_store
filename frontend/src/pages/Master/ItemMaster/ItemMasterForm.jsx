// pages/ItemMasterForm.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { itemMasterMutations } from "../../../hooks/mutations/itemMasterMutations";
import BranchSelector from "../../../components/BranchSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { units } from "../../../../constants/units";
import { toast } from "sonner";
import CustomMoonLoader from "../../../components/loaders/CustomMoonLoader"; // Import your loader

const ItemMasterForm = ({ selectedItem, isEditMode, onSuccess, onCancel }) => {
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
    formState: { errors },
  } = useForm({
    defaultValues: {
      itemName: "",
      itemCode: "",
      unit: "KGS",
    },
  });

  const createMutation = useMutation(itemMasterMutations.create(queryClient));
  const updateMutation = useMutation(itemMasterMutations.update(queryClient));

  // Check if either mutation is loading
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Effect for edit mode - populate form with selected item data
  useEffect(() => {
    if (selectedItem && isEditMode) {
      setValue("itemName", selectedItem.itemName);
      setValue("itemCode", selectedItem.itemCode);
      setValue("unit", selectedItem.unit);
      setSelectedBranches(selectedItem.stock.map((s) => s.branch?._id));
    } else {
      console.log("call came here");

      // Create mode - reset form and set default branch
      reset();
      if (selectedBranchFromStore) {
        console.log("call came here 2");

        setSelectedBranches([selectedBranchFromStore]);
      } else {
        setSelectedBranches([]);
      }
    }
  }, [selectedItem, isEditMode, setValue, reset, selectedBranchFromStore]);

  const onSubmit = async (data) => {
    /// at least one branch must be selected
    if (selectedBranches.length === 0) {
      toast.error("Please select at least one branch for stock allocation.");
      return;
    }

    const formData = {
      company: selectedCompanyFromStore,
      itemName: data.itemName,
      itemCode: data.itemCode,
      unit: data.unit,
      category: null,
      priceLevels: [],
      stock: selectedBranches.map((branchId) => ({
        branch: branchId,
        openingStock: 0,
        currentStock: 0,
      })),
      status: "active",
    };

    if (isEditMode && selectedItem) {
      updateMutation.mutate(
        { id: selectedItem._id, formData },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onSuccess();
          reset();
          if (selectedBranchFromStore) {
            setSelectedBranches([selectedBranchFromStore]);
          } else {
            setSelectedBranches([]);
          }
        },
      });
    }
  };

  return (
    <div className="space-y-4 relative">
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-4">
        {isEditMode ? "Edit Item" : "Create Item"}
      </h2>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <CustomMoonLoader />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-7 px-5">
        {/* Item Name */}
        <div>
          <Label htmlFor="itemName">Item Name *</Label>
          <Input
            id="itemName"
            {...register("itemName", {
              required: "Item name is required",
              validate: {
                notEmpty: (value) =>
                  value?.trim().length > 0 ||
                  "Item name cannot be empty or only whitespace",
              },
            })}
            placeholder="Enter item name"
            className="mt-2 rounded-none"
            disabled={isLoading}
            onBlur={(e) => {
              // Trim the value on blur
              const trimmedValue = e.target.value.trim();
              setValue("itemName", trimmedValue, { shouldValidate: true });
            }}
          />
          {errors.itemName && (
            <p className="text-red-500 text-[10px]">
              {errors.itemName.message}
            </p>
          )}
        </div>

        {/* Item Code */}
        <div>
          <Label htmlFor="itemCode">Item Code *</Label>
          <Input
            id="itemCode"
            {...register("itemCode", {
              required: "Item code is required",
              validate: {
                notEmpty: (value) =>
                  value?.trim().length > 0 ||
                  "Item code cannot be empty or only whitespace",
              },
            })}
            placeholder="Enter item code"
            className="mt-2 rounded-none"
            disabled={isLoading}
            onBlur={(e) => {
              // Trim the value on blur
              const trimmedValue = e.target.value.trim();
              setValue("itemCode", trimmedValue, { shouldValidate: true });
            }}
          />
          {errors.itemCode && (
            <p className="text-red-500 text-[10px]">
              {errors.itemCode.message}
            </p>
          )}
        </div>

        {/* Unit */}
        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Select
            onValueChange={(value) => setValue("unit", value)}
            value={watch("unit")}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-2 rounded-none">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-red-500 text-[9px]">{errors.unit.message}</p>
          )}
        </div>

        {/* Branch Selector */}
        <BranchSelector
          companyId={selectedCompanyFromStore}
          selectedBranches={selectedBranches}
          setSelectedBranches={setSelectedBranches}
          disabled={isLoading}
        />

        {/* Action Buttons */}
        <div className="sticky bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-0 flex gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Item"
              : "Create Item"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemMasterForm;
