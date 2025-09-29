import React from 'react';
import { Plus } from 'lucide-react';
import { unitOptions } from '../utils/transactionUtils';

const AddItemForm = ({ newItem, onNewItemChange, products, onProductSelect, onAddItem }) => {
  return (
    <div className="bg-white  shadow-sm px-3 mt-1 py-3 ">
      {/* <h3 className="text-sm font-semibold text-slate-800 mb-2">Add Item</h3> */}
      
      {/* Quick Select Products */}
      {/* <div className="mb-2">
        <div className="flex flex-wrap gap-1">
          {products.map((product) => (
            <button
              key={product.code}
              onClick={() => onProductSelect(product)}
              className="px-2 py-0.5 text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              {product.name} (₹{product.rate})
            </button>
          ))}
        </div>
      </div> */}

      <div className="grid grid-cols-6 gap-2 items-end">
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">Code</label>
          <input
            type="text"
            value={newItem.code}
            onChange={(e) => onNewItemChange({ ...newItem, code: e.target.value })}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="V001"
          />
        </div>
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => onNewItemChange({ ...newItem, name: e.target.value })}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">Unit</label>
          <select
            value={newItem.unit}
            onChange={(e) => onNewItemChange({ ...newItem, unit: e.target.value })}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
          >
            {unitOptions.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">Qty</label>
          <input
            type="number"
            value={newItem.qty}
            onChange={(e) => onNewItemChange({ ...newItem, qty: parseFloat(e.target.value) || 0 })}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">Rate</label>
          <input
            type="number"
            value={newItem.rate}
            onChange={(e) => onNewItemChange({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <button
          onClick={onAddItem}
          className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};


export default AddItemForm;