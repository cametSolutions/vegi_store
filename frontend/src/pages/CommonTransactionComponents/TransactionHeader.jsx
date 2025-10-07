import React from "react";
import { Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";

const TransactionHeader = ({
  currentTransactionType,
  date,
  updateTransactionField,
}) => {

  console.log("transaction header component renders");

  return (
    <div className="bg-white shadow-sm border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {/* <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <currentTransactionType.icon className="text-white w-4 h-4" />
          </div> */}
          {capitalizeFirstLetter(currentTransactionType)}
        </h1>
        <div className="text-xs text-slate-500 flex items-center gap-4">
          {/* Date Section */}
          <div className="flex items-center gap-2">
            <label className="flex items-center text-[9px] font-medium text-slate-700">
              <Calendar className="inline w-3 h-3 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => updateTransactionField("transactionDate", e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Document Section */}
          {/* <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-700">
              {getDocumentLabel(transactionData.type)}:
            </span>
            <span className="font-semibold text-slate-700 text-[9px]">
              {transactionData.documentNo}
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;

