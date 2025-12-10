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
      // registrationNumber: "",
      // incorporationDate: "",
    Address:'',
      email: "",
      // notificationEmail: "",
      mobile: "",
      // landline: "",
      gstNumber: "",
      panNumber: "",
      // website: "",
      // industry: "",
      // numEmployees: 0,
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
        // registrationNumber: "",
        // incorporationDate: "",
       Address:'',
        email: "",
       
        mobile: "",
        // landline: "",
        gstNumber: "",
        panNumber: "",
        // website: "",
        // industry: "",
        // numEmployees: 0,
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
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}
      <h2 className="text-sm font-bold shadow-lg p-2 px-4 mb-4">
        {editingId ? "Edit Company" : "Create Company"}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto bg-white px-6 py-2 rounded-lg shadow-md space-y-2 !text-xs"
      >
        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Company Name *
          </label>
          <input
            {...register("companyName", {
              required: "Company name is required",
              maxLength: 100,
            })}
            type="text"
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          />
          {errors.companyName && (
            <p className="text-red-600 mt-1">{errors.companyName.message}</p>
          )}
        </div>

        {/* Company Type */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Company Type *
          </label>
          <select
            {...register("companyType", {
              required: "Company type is required",
            })}
            className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
            <p className="text-red-600 mt-1">{errors.companyType.message}</p>
          )}
        </div>

        {/* Registration Number and Incorporation Date */}
      

        {/* Permanent Address */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
           Address *
          </label>
          <textarea
            {...register("permanentAddress", {
              required: "Permanent address is required",
            })}
            className="w-full border border-gray-300 rounded-xs p-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={isLoading}
          />
          {errors.permanentAddress && (
            <p className="text-red-600 mt-1">
              {errors.permanentAddress.message}
            </p>
          )}
        </div>

        {/* Residential Address */}
       
        {/* Email and Notification Email */}
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

        {/* Mobile and Landline */}
       
        {/* GST Number and PAN Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
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
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.gstNumber && (
              <p className="text-red-600 mt-1">{errors.gstNumber.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
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
              className="w-full border border-gray-300 rounded-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            />
            {errors.panNumber && (
              <p className="text-red-600 mt-1">{errors.panNumber.message}</p>
            )}
          </div>
        </div>

        {/* Website */}
       
        {/* Industry and Number of Employees */}
        
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            disabled={isLoading}
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