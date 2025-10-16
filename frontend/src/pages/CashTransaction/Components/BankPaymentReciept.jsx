import { useState } from 'react';

const BankPaymentDetails = (  {
  chequeNumber,
  bank,
  description,
  paymentMode,
  updateTransactionField,
  updateTransactionData,
  branch,
  company,
}) => {

  const [actionMode, setActionMode] = useState(null);

  

  const handlepaymentMode = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMode: method,
    }));
  };


  // Disable cheque fields when payment method is cash
  const isChequeFieldsDisabled = paymentMode === 'cash';

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-3 space-y-2">
        {/* Cheque Number and Bank */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-700 text-[9px] font-medium mb-1">
              Cheque No.
            </label>
            <input
              type="text"
              name="chequeNumber"
              value={chequeNumber}
              onChange={(e) => updateTransactionField("chequeNumber", e.target.value)}
              placeholder="Enter cheque number"
              readOnly={isChequeFieldsDisabled}
              className={`w-full px-2 py-1.5 border rounded text-[9px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                isChequeFieldsDisabled
                  ? 'bg-slate-200 cursor-not-allowed border-gray-300'
                  : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-[9px] font-medium mb-1">
              Bank
            </label>
            <input
              type="text"
              name="bank"
              value={bank}
              onChange={(e) => updateTransactionField("bank", e.target.value)}
              placeholder="Enter bank name"
              readOnly={isChequeFieldsDisabled}
              className={`w-full px-2 py-1.5 border rounded text-[9px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                isChequeFieldsDisabled
                  ? 'bg-slate-200 cursor-not-allowed border-gray-300'
                  : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 text-[9px] font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => updateTransactionField("description", e.target.value)}
            rows="1"
            placeholder="Enter description..."
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-[9px] bg-white text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payment Method */}
       <div>
  <label className="block text-gray-700 text-[9px] font-medium mb-1">
    Payment Mode
  </label>
  <div className="grid grid-cols-4 gap-1.5">
    {[
      { value: 'cash', label: 'Cash' },
      { value: 'cheque', label: 'Cheque' },
      { value: 'dd', label: 'DD' },
      { value: 'bankTransfer', label: 'Bank Transfer' },
    ].map((method) => (
      <label
        key={method.value}
        className={`flex items-center justify-center px-2 py-1.5 border-2 rounded cursor-pointer ${
          paymentMode === method.value
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <input
          type="radio"
          name="paymentMode"
          value={method.value}
          checked={paymentMode === method.value}
          onChange={(e) => updateTransactionField("paymentMode", e.target.value)}
          className="sr-only"
        />
        <span className="text-[9px] font-medium">{method.label}</span>
      </label>
    ))}
  </div>
</div>
      </div>
    </div>
  );
};

export default BankPaymentDetails;
