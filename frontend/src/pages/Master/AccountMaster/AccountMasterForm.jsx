import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import BranchSelector from "@/components/BranchSelector";
import { accountMasterMutations } from "@/hooks/mutations/accountMaster.mutations";
import { priceLevelQueries } from "@/hooks/queries/priceLevel.queries";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";

const AccountMasterForm = ({
  companyId,
  branchId,
  editingId,
  editData,
  onClearEdit,
}) => {
  const queryClient = useQueryClient();

  const {
    data: priceLevelsResponse,
    isLoading: isPriceLevelLoading,
    isError: isPriceLevelError,
    refetch: refetchPriceLevels,
  } = useQuery({
    ...priceLevelQueries.getAll(companyId, branchId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const priceLevels = priceLevelsResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      company: companyId,
      branches: [],
      accountName: "",
      accountType: "customer",
      address: "",
      openingBalance: 0,
      openingBalanceType: "dr",
      phoneNo: "",
      email: "",
      priceLevel: null,
      status: "active",
    },
  });

  const [selectedBranches, setSelectedBranches] = useState([]);
  const accountType = watch("accountType"); // watch accountType field

  useEffect(() => {
    setValue("branches", selectedBranches);
  }, [selectedBranches, setValue]);

  useEffect(() => {
    if (editData) {
      reset({
        ...editData,
        openingBalance: Math.abs(editData.openingBalance),
        branches: editData.branches || [],
        priceLevel: editData.priceLevel?._id || null,
      });
      setSelectedBranches(editData.branches || []);
    } else {
      reset({
        company: companyId,
        branches: [],
        accountName: "",
        accountType: "customer",
        address: "",
        openingBalance: 0,
        openingBalanceType: "dr",
        phoneNo: "",
        email: "",
        priceLevel: null,
        status: "active",
      });
      if (branchId) {
        setSelectedBranches([branchId]);
      } else {
        setSelectedBranches([]);
      }
    }
  }, [editData, companyId, reset]);

  const mutation = useMutation(
    editingId
      ? accountMasterMutations.update(queryClient)
      : accountMasterMutations.create(queryClient)
  );

  // Check if either mutation is loading
  const isLoading = mutation.isPending || mutation.isLoading;

  const onSubmit = (formData) => {
    if (selectedBranches.length === 0) {
      toast.error("Please select at least one branch.");
      return;
    }
    if (editingId) {
      mutation.mutate(
        { id: editingId, formData },
        {
          onSuccess: () => {
            onClearEdit();
            reset();
            if (branchId) {
              setSelectedBranches([branchId]);
            } else {
              setSelectedBranches([]);
            }
          },

        }
      );
    } else {
      mutation.mutate(formData, {
        onSuccess: () => {
          reset();
          if (branchId) {
            setSelectedBranches([branchId]);
          } else {
            setSelectedBranches([]);
          }
        },
  
      });
    }
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60  z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-4">
        {editingId ? "Edit Account" : "Create Account"}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto bg-white px-6 py-2 rounded-lg shadow-md space-y-2 !text-xs"
      >
        {/* Account Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Account Name *
          </label>
          <input
            {...register("accountName", {
              required: "Account name is required",
              maxLength: 100,
            })}
            type="text"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          />
          {errors.accountName && (
            <p className="text-red-600 mt-1">{errors.accountName.message}</p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Account Type *
          </label>
          <select
            {...register("accountType", {
              required: "Account type is required",
            })}
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          >
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="other">Other</option>
          </select>
          {errors.accountType && (
            <p className="text-red-600 mt-1">{errors.accountType.message}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Address
          </label>
          <textarea
            {...register("address")}
            className="w-full border border-gray-300 rounded-xs p-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          />
          {errors.address && (
            <p className="text-red-600 mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Opening Balance and Type */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-1">
              Opening Balance
            </label>
            <input
              {...register("openingBalance", { valueAsNumber: true, min: 0 })}
              type="number"
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={mutation.isLoading}
            />
            {errors.openingBalance && (
              <p className="text-red-600 mt-1">
                {errors.openingBalance.message}
              </p>
            )}
          </div>
          <div className="w-32">
            <label className="block text-gray-700 font-semibold mb-1">
              Balance Type
            </label>
            <select
              {...register("openingBalanceType")}
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={mutation.isLoading}
            >
              <option value="dr">Dr</option>
              <option value="cr">Cr</option>
            </select>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Phone Number
          </label>
          <input
            {...register("phoneNo", {
              pattern: {
                value: /^[6-9]\d{9}$/,
                message:
                  "Phone number must be a valid 10-digit Indian mobile number",
              },
            })}
            type="text"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          />
          {errors.phoneNo && (
            <p className="text-red-600 mt-1">{errors.phoneNo.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Email
          </label>
          <input
            {...register("email", {
              pattern: {
                value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                message: "Please enter a valid email address",
              },
            })}
            type="email"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          />
          {errors.email && (
            <p className="text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Price Level Dropdown */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Price Level *
          </label>
          {isPriceLevelLoading && (
            <p className="text-gray-600">Loading price levels...</p>
          )}
          {isPriceLevelError && (
            <p className="text-red-600">
              Error loading price levels.{" "}
              <button
                type="button"
                onClick={refetchPriceLevels}
                className="underline text-indigo-600"
              >
                Retry
              </button>
            </p>
          )}
          {!isPriceLevelLoading && !isPriceLevelError && (
            <select
              {...register("priceLevel", {
                required:
                  accountType === "customer"
                    ? "Price level is required for Customers"
                    : false,
              })}
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={mutation.isLoading}
            >
              <option value="">Select Price Level</option>
              {priceLevels.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.priceLevelName}
                </option>
              ))}
            </select>
          )}
          {errors.priceLevel && (
            <p className="text-red-600 mt-1">{errors.priceLevel.message}</p>
          )}
        </div>

        {/* Branch Selector */}
        <div>
          <BranchSelector
            selectedBranches={selectedBranches}
            setSelectedBranches={setSelectedBranches}
          />
          {errors.branches && (
            <p className="text-red-600 mt-1">{errors.branches.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Status *
          </label>
          <select
            {...register("status")}
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={mutation.isLoading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            disabled={mutation.isLoading}
            type="submit"
            className="bg-indigo-600 w-full cursor-pointer font-bold text-sm text-white rounded-xs px-6 py-2 hover:bg-indigo-700 transition"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="bg-gray-300 cursor-pointer w-full font-bold text-sm text-gray-700 rounded-xs px-6 py-2 hover:bg-gray-400 transition"
              onClick={() => {
                reset();
                setSelectedBranches([]);
                onClearEdit();
              }}
              disabled={mutation.isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AccountMasterForm;
