import React, { useEffect, useState } from "react";
import CreateTransaction from "./CreateTransaction";
import EditTransaction from "./EditTransaction"; // Import your edit component
import TransactionList from "./components/TransactionList/TransactionList";
import { useSelector } from "react-redux";

const TransactionPanel = () => {
  const isEditMode = useSelector((state) => state.transaction.isEditMode);
  const [editMode, setEditMode] = useState(isEditMode);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Handler to switch to edit mode
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditMode(true);
  };

  // Handler to switch back to create mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedTransaction(null);
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
    <div className="flex w-full justify-between bg-white gap-2">
      <div className="w-[55%]">
        {editMode ? (
          <EditTransaction
            editTransactionData={selectedTransaction}
            handleCancelEdit={handleCancelEdit}
            onSuccess={handleCancelEdit} // Return to create mode after successful edit
          />
        ) : (
          <CreateTransaction />
        )}
      </div>
      <div className="w-[45%]">
        <TransactionList
          onEditTransaction={handleEditTransaction}
          selectedTransaction={selectedTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionPanel;
