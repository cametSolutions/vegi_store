import React, { useEffect, useState } from "react";
import CreateTransaction from "./CreateTransaction";
import EditTransaction from "./EditTransaction"; // Import your edit component
import TransactionList from "./components/TransactionList/TransactionList";


const TransactionPanel = () => {
  const [editMode, setEditMode] = useState(false);
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
