import { useState } from 'react';




const AccountTransactionDetails = ({
 accountType,
    accountName,
    amount,
    previousBalanceAmount,
    narration,
    closingBalanceAmount,
  accountId,
  updateTransactionField,
  updateTransactionData,
  branch,
  company,
}) => {
 
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-2 space-y-2">
        {/* From Account */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-gray-700 text-[9px] font-medium">From Account</label>
          <input
            type="text"
            name="accountName"
            value={accountName}
            onChange={(e) => updateTransactionField("accountName", e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Amount and Total Amount */}
     <div className="flex items-end gap-2">
       
          <div className="flex-1 grid grid-cols-3 gap-3">
             <div>
              <label className="block text-gray-700 text-[9px] font-medium mb-1"> Previous Balance Amount</label>
              <input
                type="text"
                name="previousBalanceAmount"
                value={previousBalanceAmount}
                onChange={(e) => updateTransactionField("previousBalanceAmount", e.target.value)}
                readOnly
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-slate-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-[9px] font-medium mb-1">Amount</label>
              <input
                type="text"
                name="amount"
                value={amount}
                onChange={(e) => updateTransactionField("amount", e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
           
            <div>
              <label className="block text-gray-700 text-[9px] font-medium mb-1">Closing Balance Amount</label>
              <input
                type="text"
                name="closingBalanceAmount"
                value={closingBalanceAmount}
                onChange={(e) => updateTransactionField("closingBalanceAmount", e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-slate-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                readonly
              />
            </div>
          </div>
        </div>

        {/* Narration */}
        <div className="flex gap-2">
          <label className="w-28 text-gray-700 text-[9px] font-medium pt-1">Narration</label>
          <textarea
            name="narration"
            value={narration}
            onChange={(e) => updateTransactionField("narration", e.target.value)}
            rows="3"
            placeholder="Enter narration..."
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-white text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Balance */}
        
      </div>
    </div>
  );
};

export default AccountTransactionDetails;