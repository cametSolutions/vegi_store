import React, { useEffect, useMemo, useCallback, useState } from "react";
import TransactionActionsComponent from "./Components/CashTransactionAction";
import CashTransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import BankPaymentDetails from "./Components/BankPaymentReciept";
import CashTransactionAccountSelector from "./Components/CashTransactionAccountSelector";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getTransactionType } from "./Utils/CashTransactionUtils";
import { useCashTransaction } from "./hooks/useCashTransaction";
import { useCashTransactionActions } from "./hooks/useCashTransactionAction";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";
import { transactionQueries } from "@/hooks/queries/transaction.queries";
import { addTransactionDataToStore } from "@/store/slices/transactionSlice";
import { useQuery } from "@tanstack/react-query";
import AmountEditWarningDialog from "@/components/modals/AmountEditWarningDialog";

const TransactionHeader = React.memo(CashTransactionHeaderComponent);
const CashTransactionAction = React.memo(TransactionActionsComponent);
const TransactionAccountSelector = React.memo(CashTransactionAccountSelector);
const TransactionBankPaymentDetails = React.memo(BankPaymentDetails);

const EditCashTransaction = ({
  editTransactionData,
  handleCancelEdit,
  onSuccess,
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchWithLatest, setFetchWithLatest] = useState(false);
  const [showAmountWarningDialog, setShowAmountWarningDialog] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [isAmountEditable, setIsAmountEditable] = useState(false); // NEW: Control amount field editability

  const {
    CashtransactionData,
    resetCashTransactionData,
    updateCashtransactionData,
    updateTransactionField,
    setCashtransactionData,
  } = useCashTransaction();
  const dispatch = useDispatch();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );
  const currentTransactionType = useMemo(
    () => getTransactionType(location, CashtransactionData.transactionType),
    [location, CashtransactionData.transactionType]
  );

  useEffect(() => {
    resetCashTransactionData(currentTransactionType);
    updateCashtransactionData({
      isEditMode: true,
      editTransactionId: editTransactionData._id,
      transactionType: currentTransactionType,
    });
  }, [currentTransactionType, updateTransactionField]);

  // Reset transaction data when navigating away from this page
  useEffect(() => {
    return () => {
      resetCashTransactionData(currentTransactionType);
    };
  }, [resetCashTransactionData]);

  // Fetch transaction details - queryKey includes fetchWithLatest for proper refetch
  const {
    data: transactionResponse,
    isLoading: transactionLoading,
    isError: transactionError,
  } = useQuery({
    ...transactionQueries.getTransactionById(
      selectedCompanyFromStore._id,
      selectedBranchFromStore._id,
      editTransactionData._id,
      currentTransactionType,
      fetchWithLatest ? "true" : undefined
    ),
    // Ensure query key includes the fetchWithLatest parameter for proper cache distinction
    queryKey: [
      "transaction",
      selectedCompanyFromStore._id,
      selectedBranchFromStore._id,
      editTransactionData._id,
      currentTransactionType,
      fetchWithLatest ? "latest" : "original",
    ],
  });

  // Update transaction data when response changes
  useEffect(() => {
    if (transactionResponse) {
      const dataToUpdate = fetchWithLatest
        ? { ...transactionResponse, amount: "" }
        : transactionResponse;

      updateCashtransactionData(dataToUpdate);

      // Prevent navigation in nav bar when in edit mode
      dispatch(
        addTransactionDataToStore({
          isEditMode: true,
          editTransactionId: editTransactionData._id,
          transactionType: currentTransactionType,
        })
      );

      // Enable amount field after fetching with latest data
      if (fetchWithLatest) {
        setIsAmountEditable(true);
      }
    }
  }, [transactionResponse, updateCashtransactionData, dispatch, editTransactionData._id, currentTransactionType, fetchWithLatest]);

  // Handle amount field click - show warning dialog only once
  const handleAmountFieldClick = useCallback(() => {
    if (!hasShownWarning && !isAmountEditable) {
      setShowAmountWarningDialog(true);
    }
  }, [hasShownWarning, isAmountEditable]);

  // Handle dialog confirmation - refetch with latest data
  const handleWarningConfirm = useCallback(() => {
    setShowAmountWarningDialog(false);
    setHasShownWarning(true); // Mark that warning has been shown
    setFetchWithLatest(true); // This will trigger refetch due to queryKey change
  }, []);

  // Handle dialog close
  const handleWarningClose = useCallback(() => {
    setShowAmountWarningDialog(false);
  }, []);

  const handleCancel = () => {
    resetCashTransactionData(currentTransactionType);
    handleCancelEdit();
  };

  return (
    <div>
      <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br bg-white overflow-hidden">
        {/* Loading overlay */}
        {(isLoading || transactionLoading) && (
          <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
            <CustomMoonLoader />
          </div>
        )}

        {/* Amount Edit Warning Dialog */}
        <AmountEditWarningDialog
          isOpen={showAmountWarningDialog}
          onClose={handleWarningClose}
          onConfirm={handleWarningConfirm}
        />

        <TransactionHeader
          currentTransactionType={currentTransactionType}
          date={CashtransactionData.transactionDate}
          updateTransactionField={updateTransactionField}
          isEditMode={true}
          transactionNumber={editTransactionData.transactionNumber}
        />

        <div className="flex flex-col h-[calc(100%-40px)] p-1 gap-2">
          {/* Receipt Details - Top */}
          <div className="bg-white rounded-lg shadow-sm">
            <TransactionAccountSelector
              transactionType={CashtransactionData?.transactionType}
              accountName={CashtransactionData?.accountName}
              amount={CashtransactionData?.amount}
              previousBalanceAmount={CashtransactionData?.previousBalanceAmount}
              narration={CashtransactionData?.narration}
              closingBalanceAmount={CashtransactionData?.closingBalanceAmount}
              accountType={CashtransactionData?.accountType}
              account={CashtransactionData?.account}
              updateTransactionField={updateTransactionField}
              updateCashtransactionData={updateCashtransactionData}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
              isEditMode={!isAmountEditable} // Pass the inverse - when editable, not in locked edit mode
              onAmountFieldClick={handleAmountFieldClick}
            />
          </div>

          {/* Bank Payment Details - Middle */}
          <div className="flex-1 bg-white overflow-auto">
            <TransactionBankPaymentDetails
              chequeNumber={CashtransactionData?.chequeNumber}
              bank={CashtransactionData?.bank}
              description={CashtransactionData?.description}
              paymentMode={CashtransactionData?.paymentMode}
              updateTransactionField={updateTransactionField}
              updateCashtransactionData={updateCashtransactionData}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
            />
          </div>

          {/* Transaction Actions - Bottom */}
          <div className="w-full mt-auto">
            <CashTransactionAction
              CashtransactionData={CashtransactionData}
              onLoadingChange={setIsLoading}
              resetCashTransactionData={resetCashTransactionData}
              onSave={useCashTransactionActions?.handleSave}
              onView={useCashTransactionActions?.handleView}
              onDelete={useCashTransactionActions?.handleDelete}
              onPrint={useCashTransactionActions?.handlePrint}
              isEditMode={true}
              handleCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCashTransaction;
