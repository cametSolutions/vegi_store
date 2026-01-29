import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DeleteCashTransactionDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  transactionNumber,
  transactionType,
  amount,
  accountName,
  isLoading = false 
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const handleOpenChange = (newOpen) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setIsAgreed(false);
      setReason("");
    }
  };

  const handleConfirm = () => {
    if (!reason?.trim()) {
      toast.error('Please enter a reason for deletion');
      return;
    }
    if (!isAgreed) {
      toast.error('Please confirm that you understand this action cannot be undone');
      return;
    }
    if (!isLoading) {
      onConfirm(reason);
    }
  };

  const isConfirmDisabled = !isAgreed || !reason.trim() || isLoading;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs mt-0.5">
                This action cannot be undone
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 leading-relaxed">
              You are about to delete this {transactionType}. This will:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Reverse all settlements (bills will go back to pending)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Reverse the cash/bank entry</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Create an adjustment entry for audit trail</span>
              </li>
            </ul>
          </div>

          {/* Transaction Details */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 uppercase">
                {transactionType} Number
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {transactionNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 uppercase">
                Account
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {accountName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 uppercase">
                Amount
              </span>
              <span className="text-base font-bold text-red-600">
                ₹{amount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="deletion-reason" className="text-xs font-semibold">
              Reason for Deletion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="deletion-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for deleting this transaction..."
              disabled={isLoading}
              className="resize-none text-sm"
            />
            {!reason.trim() && (
              <p className="text-xs text-muted-foreground">
                Please provide a reason for audit purposes
              </p>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Checkbox
              id="agree-delete"
              checked={isAgreed}
              onCheckedChange={setIsAgreed}
              disabled={isLoading}
              className="mt-0.5"
            />
            <Label
              htmlFor="agree-delete"
              className="text-xs font-medium text-red-800 leading-relaxed cursor-pointer"
            >
              I understand this action cannot be undone and will permanently delete this transaction
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {transactionType}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCashTransactionDialog;
