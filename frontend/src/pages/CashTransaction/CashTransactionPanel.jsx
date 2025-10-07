import React from 'react'
import CreateCashTransaction from './CreateCashTransaction'
import CashTRansactionList from './Components/CashTranactionList/CashTRansactionList'
const CashTransactionPanel = () => {
  return (
    <div className="flex  w-full justify-between bg-white gap-2 ">
      <div className="w-[55%]">
        <CreateCashTransaction />
      </div>
      {/* <div className="w-1/2">
        <CashTRansactionList/>
      </div> */}
    </div>
  );
};

export default CashTransactionPanel
