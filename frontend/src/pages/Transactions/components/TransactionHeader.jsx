import React from "react";
import { Calendar, User } from "lucide-react";
import { getPartyLabel, getDocumentLabel } from "../utils/transactionUtils";

const TransactionHeader = ({
  transactionData,
  onTransactionChange,
  currentTransactionType,
}) => {
  const partyLabel = getPartyLabel(transactionData.type);

  return (
<div className="grid grid-cols-3 gap-x-1 gap-y-2  bg-white px-3">
  <div>
    <label className="block text-[9px] font-medium text-slate-700 mb-1">
      <User className="inline w-3 h-3 mr-1" />
      Party Type
    </label>
    <div className="flex gap-2 text-[10px] mt-2.5 ">
      <label className="flex items-center cursor-pointer">
        <input
          type="radio"
          name="partyType"
          value="customer"
          
          
          checked={transactionData.partyType === "customer"}
          onChange={(e) =>
            onTransactionChange({
              ...transactionData,
              partyType: e.target.value,
            })
          }
          className="mr-1 text-blue-600 scale-75 cursor-pointer "
        />
        {partyLabel}
      </label>
      <label className="flex items-center cursor-pointer">
        <input
          type="radio"
          name="partyType"
          value="others"
          checked={transactionData.partyType === "others"}
          onChange={(e) =>
            onTransactionChange({
              ...transactionData,
              partyType: e.target.value,
            })
          }
          className="mr-1 text-blue-600 scale-75 cursor-pointer"
        />
        Others
      </label>
    </div>
  </div>

  <div>
    <label className="block text-[9px] font-medium text-slate-700 mb-1">
      {partyLabel} Name
    </label>
    <input
      type="text"
      value={transactionData.partyName}
      onChange={(e) =>
        onTransactionChange({
          ...transactionData,
          partyName: e.target.value,
        })
      }
      placeholder={`Enter ${partyLabel.toLowerCase()} name`}
      className="w-full px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-[9px] font-medium text-slate-700 mb-1">
      Opening Balance
    </label>
    <input
      type="number"
      value={transactionData.balance}
      onChange={(e) =>
        onTransactionChange({
          ...transactionData,
          balance: parseFloat(e.target.value) || 0,
        })
      }
      className="w-full px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
    />
  </div>
</div>

  );
};

export default TransactionHeader;
