import React, { useEffect, useState } from "react";
import CreateTransaction from "./CreateTransaction";
import EditTransaction from "./EditTransaction"; // Import your edit component
import TransactionList from "./components/TransactionList/TransactionList";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const TransactionPanel = () => {
  const isEditMode = useSelector((state) => state.transaction.isEditMode);
  const [editMode, setEditMode] = useState(isEditMode);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  console.log(location);

  const { from, transactionId,fromPath } = location.state || {};
  // console.log(location);
  // console.log(location);

  useEffect(() => {
    if (from === "transactionSummary" && transactionId) {
      handleEditTransaction({ _id: transactionId });
    }

    return () => {
      ///set location.state to null
      window.history.replaceState(null, "", window.location.pathname);
      setSelectedTransaction(null);
      setEditMode(false);
    };
  }, [location.state]);

  // Handler to switch to edit mode
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditMode(true);
  };

  // Handler to switch back to create mode
  const handleCancelEdit = () => {
    if (from === "transactionSummary" && transactionId) {
      // Clear location state using React Router's navigate
      navigate(fromPath || location.pathname, { replace: true, state: null });
    }
    
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
            fromPath={fromPath}
            // onSuccess={handleCancelEdit} // Return to create mode after successful edit
          />
        ) : (
          <CreateTransaction />
        )}
      </div>
      <div
        className={` ${transactionId && from === "transactionSummary" ? "opacity-50 pointer-events-none" : ""}  w-[45%]`}
      >
        <TransactionList
          onEditTransaction={handleEditTransaction}
          selectedTransaction={selectedTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionPanel;
