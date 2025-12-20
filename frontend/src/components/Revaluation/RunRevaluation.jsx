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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      dispatch(setRevaluationProgress(100));
      dispatch(setRevaluationMessage("Revaluation completed successfully!"));
      setTimeout(() => {
        dispatch(hideRevaluationLoader());
      }, 1500);
    },
    onError: (error) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      let seconds = 3;
      dispatch(setRevaluationMessage(`Revaluation failed. Closing in ${seconds}...`));

      const countdownInterval = setInterval(() => {
        seconds -= 1;
        if (seconds > 0) {
          dispatch(setRevaluationMessage(`Revaluation failed. Closing in ${seconds}...`));
        } else {
          clearInterval(countdownInterval);
          dispatch(hideRevaluationLoader());
        }
      }, 1000);
    },
  });

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

  const handleTriggerClick = () => setShowConfirmDialog(true);
  const handleConfirm = () => {
    setShowConfirmDialog(false);
    revaluationMutation.mutate();
  };
  const handleCancel = () => setShowConfirmDialog(false);

  return (
    <>
      {/* Modernized Dropdown Item */}
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTriggerClick();
        }}
        className="cursor-pointer text-xs py-2 rounded-md focus:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors group"
      >
        <RefreshCcw className="w-4 h-4  text-slate-500 group-hover:text-blue-500 transition-colors" />
        Run Revaluation
      </DropdownMenuItem>

      {/* Modernized Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white border-slate-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-amber-50 rounded-full">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              Confirm Revaluation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-slate-600 text-sm">
              <p>
                You are about to manually trigger the night revaluation process.
              </p>
              <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                <p className="text-amber-700 text-xs font-medium flex items-start gap-2">
                   <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                   This process recalculates all ledger balances and may take several minutes. Ensure no critical operations are running.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel 
                onClick={handleCancel}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs h-9"
            >
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
            >
              Start Revaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RunRevaluation;
