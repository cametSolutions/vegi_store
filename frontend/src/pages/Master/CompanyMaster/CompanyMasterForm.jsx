// components/CompanyMasterForm.jsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyMasterMutations } from "@/hooks/mutations/companyMaster.mutation";
import { Loader2, Building2, Pencil, AlertCircle } from "lucide-react";

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
          <span className="text-xs font-medium text-slate-600">Processing...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex-none px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
        <div className={`p-2 rounded-sm ${editingId ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
           {editingId ? <Pencil className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
        </div>
        <div>
           <h2 className="text-sm font-bold text-slate-800">
             {editingId ? "Edit Company" : "New Company"}
           </h2>
           <p className="text-[11px] text-slate-500 font-medium">
             {editingId ? "Update company details below" : "Register a new business entity"}
           </p>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Section: Basic Info */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Company Info</span>
             </div>

             <div className="space-y-4">
               <div>
                 <InputLabel label="Company Name" required />
                 <input
                   {...register("companyName", { required: "Name is required", maxLength: 100 })}
                   className={inputClass}
                   placeholder="e.g., Acme Corp Pvt Ltd"
                   disabled={isLoading}
                 />
                 {errors.companyName && <ErrorMessage message={errors.companyName.message} />}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <InputLabel label="Company Type" required />
                   <div className="relative">
                      <select {...register("companyType", { required: "Type is required" })} className={selectClass} disabled={isLoading}>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="LLP">LLP</option>
                        <option value="Other">Other</option>
                      </select>
                   </div>
                   {errors.companyType && <ErrorMessage message={errors.companyType.message} />}
                 </div>
                 
                 <div>
                    <InputLabel label="Status" required />
                    <select {...register("status")} className={selectClass} disabled={isLoading}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                 </div>
               </div>
             </div>
          </div>

          {/* Section: Contact Details */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contact Details</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel label="Mobile Number" required />
                  <input
                    {...register("mobile", { 
                        required: "Mobile is required",
                        pattern: { value: /^[6-9]\d{9}$/, message: "Invalid 10-digit number" } 
                    })}
                    className={inputClass}
                    placeholder="9876543210"
                    disabled={isLoading}
                  />
                  {errors.mobile && <ErrorMessage message={errors.mobile.message} />}
                </div>

                <div>
                  <InputLabel label="Email Address" required />
                  <input
                    {...register("email", { 
                        required: "Email is required",
                        pattern: { value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, message: "Invalid email" }
                    })}
                    className={inputClass}
                    placeholder="admin@company.com"
                    disabled={isLoading}
                  />
                  {errors.email && <ErrorMessage message={errors.email.message} />}
                </div>
             </div>

            <div>
  <InputLabel label="Permanent Address" required />
  <textarea
    {...register("permanentAddress", { required: "Address is required" })}
    className={`${inputClass} h-20 resize-none`}
    placeholder="Registered office address..."
    disabled={isLoading}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        
        // Insert comma and space at cursor position
        const target = e.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const currentValue = target.value;
        
        const newValue = 
          currentValue.substring(0, start) + 
          ", " + 
          currentValue.substring(end);
        
        target.value = newValue;
        
        // Update react-hook-form value
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Move cursor after the comma
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      }
    }}
  />
  {errors.permanentAddress && <ErrorMessage message={errors.permanentAddress.message} />}
</div>

          </div>

          {/* Section: Registration */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Registration</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel label="GST Number" />
                  <input
                    {...register("gstNumber", { 
                        pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GST format" }
                    })}
                    className={`${inputClass} uppercase`}
                    placeholder="22AAAAA0000A1Z5"
                    disabled={isLoading}
                  />
                  {errors.gstNumber && <ErrorMessage message={errors.gstNumber.message} />}
                </div>
                <div>
                  <InputLabel label="PAN Number" />
                  <input
                    {...register("panNumber", {
                        pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN format" }
                    })}
                    className={`${inputClass} uppercase`}
                    placeholder="ABCDE1234F"
                    disabled={isLoading}
                  />
                  {errors.panNumber && <ErrorMessage message={errors.panNumber.message} />}
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
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? "Update Company" : "Create Company")}
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

export default CompanyMasterForm;
