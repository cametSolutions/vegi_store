import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

const ItemsTable = ({ items, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="bg-white rounded-xs shadow-lg overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Item Code</th>
              <th className="px-6 py-4 text-left">Item</th>
              <th className="px-6 py-4 text-left">Unit</th>
              <th className="px-6 py-4 text-left">Qty</th>
              <th className="px-6 py-4 text-left">Rate (₹)</th>
              <th className="px-6 py-4 text-left">Amount (₹)</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{item.code}</td>
                <td className="px-6 py-4 text-slate-700">{item.name}</td>
                <td className="px-6 py-4 text-slate-700">{item.unit}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(index, Math.max(0, item.qty - 1))}
                      className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">₹{item.rate}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">₹{item.amount}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;