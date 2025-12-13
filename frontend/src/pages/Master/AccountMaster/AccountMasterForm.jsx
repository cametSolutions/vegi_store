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
        priceLevel: editData.priceLevel || null,
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

    if (formData.priceLevel === "") {
      formData.priceLevel = null;
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
    <div className="h-full min-h-[400px] flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-1">
        {editingId ? "Edit Account" : "Create Account"}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 bg-white shadow p-6"
      >
        {/* Form fields as flex-1 section */}
        <div className="flex-1 space-y-6">
          {/* Account Name */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Account Name *
            </label>
            <input
              {...register("accountName", {
                required: "Account name is required",
                maxLength: 100,
              })}
              type="text"
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            />
            {errors.accountName && (
              <p className="text-red-500 text-xs mt-1">{errors.accountName.message}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Account Type *
            </label>
            <select
              {...register("accountType", {
                required: "Account type is required",
              })}
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </select>
            {errors.accountType && (
              <p className="text-red-500 text-xs mt-1">{errors.accountType.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Address
            </label>
            <textarea
              {...register("address")}
              className="w-full border text-xs rounded px-3 py-2 h-20 resize-none outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Opening Balance and Type */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block font-medium mb-1 text-xs">
                Opening Balance
              </label>
              <input
                {...register("openingBalance", { valueAsNumber: true, min: 0 })}
                type="number"
                className={`${
                  editingId && "bg-slate-200"
                } w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400`}
                disabled={mutation.isLoading || editingId}
              />
              {errors.openingBalance && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.openingBalance.message}
                </p>
              )}
            </div>
            <div className="w-32">
              <label className="block font-medium mb-1 text-xs">
                Balance Type
              </label>
              <select
                {...register("openingBalanceType")}
                className={`${
                  editingId && "bg-slate-200"
                } w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400`}
                disabled={mutation.isLoading || editingId}
              >
                <option value="dr">Dr</option>
                <option value="cr">Cr</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-medium mb-1 text-xs">
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
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            />
            {errors.phoneNo && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNo.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1 text-xs">
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
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Price Level Dropdown */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Price Level *
            </label>
            {isPriceLevelLoading && (
              <p className="text-gray-600 text-xs">Loading price levels...</p>
            )}
            {isPriceLevelError && (
              <p className="text-red-500 text-xs">
                Error loading price levels.{" "}
                <button
                  type="button"
                  onClick={refetchPriceLevels}
                  className="underline text-blue-600"
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
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
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
              <p className="text-red-500 text-xs mt-1">{errors.priceLevel.message}</p>
            )}
          </div>

          {/* Branch Selector */}
          <div>
            <BranchSelector
              selectedBranches={selectedBranches}
              setSelectedBranches={setSelectedBranches}
            />
            {errors.branches && (
              <p className="text-red-500 text-xs mt-1">{errors.branches.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Status *
            </label>
            <select
              {...register("status")}
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={mutation.isLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Buttons aligned at form bottom */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            disabled={mutation.isLoading}
            type="submit"
            className="w-full bg-blue-600 cursor-pointer font-bold text-white text-xs py-3 rounded hover:bg-blue-700 transition"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="w-full font-bold cursor-pointer bg-gray-200 text-gray-700 text-xs py-3 rounded hover:bg-gray-300 transition"
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