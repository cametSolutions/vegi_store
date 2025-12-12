import React, { useEffect, useState } from "react";
import CreateCashTransaction from "./CreateCashTransaction";
import CashTRansactionList from "./Components/CashTranactionList/CashTRansactionList";
import { useDispatch, useSelector } from "react-redux";
import { Edit } from "lucide-react";
import EditCashTransaction from "./EditCashTransaction";
import { removeTransactionDataFromStore } from "@/store/slices/transactionSlice";

const CashTransactionPanel = () => {
  const isEditMode = useSelector((state) => state.transaction.isEditMode);
  const [editMode, setEditMode] = useState(isEditMode);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const dispatch = useDispatch();

  // Handler to switch to edit mode
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditMode(true);
  };


  // Handler to switch back to create mode
  const handleCancelEdit = () => {
    console.log("cancel");
    
    setEditMode(false);
    setSelectedTransaction(null);
     dispatch(removeTransactionDataFromStore());
  };

  //// Sync local editMode state with Redux store
  ///reset selected transaction when edit is completed

  useEffect(() => {
    setEditMode(isEditMode);
    if (!isEditMode) {
      setSelectedTransaction(null);
    }
  }, [isEditMode]);
  return (
    <div className="flex  w-full justify-between bg-white gap-2 ">
      <div className="w-[55%]">
        {editMode ? (
          <EditCashTransaction
            editTransactionData={selectedTransaction}
            handleCancelEdit={handleCancelEdit}
            onSuccess={handleCancelEdit} // Return to create mode after successful edit
          />
        ) : (
          <CreateCashTransaction />
        )}
      </div>
      <div className="w-[45%]">
        <CashTRansactionList
          onEditTransaction={handleEditTransaction}
          selectedTransaction={selectedTransaction}
        />
      </div>
    </div>
  );
};

export default CashTransactionPanel;
