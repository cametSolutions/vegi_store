import React from "react";
import CreateTransaction from "./CreateTransaction";
import TransactionList from "./components/TransactionList/TransactionList";

const TransactionPanel = () => {


  return (
    <div className="flex  w-full justify-between bg-white gap-2 ">
      <div className="">
        <CreateTransaction />
      </div>
      <div className="w-1/2">
        <TransactionList />
      </div>
    </div>
  );
};

export default TransactionPanel;
