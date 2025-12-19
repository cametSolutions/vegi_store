import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { companyMasterMutations } from "@/hooks/mutations/companyMaster.mutation";

const CompanyMasterForm = ({ editingId, editData, onClearEdit }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: "",
      companyType: "Private Limited",
      permanentAddress: "",
      email: "",
      mobile: "",
      gstNumber: "",
      panNumber: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (editData) {
      reset({
        ...editData,
        incorporationDate: editData.incorporationDate
          ? new Date(editData.incorporationDate).toISOString().split("T")[0]
          : "",
      });
    } else {
      reset({
        companyName: "",
        companyType: "Private Limited",
        permanentAddress: "",
        email: "",
        mobile: "",
        gstNumber: "",
        panNumber: "",
        status: "Active",
      });
    }
  }, [editData, reset]);

  const mutation = useMutation(
    editingId
      ? companyMasterMutations.update(queryClient)
      : companyMasterMutations.create(queryClient)
  );

  const isLoading = mutation.isPending || mutation.isLoading;

  const onSubmit = (formData) => {
    if (editingId) {
      mutation.mutate(
        { id: editingId, formData },
        {
          onSuccess: () => {
            onClearEdit();
            reset();
          },
        }
      );
    } else {
      mutation.mutate(formData, {
        onSuccess: () => {
          reset();
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
        {editingId ? "Edit Company" : "Create Company"}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 bg-white shadow p-6"
      >
        {/* Form fields as flex-1 section */}
        <div className="flex-1 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Company Name *
            </label>
            <input
              {...register("companyName", {
                required: "Company name is required",
                maxLength: 100,
              })}
              type="text"
              className="w-full border text-xs px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            />
            {errors.companyName && (
              <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
            )}
          </div>

          {/* Company Type */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Company Type *
            </label>
            <select
              {...register("companyType", {
                required: "Company type is required",
              })}
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            >
              <option value="Private Limited">Private Limited</option>
              <option value="Public Limited">Public Limited</option>
              <option value="Partnership">Partnership</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="LLP">LLP</option>
              <option value="Other">Other</option>
            </select>
            {errors.companyType && (
              <p className="text-red-500 text-xs mt-1">{errors.companyType.message}</p>
            )}
          </div>

          {/* Permanent Address */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Address *
            </label>
            <textarea
              {...register("permanentAddress", {
                required: "Permanent address is required",
              })}
              className="w-full border text-xs rounded px-3 py-2 h-20 resize-none outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            />
            {errors.permanentAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.permanentAddress.message}
              </p>
            )}
          </div>

          {/* Email and Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-xs">
                Email *
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                type="email"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-xs">
                Mobile *
              </label>
              <input
                {...register("mobile", {
                  required: "Mobile number is required",
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: "Please enter a valid 10-digit mobile number",
                  },
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.mobile && (
                <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>
              )}
            </div>
          </div>

          {/* GST Number and PAN Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-xs">
                GST Number
              </label>
              <input
                {...register("gstNumber", {
                  pattern: {
                    value:
                      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: "Please enter a valid GST number",
                  },
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.gstNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.gstNumber.message}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-xs">
                PAN Number
              </label>
              <input
                {...register("panNumber", {
                  pattern: {
                    value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: "Please enter a valid PAN number",
                  },
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.panNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.panNumber.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Status *
            </label>
            <select
              {...register("status")}
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Buttons aligned at form bottom */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            disabled={isLoading}
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
                onClearEdit();
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CompanyMasterForm;