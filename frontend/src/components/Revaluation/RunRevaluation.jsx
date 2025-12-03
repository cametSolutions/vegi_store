import React, { useState, useEffect, useRef } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { revaluationMutations } from "@/hooks/mutations/revaluation.mutation";
import {
  showRevaluationLoader,
  hideRevaluationLoader,
  setRevaluationProgress,
  setRevaluationMessage,
} from "@/store/slices/revaluationLoaderSlice";

const RunRevaluation = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);

  const revaluationMutation = useMutation({
    ...revaluationMutations.triggerRevaluation(queryClient),
    onMutate: () => {
      dispatch(showRevaluationLoader());
      dispatch(setRevaluationProgress(0));
      dispatch(setRevaluationMessage("Starting revaluation process..."));
    },
    onSuccess: (response) => {
      // Clear progress interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      dispatch(setRevaluationProgress(100));
      dispatch(setRevaluationMessage("Revaluation completed successfully!"));

      // Keep loader visible briefly to show completion
      setTimeout(() => {
        dispatch(hideRevaluationLoader());
      }, 1500);
    },
    onError: (error) => {
      // Clear progress interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Start countdown
      let seconds = 3;
      dispatch(
        setRevaluationMessage(`Revaluation failed. Closing in ${seconds}...`)
      );

      const countdownInterval = setInterval(() => {
        seconds -= 1;

        if (seconds > 0) {
          dispatch(
            setRevaluationMessage(
              `Revaluation failed. Closing in ${seconds}...`
            )
          );
        } else {
          clearInterval(countdownInterval);
          dispatch(hideRevaluationLoader());
        }
      }, 1000);
    },
  });

  // Simulate progress updates
  useEffect(() => {
    if (revaluationMutation.isPending) {
      let currentProgress = 0;

      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 15;

        if (currentProgress >= 90) {
          currentProgress = 90;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        dispatch(setRevaluationProgress(currentProgress));

        // Update status messages based on progress
        if (currentProgress > 20 && currentProgress <= 40) {
          dispatch(setRevaluationMessage("Processing ledger entries..."));
        } else if (currentProgress > 40 && currentProgress <= 60) {
          dispatch(setRevaluationMessage("Recalculating balances..."));
        } else if (currentProgress > 60 && currentProgress <= 80) {
          dispatch(setRevaluationMessage("Updating account summaries..."));
        } else if (currentProgress > 80) {
          dispatch(setRevaluationMessage("Finalizing revaluation..."));
        }
      }, 500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [revaluationMutation.isPending, dispatch]);

  const handleTriggerClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    revaluationMutation.mutate();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      {/* Dropdown Menu Item Trigger */}
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTriggerClick();
        }}
        className="cursor-pointer"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Run Revaluation
      </DropdownMenuItem>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Revaluation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to manually trigger the night revaluation process.
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ This process may take several minutes and will recalculate
                all ledger balances. Please ensure no critical operations are in
                progress.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90"
            >
              Yes, Run Revaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RunRevaluation;
