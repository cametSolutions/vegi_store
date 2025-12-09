import { useState } from 'react';
import { Banknote, FileText, Landmark, ArrowRightLeft } from 'lucide-react';

const BankPaymentDetails = ({
  chequeNumber,
  bank,
  description,
  paymentMode,
  updateTransactionField,
  updateTransactionData,
  branch,
  company,
}) => {

  console.log("paymentMode",paymentMode);
  
  const [actionMode, setActionMode] = useState(null);

  const handlepaymentMode = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMode: method,
    }));
  };

  // Disable cheque fields when payment method is cash
  const isChequeFieldsDisabled = paymentMode === 'cash';

  // Payment mode options with icons and colors
  const paymentModes = [
    { 
      value: 'cash', 
      label: 'Cash', 
      icon: Banknote,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-700',
      hoverBorder: 'hover:border-emerald-400'
    },
    { 
      value: 'cheque', 
      label: 'Cheque', 
      icon: FileText,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      hoverBorder: 'hover:border-blue-400'
    },
    { 
      value: 'dd', 
      label: 'DD', 
      icon: Landmark,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-700',
      hoverBorder: 'hover:border-purple-400'
    },
    { 
      value: 'bankTransfer', 
      label: 'Bank Transfer', 
      icon: ArrowRightLeft,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700',
      hoverBorder: 'hover:border-orange-400'
    },
  ];

  return (
    <div className="w-full bg-white  border-t border-gray-200">
      <div className="p-3 space-y-2">
        {/* Cheque Number and Bank */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-700 text-[11px] font-medium mb-1">
              Cheque No.
            </label>
            <input
              type="text"
              name="chequeNumber"
              value={chequeNumber}
              onChange={(e) => updateTransactionField("chequeNumber", e.target.value)}
              placeholder="Enter cheque number"
              readOnly={isChequeFieldsDisabled}
              className={`w-full px-2 py-1.5 border text-[11px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                isChequeFieldsDisabled
                  ? 'bg-slate-200 cursor-not-allowed border-gray-300'
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-[11px] font-medium mb-1">
              Bank
            </label>
            <input
              type="text"
              name="bank"
              value={bank}
              onChange={(e) => updateTransactionField("bank", e.target.value)}
              placeholder="Enter bank name"
              readOnly={isChequeFieldsDisabled}
              className={`w-full px-2 py-1.5 border text-[11px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                isChequeFieldsDisabled
                  ? 'bg-slate-200 cursor-not-allowed border-gray-300'
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 text-[11px] font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => updateTransactionField("description", e.target.value)}
            rows="1"
            placeholder="Enter description..."
            className="w-full px-2 py-1.5 border border-gray-300 text-[11px] bg-white text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-gray-700 text-[11px] font-medium mb-1">
            Payment Mode
          </label>
          <div className="grid grid-cols-4 gap-1.5 mt-5">
            {paymentModes.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMode === method.value;
              
              return (
                <label
                  key={method.value}
                  className={`flex  items-center justify-center  rounded gap-1.5 px-2 py-1.5 border cursor-pointer transition-all ${
                    isSelected
                      ? `${method.borderColor} ${method.bgColor} ${method.textColor}`
                      : `border-gray-200 ${method.bgColor.replace('50', '25')} text-gray-700 ${method.hoverBorder}`
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value={method.value}
                    checked={isSelected}
                    onChange={(e) => updateTransactionField("paymentMode", e.target.value)}
                    className="sr-only  "
                  />
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? method.textColor : 'text-gray-500'}`} />
                  <span className="text-[11px]  font-bold">
                    {method.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPaymentDetails;