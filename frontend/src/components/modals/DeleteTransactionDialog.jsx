import { useState } from "react";
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
import { Loader2 } from "lucide-react";

export function DeleteTransactionDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isDeleting = false 
}) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const handleOpenChange = (newOpen) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setIsAgreed(false); // Reset checkbox when dialog closes
      setReason(""); // Reset reason when dialog closes
    }
  };

  const handleConfirm = () => {
    if (isAgreed && !isDeleting && reason.trim()) {
      onConfirm(reason);
    }
  };

  const isConfirmDisabled = !isAgreed || !reason.trim() || isDeleting;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be reverted. The transaction will be permanently
            deleted from your billing records and all related data will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Reason Input */}
        <div className="space-y-2 py-2">
          <Label htmlFor="deletion-reason" className="text-sm font-medium">
            Reason for Deletion <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="deletion-reason"
            placeholder="Enter reason for deleting this transaction..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isDeleting}
            rows={3}
            className="resize-none"
          />
          {reason.trim() === "" && (
            <p className="text-xs text-muted-foreground">
              Please provide a reason for audit purposes
            </p>
          )}
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="agree-delete"
            checked={isAgreed}
            onCheckedChange={setIsAgreed}
            disabled={isDeleting}
          />
          <Label
            htmlFor="agree-delete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I understand this action cannot be undone
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Transaction"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
