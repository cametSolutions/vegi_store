// components/BranchMasterForm.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { branchMasterMutations } from "@/hooks/mutations/branchMasterMutation";
import { companyMasterQueries } from "@/hooks/queries/companyMaster.queries";
import { Loader2, GitBranch, Pencil, AlertCircle, Building, MapPin, Phone } from "lucide-react";

const BranchMasterForm = ({ editingId, editData, onClearEdit }) => {
  const queryClient = useQueryClient();
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    ...companyMasterQueries.search(companySearchTerm, 100),
  });

  const {
    register,
    handleSubmit,
    reset,
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

  const InputLabel = ({ label, required }) => (
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const ErrorMessage = ({ message }) => (
    <p className="flex items-center gap-1 text-[10px] text-red-500 mt-1 font-medium">
       <AlertCircle className="w-3 h-3" /> {message}
    </p>
  );

  const inputClass = "w-full rounded-xs text-xs border border-slate-300 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500";
  const selectClass = "w-full rounded-xs text-xs border border-slate-300 rounded-md px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500 appearance-none";

  return (
    <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200 shadow-sm relative overflow-hidden">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-50 flex items-center justify-center flex-col gap-2">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          <span className="text-xs font-medium text-slate-600">Saving branch...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex-none px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
        <div className={`p-2 rounded-sm ${editingId ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600"}`}>
           {editingId ? <Pencil className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
        </div>
        <div>
           <h2 className="text-sm font-bold text-slate-800">
             {editingId ? "Edit Branch" : "New Branch"}
           </h2>
           <p className="text-[11px] text-slate-500 font-medium">
             {editingId ? "Update branch location details" : "Add a new operating location"}
           </p>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Section: Basic Info */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Branch Identity</span>
             </div>

             <div className="space-y-4">
                <div>
                   <InputLabel label="Parent Company" required />
                   <div className="relative">
                      <select
                        {...register("companyId", { required: "Company is required" })}
                        className={selectClass}
                        disabled={isLoading || companiesLoading || editingId}
                      >
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company._id} value={company._id}>{company.companyName}</option>
                        ))}
                      </select>
                      {companiesLoading && <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
                   </div>
                   {errors.companyId && <ErrorMessage message={errors.companyId.message} />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel label="Branch Name" required />
                        <input
                          {...register("branchName", { required: "Branch name is required", maxLength: 100 })}
                          className={inputClass}
                          placeholder="e.g., Main Office, Kottayam Warehouse"
                          disabled={isLoading}
                        />
                        {errors.branchName && <ErrorMessage message={errors.branchName.message} />}
                    </div>

                    <div>
                        <InputLabel label="Status" required />
                        <select
                          {...register("status")}
                          className={selectClass}
                          disabled={isLoading}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
             </div>
          </div>

          {/* Section: Location */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Location Details</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <InputLabel label="Address" required />
                   <textarea
                     {...register("address", { required: "Address is required" })}
                     className={`${inputClass} h-16 resize-none`}
                     placeholder="Street address..."
                     disabled={isLoading}
                   />
                   {errors.address && <ErrorMessage message={errors.address.message} />}
                </div>

                <div>
                   <InputLabel label="City" required />
                   <input {...register("city", { required: "City is required" })} className={inputClass} disabled={isLoading} />
                   {errors.city && <ErrorMessage message={errors.city.message} />}
                </div>
                <div>
                   <InputLabel label="State" required />
                   <input {...register("state", { required: "State is required" })} className={inputClass} disabled={isLoading} />
                   {errors.state && <ErrorMessage message={errors.state.message} />}
                </div>
                <div>
                   <InputLabel label="Country" required />
                   <input {...register("country", { required: "Country is required" })} className={inputClass} disabled={isLoading} />
                   {errors.country && <ErrorMessage message={errors.country.message} />}
                </div>
                <div>
                   <InputLabel label="Pincode" required />
                   <input {...register("pincode", { required: "Pincode is required", pattern: { value: /^[0-9]{6}$/, message: "6-digit code" } })} className={inputClass} disabled={isLoading} />
                   {errors.pincode && <ErrorMessage message={errors.pincode.message} />}
                </div>
             </div>
          </div>

          {/* Section: Contact */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contact Info</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <InputLabel label="Email" required />
                    <input
                      {...register("email", { required: "Email is required", pattern: { value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, message: "Invalid email" } })}
                      className={inputClass}
                      disabled={isLoading}
                    />
                    {errors.email && <ErrorMessage message={errors.email.message} />}
                 </div>
                 <div>
                    <InputLabel label="Mobile" required />
                    <input
                      {...register("mobile", { required: "Mobile is required", pattern: { value: /^[6-9]\d{9}$/, message: "Invalid mobile" } })}
                      className={inputClass}
                      disabled={isLoading}
                    />
                    {errors.mobile && <ErrorMessage message={errors.mobile.message} />}
                 </div>
                 <div className="col-span-2">
                    <InputLabel label="Landline" />
                    <input {...register("landline")} className={inputClass} disabled={isLoading} />
                 </div>
             </div>
          </div>

        </form>
      </div>

      {/* Fixed Footer Buttons */}
      <div className="flex-none p-4 bg-white border-t border-slate-200 flex flex-col gap-3 z-10">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="w-full bg-slate-800 text-white text-xs font-bold py-3 rounded-sm hover:bg-slate-700 active:bg-slate-900 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? "Update Branch" : "Create Branch")}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              reset();
              onClearEdit();
            }}
            disabled={isLoading}
            className="w-full bg-white text-slate-600 border border-slate-200 text-xs font-bold py-2.5 rounded-sm hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

    </div>
  );
};

export default BranchMasterForm;
