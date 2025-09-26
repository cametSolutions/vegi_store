import React from 'react';
import { Plus } from 'lucide-react';
import { unitOptions } from '../utils/transactionUtils';

const AddItemForm = ({ newItem, onNewItemChange, products, onProductSelect, onAddItem }) => {
  return (
    <div className="bg-white rounded-xs shadow p-4 mb-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">Add Item</h3>
      
      {/* Quick Select Products */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {products.map((product) => (
              <button
                key={product.code}
                onClick={() => onProductSelect(product)}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
              >
                {product.name} (₹{product.rate}/kg)
              </button>
            ))}
          </div>
        </div>

      <div className="grid grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Item Code</label>
          <input
            type="text"
            value={newItem.code}
            onChange={(e) => onNewItemChange({ ...newItem, code: e.target.value })}
            className="w-full px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="V001"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Item Name</label>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => onNewItemChange({ ...newItem, name: e.target.value })}
            className="w-full px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Product name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
          <select
            value={newItem.unit}
            onChange={(e) => onNewItemChange({ ...newItem, unit: e.target.value })}
            className="w-full px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {unitOptions.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
          <input
            type="number"
            value={newItem.qty}
            onChange={(e) => onNewItemChange({ ...newItem, qty: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rate (₹)</label>
          <input
            type="number"
            value={newItem.rate}
            onChange={(e) => onNewItemChange({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="0"
          />
        </div>
        <button
          onClick={onAddItem}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddItemForm;