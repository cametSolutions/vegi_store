import React, { useEffect, useMemo, useCallback } from "react";
import TransactionActionsComponent from "../CommonTransactionComponents/TransactionActions";
import TransactionHeaderComponent from "../CommonTransactionComponents/TransactionHeader";
import BankPaymentDetails from "./Components/BankPaymentReciept";
import RecieptDetailsForm from "./Components/ReceiptDetailsForm";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getTransactionType } from "./utils/CashTransactionUtils.js";

const TransactionHeader = React.memo(TransactionHeaderComponent);
const TransactionActions = React.memo(TransactionActionsComponent);
const TransactionRecieptDetails = React.memo(RecieptDetailsForm);
const TransactionBankPaymentDetails = React.memo(BankPaymentDetails);

const CreateCashTransaction = () => {
  const location = useLocation();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );
  const currentTransactionType = useMemo(
    () => getTransactionType(location),
    [location]
  );
  
  return (
    <div>
      <div className="h-[calc(100vh-110px)] w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        {/* Header */}
        <TransactionHeader
          currentTransactionType={currentTransactionType}
          // date={transactionData.transactionDate}
          // updateTransactionField={updateTransactionField}
        />
        
        <div className="flex flex-col  p-2 gap-2">
          {/* Receipt Details - Top */}
          <div className=" bg-white rounded-lg shadow-sm ">
            <TransactionRecieptDetails />
          </div>
          
          {/* Bank Payment Details - Middle */}
          <div className="flex-1 bg-white rounded-lg shadow-sm ">
            <TransactionBankPaymentDetails />
          </div>
          
          {/* Transaction Actions - Bottom */}
         <div className=" flex-1 w-full">
            <TransactionActions
              // onSave={useTransactionActions?.handleSave}
              // onView={useTransactionActions?.handleView}
              // onDelete={useTransactionActions?.handleDelete}
              // onCancel={useTransactionActions?.handleCancel}
              // onPrint={useTransactionActions?.handlePrint}
              // isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCashTransaction;