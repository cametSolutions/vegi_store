const TransactionSummary = ({ 
  total, 
  discount, 
  onDiscountChange, 
  netAmount, 
  paidAmount, 
  onPaidAmountChange, 
  closingBalance 
}) => {
  return (
    <div className="bg-white rounded-xs shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Transaction Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-600">Total Amount:</span>
          <span className="font-semibold">₹{total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Discount:</span>
          <input
            type="number"
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
          />
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-slate-600">Net Amount:</span>
          <span className="font-semibold">₹{netAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Paid Amount:</span>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
          />
        </div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>Closing Balance:</span>
          <span className={closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            ₹{closingBalance}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;