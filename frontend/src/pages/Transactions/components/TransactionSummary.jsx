import React from "react";
import { NumericFormat } from "react-number-format";

const TransactionSummaryComponent = ({
  total = 0,
  netAmount = 0,
  discount = 0,
  paidAmount = 0,
  balanceAmount = 0,
  onDiscountChange,
  onPaidAmountChange,
  transactionType,
}) => {
  // UPDATED: Added 'focus:outline-none' to explicitly override browser default focus states
  const baseInputClass =
    "w-full text-right font-mono text-xs bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 p-0 shadow-none";

  // Wrapper style for consistent height and alignment
  const wrapperClass =
    "flex items-center border rounded-xs px-2 h-7 w-full overflow-hidden";

  return (
    <div className="bg-white border-t border-slate-200 px-2 py-2 shadow-sm z-20">
      <div className="flex items-center gap-2">
        {/* 1. Subtotal */}
        <div className="flex flex-col w-28">
          <label className="text-[10px] text-slate-400 font-medium mb-0.5 ml-1">
            Subtotal
          </label>
          <div className={`${wrapperClass} bg-slate-50 border-slate-200`}>
            <span className="text-slate-400 text-[10px] mr-1">₹</span>
            <NumericFormat
              value={total}
              displayType="input"
              readOnly
              thousandSeparator=","
              decimalScale={2}
              fixedDecimalScale
              className={`${baseInputClass} text-slate-500 cursor-default`}
            />
          </div>
        </div>

        {/* 2. Discount */}
        <div className="flex flex-col w-28">
          <label className="text-[10px] text-slate-500 font-medium mb-0.5 ml-1">
            Discount
          </label>
          <div className={`${wrapperClass} bg-white border-slate-300`}>
            <NumericFormat
              value={discount === 0 ? "" : discount}
              onValueChange={(values) =>
                onDiscountChange(values.floatValue || 0)
              }
              thousandSeparator=","
              decimalScale={2}
              fixedDecimalScale
              placeholder="0.00"
              allowNegative={false}
              className={`${baseInputClass} text-rose-600 font-semibold placeholder:text-slate-300`}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-1 mt-3"></div>

        {/* 3. Net Amount */}
        <div className="flex flex-col w-32">
          <label className="text-[10px] text-slate-600 font-bold mb-0.5 ml-1">
            Net Amount
          </label>
          <div className={`${wrapperClass} bg-slate-50 border-slate-300`}>
            <span className="text-slate-500 text-[10px] mr-1">₹</span>
            <NumericFormat
              value={netAmount}
              displayType="input"
              readOnly
              thousandSeparator=","
              decimalScale={2}
              fixedDecimalScale
              className={`${baseInputClass} text-slate-800 font-bold cursor-default`}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* 4. Payment Received / Paid */}
        {transactionType === "sale" && (
          <div className="flex flex-col w-32">
            <label className="text-[10px] text-blue-600 font-medium mb-0.5 ml-1">
              {transactionType === "sale" ||
              transactionType === "purchase_return"
                ? "Received"
                : "Paid"}
            </label>
            <div className={`${wrapperClass} bg-white border-blue-200`}>
              <span className="text-blue-300 text-[10px] mr-1">₹</span>
              <NumericFormat
                value={paidAmount === 0 ? "" : paidAmount}
                onValueChange={(values) =>
                  onPaidAmountChange(values.floatValue || 0)
                }
                thousandSeparator=","
                decimalScale={2}
                fixedDecimalScale
                placeholder="0.00"
                allowNegative={false}
                className={`${baseInputClass} text-blue-700 font-bold placeholder:text-blue-200`}
              />
            </div>
          </div>
        )}

        {/* 5. Balance Due */}
        <div className="flex flex-col w-36">
          <label className="text-[10px] text-slate-500 font-bold mb-0.5 text-right mr-1">
            Balance
          </label>
          <div
            className={`${wrapperClass} ${
              balanceAmount > 0
                ? "bg-red-50 border-red-200"
                : "bg-teal-50 border-teal-200"
            }`}
          >
            <span
              className={`text-[10px] mr-1 font-medium ${
                balanceAmount > 0 ? "text-red-400" : "text-teal-400"
              }`}
            >
              ₹
            </span>
            <NumericFormat
              value={balanceAmount}
              displayType="input"
              readOnly
              thousandSeparator=","
              decimalScale={2}
              fixedDecimalScale
              className={` ${baseInputClass} font-extrabold cursor-default   ${
                balanceAmount > 0 ? "text-red-600" : "text-teal-600"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryComponent;
