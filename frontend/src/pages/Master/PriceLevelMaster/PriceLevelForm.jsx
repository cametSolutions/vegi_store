// components/PriceLevelForm.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { priceLevelMutations } from "../../../hooks/mutations/priceLevelMutations";
import BranchSelector from "@/components/BranchSelector";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Loader2, Tag, Pencil, AlertCircle } from "lucide-react";

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

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

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

    try {
      if (editingPriceLevel) {
        await updateMutation.mutateAsync({
          id: editingPriceLevel._id,
          formData: formData,
        });
        onClearEdit();
        setSelectedBranches(selectedBranchFromStore ? [selectedBranchFromStore] : []);
      } else {
        await createMutation.mutateAsync(formData);
        reset({
            priceLevelName: "",
            description: "",
            status: "active",
            company: companyId
        });
        setSelectedBranches(selectedBranchFromStore ? [selectedBranchFromStore] : []);
      }
    } catch (error) {
       // Error handled by mutation or global handler usually
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
        <div className={`p-2 rounded-sm ${editingPriceLevel ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
           {editingPriceLevel ? <Pencil className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
        </div>
        <div>
           <h2 className="text-sm font-bold text-slate-800">
             {editingPriceLevel ? "Edit Price Level" : "New Price Level"}
           </h2>
           <p className="text-[11px] text-slate-500 font-medium">
             {editingPriceLevel ? "Modify pricing tier details" : "Define a new pricing tier"}
           </p>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Level Details</span>
             </div>

             <div className="space-y-4">
                <div>
                   <InputLabel label="Price Level Name" required />
                   <input
                     {...register("priceLevelName", {
                       required: "Name is required",
                       maxLength: 50,
                       validate: { notEmpty: (v) => v?.trim().length > 0 || "Cannot be empty" }
                     })}
                     className={inputClass}
                     placeholder="e.g., Wholesale A, Retail Standard"
                     disabled={isLoading}
                   />
                   {errors.priceLevelName && <ErrorMessage message={errors.priceLevelName.message} />}
                </div>

                <div>
                   <InputLabel label="Description" />
                   <input
                     {...register("description", { maxLength: 200 })}
                     className={inputClass}
                     placeholder="Optional description..."
                     disabled={isLoading}
                   />
                   {errors.description && <ErrorMessage message={errors.description.message} />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel label="Status" required />
                        <div className="relative">
                            <select
                                {...register("status", { required: true })}
                                className={selectClass}
                                disabled={isLoading}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                   <InputLabel label="Branch Availability" />
                   <div className="bg-slate-50/50 p-1 rounded-md">
                      <BranchSelector
                        companyId={selectedCompanyFromStore}
                        selectedBranches={selectedBranches}
                        setSelectedBranches={setSelectedBranches}
                        disabled={isLoading}
                      />
                   </div>
                   {selectedBranches.length === 0 && <ErrorMessage message="Select at least one branch" />}
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
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editingPriceLevel ? (
            "Update Price Level"
          ) : (
            "Create Price Level"
          )}
        </button>

        {editingPriceLevel && (
          <button
            type="button"
            className="w-full bg-white text-slate-600 border border-slate-200 text-xs font-bold py-2.5 rounded-sm hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={onClearEdit}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>

    </div>
  );
};

export default PriceLevelForm;
