const TransactionSummary = ({
  total,
  discount,
  onDiscountChange,
  netAmount,
  paidAmount,
  onPaidAmountChange,
}) => {
  return (
    <div className="bg-white shadow-sm p-1">
      <div className="grid grid-cols-4 gap-4 text-xs">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Total:</span>
          <span className="font-semibold">₹{total}</span>
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Discount:</span>
          <input
            type="number"
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="w-22 px-1 py-0.5 border border-slate-300 rounded text-right text-xs"
          />
        </div>

        {/* Net */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Net:</span>
          <span className="font-semibold">₹{netAmount}</span>
        </div>

        {/* Paid */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Paid:</span>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) =>
              onPaidAmountChange(parseFloat(e.target.value) || 0)
            }
            className="w-26 px-1 py-0.5 border border-slate-300 rounded text-right text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;
