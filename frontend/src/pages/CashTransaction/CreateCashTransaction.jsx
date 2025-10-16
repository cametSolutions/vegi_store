import React, { useEffect, useMemo, useCallback, useState } from "react";
import TransactionActionsComponent from "./Components/cashTransactionAction";
import CashTransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import BankPaymentDetails from "./Components/BankPaymentReciept";
import CashTransactionAccountSelector from "./Components/CashTransactionAccountSelector";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getTransactionType } from "./Utils/CashTransactionUtils";
import { useCashTransaction } from "./hooks/useCashTransaction";
import { useCashTransactionActions } from "./hooks/useCashTransactionAction";
import CustomMoonLoader from "../../components/loaders/CustomMoonLoader";

const TransactionHeader = React.memo(CashTransactionHeaderComponent);
const CashTransactionAction = React.memo(TransactionActionsComponent);
const TransactionAccountSelector = React.memo(CashTransactionAccountSelector);
const TransactionBankPaymentDetails = React.memo(BankPaymentDetails);

const CreateCashTransaction = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const {
    CashtransactionData,
     resetCashTransactionData,
    updateCashtransactionData,
    updateTransactionField,

    setCashtransactionData,
  } = useCashTransaction();

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
     resetCashTransactionData();
    updateTransactionField("transactionType", currentTransactionType);
  }, [currentTransactionType, updateTransactionField]);


useEffect(() => {
  // Cleanup function - runs when component unmounts
  return () => {
    resetCashTransactionData();
  };
}, []); 

// Empty dependency array means this only sets up on mount
  console.log("Cash transaction data:", CashtransactionData);
  return (
    <div>
      <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        {/* Header */}

  {isLoading && (
        <div className="absolute inset-0 bg-white/60  z-50 flex items-center justify-center">
          <CustomMoonLoader />
        </div>
      )}

        <TransactionHeader
          currentTransactionType={currentTransactionType}
          date={CashtransactionData.date}
          updateTransactionField={updateTransactionField}
        />

        <div className="flex flex-col  p-2 gap-2">
          {/* Receipt Details - Top */}
          <div className=" bg-white rounded-lg shadow-sm ">
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
                // resetCashTransactionData={resetCashTransactionData}
            />
          </div>

          {/* Bank Payment Details - Middle */}
          <div className="flex-1 bg-white rounded-lg shadow-sm ">
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
          <div className=" flex-1 w-full">
            <CashTransactionAction
              CashtransactionData={CashtransactionData}
                 onLoadingChange={setIsLoading}
              resetCashTransactionData={resetCashTransactionData}
              onSave={useCashTransactionActions?.handleSave}
              onView={useCashTransactionActions?.handleView}
              onDelete={useCashTransactionActions?.handleDelete}
              onCancel={useCashTransactionActions?.handleCancel}
              onPrint={useCashTransactionActions?.handlePrint}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCashTransaction;
