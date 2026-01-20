import React, { useEffect } from "react";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";
import { transactionTypes } from "../CashTransaction/Utils/CashTransactionUtils";
import TransactionNumberBadge from "./TransactionNumberBadge";

const TransactionHeader = ({
  currentTransactionType,
  date,
  updateTransactionField,
  isEditMode = false,
  transactionNumber,
}) => {
  // Convert date string to Date object for DatePicker
  const dateValue = date ? new Date(date) : new Date();

  // Handle date change
  const handleDateChange = (selectedDate) => {
    if (selectedDate) {
      // Convert to YYYY-MM-DD format for backend
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      console.log("formatted Date", formattedDate);

      updateTransactionField("transactionDate", formattedDate);
    }
  };

  useEffect(() => {
    // console.log("currentTransactionType changed:", currentTransactionType);

    updateTransactionField("transactionType", currentTransactionType);
  }, [currentTransactionType, updateTransactionField]);

  const isProduction = import.meta.env.VITE_ENV === "production";

  console.log(isProduction);
  

  return (
    <div className="bg-white shadow-sm border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2 ">
          {isEditMode ? "Edit" : "New"}{" "}
          {capitalizeFirstLetter(currentTransactionType)}
          {isEditMode && (
            <span className="ml-2">
              <TransactionNumberBadge transactionNumber={transactionNumber} />
            </span>
          )}
        </h1>
        <div className="text-xs text-slate-500 flex items-center gap-4">
          {/* Date Section */}
          <div className="flex items-center gap-2">
            <label className="flex items-center text-[11px] font-medium text-slate-700">
              <Calendar className="inline w-3 h-3 mr-1" />
              Date
            </label>
            <DatePicker
              disabled={isProduction}
              selected={dateValue}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className="px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500 w-[100px]"
              calendarClassName="text-xs"
              popperPlacement="bottom-end"
              portalId="root"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;
