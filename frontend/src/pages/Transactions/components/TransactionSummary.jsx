import { NumericFormat } from "react-number-format";
import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";

const TransactionSummary = ({
  total,
  netAmount,
  discount,
  paidAmount,
  balanceAmount,
  onDiscountChange,
  onPaidAmountChange,
  totalDue,
  transactionType,
}) => {
  // Local state for immediate UI updates
  const [localDiscount, setLocalDiscount] = useState(discount.toString());
  const [localPaidAmount, setLocalPaidAmount] = useState(paidAmount.toString());

  // Debounced values that will trigger parent updates
  const debouncedDiscount = useDebounce(localDiscount, 400);
  const debouncedPaidAmount = useDebounce(localPaidAmount, 400);

  // Effect to call parent handlers when debounced values change
  useEffect(() => {
    onDiscountChange(debouncedDiscount);
  }, [debouncedDiscount, onDiscountChange]);

  useEffect(() => {
    onPaidAmountChange(debouncedPaidAmount);
  }, [debouncedPaidAmount, onPaidAmountChange]);

  // Update local state immediately when props change (for external updates)
  useEffect(() => {
    setLocalDiscount(discount?.toString());
  }, [discount]);

  useEffect(() => {
    setLocalPaidAmount(paidAmount?.toString());
  }, [paidAmount]);

  //// currently we do not allow  to pay more than net amount
  useEffect(() => {
    if (localPaidAmount >0 && localPaidAmount > totalDue) {
      console.log("totalDue", totalDue);
      console.log("localPaidAmount", localPaidAmount);

      setLocalPaidAmount(totalDue.toString());
    }
  }, [localPaidAmount, totalDue]);

  const isPaymentDisabled = useMemo(() => {
    const enabledTypes = ["sale"];

    if (enabledTypes.includes(transactionType.toLowerCase())) {
      return totalDue <= 0;
    } else {
      return true;
    }
  }, [totalDue, transactionType]);

  return (
    <div className="bg-white shadow-sm p-1">
      <div className="grid grid-cols-5 gap-4 text-sm">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Total:</span>
          <span className="font-semibold">₹{total}</span>
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between gap-2 ">
          <span className="text-slate-600">Disc:</span>
          <NumericFormat
            allowNegative={false}
            value={localDiscount}
            onValueChange={(values) => {
              setLocalDiscount(values.value);
            }}
            className="w-22 px-1 py-0.5 border border-slate-300 rounded-xs text-xs  "
            placeholder="0"
            thousandSeparator=","
            decimalScale={2}
          />
        </div>

        {/* Net */}
        <div className="flex items-center gap-2 ">
          <span className="text-slate-600">Net:</span>
          <NumericFormat
            value={netAmount}
            displayType="text"
            thousandSeparator=","
            prefix="₹"
            className="font-semibold"
          />
        </div>

        {/* Paid */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Paid:</span>
          <NumericFormat
            disabled={isPaymentDisabled}
            allowNegative={false}
            value={localPaidAmount}
            onValueChange={(values) => {
              setLocalPaidAmount(values.value);
            }}
            className={` ${
              totalDue <= 0 && "bg-slate-200"
            }  w-26 px-1 py-0.5 border border-slate-300 rounded-xs  text-xs`}
            placeholder="0"
            thousandSeparator=","
            decimalScale={2}
          />
        </div>

        {/* Balance */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Balance:</span>
          <NumericFormat
            value={balanceAmount.toFixed(2)}
            displayType="text"
            thousandSeparator=","
            prefix="₹"
            className={`font-semibold ${
              balanceAmount > 0 ? "text-red-600" : "text-green-600"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;
