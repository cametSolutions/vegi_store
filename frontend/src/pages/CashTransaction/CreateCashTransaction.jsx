import React, { useEffect, useMemo, useCallback } from "react";
import TransactionActionsComponent from "../CommonTransactionComponents/TransactionActions";
import CashTransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import BankPaymentDetails from "./Components/BankPaymentReciept";
import CashTransactionAccountSelector from "./Components/CashTransactionAccountSelector";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getTransactionType } from "./Utils/CashTransactionUtils";
import { useCashTransaction } from "./hooks/useCashTransaction";
import { useCashTransactionAction } from "./hooks/useCashTransactionAction";



const TransactionHeader = React.memo(CashTransactionHeaderComponent);
const TransactionActions = React.memo(TransactionActionsComponent);
const TransactionAccountSelector = React.memo(CashTransactionAccountSelector);
const TransactionBankPaymentDetails = React.memo(BankPaymentDetails);

const CreateCashTransaction = () => {
  const location = useLocation();


 const {
    CashtransactionData,
   
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
    updateTransactionField("transactionType", currentTransactionType);
  }, [currentTransactionType, updateTransactionField]);
  console.log("Cash transaction data:", CashtransactionData);
  return (
    <div>
      <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        {/* Header */}
        <TransactionHeader
          currentTransactionType={currentTransactionType}
          date={CashtransactionData.date}
          updateTransactionField={updateTransactionField}
        />
        
        <div className="flex flex-col  p-2 gap-2">
          {/* Receipt Details - Top */}
          <div className=" bg-white rounded-lg shadow-sm ">
            <TransactionAccountSelector
            transactionType="payment"
             accountName={CashtransactionData?.accountName}
    amount={CashtransactionData?.amount}
    previousBalanceAmount={CashtransactionData?.previousBalanceAmount}
    narration={CashtransactionData?.narration}
    closingBalanceAmount={CashtransactionData?.closingBalanceAmount}
      accountType={CashtransactionData?.accountType}
    accountId={CashtransactionData?.accountId}
     updateTransactionField={updateTransactionField}
              updateCashtransactionData={updateCashtransactionData}
              branch={selectedBranchFromStore?._id}
              company={selectedCompanyFromStore?._id}
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
            <TransactionActions
              onSave={useCashTransactionAction?.handleSave}
              onView={useCashTransactionAction?.handleView}
              onDelete={useCashTransactionAction?.handleDelete}
              onCancel={useCashTransactionAction?.handleCancel}
              onPrint={useCashTransactionAction?.handlePrint}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCashTransaction;