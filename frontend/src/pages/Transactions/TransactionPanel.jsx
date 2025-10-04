import React from "react";
import CreateTransaction from "./CreateTransaction";
import TransactionList from "./components/TransactionList/TransactionList";

const TransactionPanel = () => {
  return (
    <div className="flex  w-full justify-between bg-white gap-2 ">
      <div className="w-[55%]">
        {/* <div className=""> */}
        <CreateTransaction />
      </div>
      <div className="w-[45%]">
        <TransactionList />
      </div>
    </div>
  );
};

export default TransactionPanel;
