import React from 'react';
import { ShoppingCart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const iconMap = {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw
};

const TransactionTypeSelector = ({ transactionTypes, selectedType, onTypeChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-3">Transaction Type</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {transactionTypes?.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedType === type.value
                  ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <IconComponent className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionTypeSelector;