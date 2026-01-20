import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

const SettlementWarningDialog = ({ 
  isOpen, 
  onClose, 
  settlementCount 
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              Cannot Change Party
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="text-base text-gray-700 pt-2">
          This sale has {settlementCount} settlement{settlementCount > 1 ? 's' : ''} present.
        </AlertDialogDescription>

        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 my-2">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 font-medium">
              Please clear  {settlementCount > 1 ? 'all settlements' : 'the settlement'} and save before changing the party.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            OK
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SettlementWarningDialog;
