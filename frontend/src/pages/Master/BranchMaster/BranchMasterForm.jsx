import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { branchMasterMutations } from "@/hooks/mutations/branchMasterMutation";
import { companyMasterQueries } from "@/hooks/queries/companyMaster.queries";

const BranchMasterForm = ({ editingId, editData, onClearEdit }) => {
  const queryClient = useQueryClient();
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  // Fetch companies for dropdown
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    ...companyMasterQueries.search(companySearchTerm, 100),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyId: "",
      branchName: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      email: "",
      mobile: "",
      landline: "",
      status: "active",
    },
  });

  const companies = companiesData?.data || [];

  useEffect(() => {
    if (editData) {
      reset({
        companyId: editData.companyId || "",
        branchName: editData.branchName || "",
        address: editData.address || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "India",
        pincode: editData.pincode || "",
        email: editData.email || "",
        mobile: editData.mobile || "",
        landline: editData.landline || "",
        status: editData.status || "active",
      });
    } else {
      reset({
        companyId: "",
        branchName: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        email: "",
        mobile: "",
        landline: "",
        status: "active",
      });
    }
  }, [editData, reset]);

  const mutation = useMutation(
    editingId
      ? branchMasterMutations.update(queryClient)
      : branchMasterMutations.create(queryClient)
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  return (
    <div className="h-full min-h-[400px] flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-1">
        {editingId ? "Edit Branch" : "Create Branch"}
      </h2>
      <div className="flex flex-col flex-1 bg-white shadow p-6">
        {/* Form fields as flex-1 section */}
        <div className="flex-1 space-y-6">
          {/* Company Dropdown */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Company *
            </label>
            <select
              {...register("companyId", {
                required: "Company is required",
              })}
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading || companiesLoading || editingId}
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.companyName}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="text-red-500 text-xs mt-1">{errors.companyId.message}</p>
            )}
            {companiesLoading && (
              <p className="text-gray-500 text-xs mt-1">Loading companies...</p>
            )}
          </div>

          {/* Branch Name */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Branch Name *
            </label>
            <input
              {...register("branchName", {
                required: "Branch name is required",
                maxLength: 100,
              })}
              type="text"
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            />
            {errors.branchName && (
              <p className="text-red-500 text-xs mt-1">{errors.branchName.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Address *
            </label>
            <textarea
              {...register("address", {
                required: "Address is required",
              })}
              className="w-full border text-xs rounded px-3 py-2 h-20 resize-none outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-xs">
                City *
              </label>
              <input
                {...register("city", {
                  required: "City is required",
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-xs">
                State *
              </label>
              <input
                {...register("state", {
                  required: "State is required",
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Country and Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-xs">
                Country *
              </label>
              <input
                {...register("country", {
                  required: "Country is required",
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-xs">
                Pincode *
              </label>
              <input
                {...register("pincode", {
                  required: "Pincode is required",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Please enter a valid 6-digit pincode",
                  },
                })}
                type="text"
                className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
                disabled={isLoading}
              />
              {errors.pincode && (
                <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>
              )}
            </div>
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

          {/* Landline */}
          <div>
            <label className="block font-medium mb-1 text-xs">
              Landline
            </label>
            <input
              {...register("landline")}
              type="text"
              className="w-full border text-xs rounded px-3 py-2 outline-none focus:ring focus:border-blue-400"
              disabled={isLoading}
            />
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Buttons aligned at form bottom */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            disabled={isLoading}
            onClick={handleFormSubmit}
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
      </div>
    </div>
  );
};

export default BranchMasterForm;