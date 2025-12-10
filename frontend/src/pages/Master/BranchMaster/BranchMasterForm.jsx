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
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-4">
        {editingId ? "Edit Branch" : "Create Branch"}
      </h2>
      <div className="max-w-3xl mx-auto bg-white px-6 py-2 rounded-lg shadow-md space-y-2 !text-xs">
        {/* Company Dropdown */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Company *
          </label>
          <select
            {...register("companyId", {
              required: "Company is required",
            })}
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
            <p className="text-red-600 mt-1">{errors.companyId.message}</p>
          )}
          {companiesLoading && (
            <p className="text-gray-500 text-xs mt-1">Loading companies...</p>
          )}
        </div>

        {/* Branch Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Branch Name *
          </label>
          <input
            {...register("branchName", {
              required: "Branch name is required",
              maxLength: 100,
            })}
            type="text"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          />
          {errors.branchName && (
            <p className="text-red-600 mt-1">{errors.branchName.message}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Address *
          </label>
          <textarea
            {...register("address", {
              required: "Address is required",
            })}
            className="w-full border border-gray-300 rounded-xs p-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          />
          {errors.address && (
            <p className="text-red-600 mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              City *
            </label>
            <input
              {...register("city", {
                required: "City is required",
              })}
              type="text"
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.city && (
              <p className="text-red-600 mt-1">{errors.city.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              State *
            </label>
            <input
              {...register("state", {
                required: "State is required",
              })}
              type="text"
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.state && (
              <p className="text-red-600 mt-1">{errors.state.message}</p>
            )}
          </div>
        </div>

        {/* Country and Pincode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Country *
            </label>
            <input
              {...register("country", {
                required: "Country is required",
              })}
              type="text"
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.country && (
              <p className="text-red-600 mt-1">{errors.country.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
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
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.pincode && (
              <p className="text-red-600 mt-1">{errors.pincode.message}</p>
            )}
          </div>
        </div>

        {/* Email and Mobile */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
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
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
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
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.mobile && (
              <p className="text-red-600 mt-1">{errors.mobile.message}</p>
            )}
          </div>
        </div>

        {/* Landline */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Landline
          </label>
          <input
            {...register("landline")}
            type="text"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Status *
          </label>
          <select
            {...register("status")}
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            disabled={isLoading}
            onClick={handleFormSubmit}
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