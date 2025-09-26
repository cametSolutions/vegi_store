import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

const ItemsTable = ({ items, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="bg-white rounded-xs shadow overflow-hidden">
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-slate-600 text-white sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Item Code</th>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-left">Qty</th>
              <th className="px-3 py-2 text-left">Rate (₹)</th>
              <th className="px-3 py-2 text-left">Amount (₹)</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{item.code}</td>
                <td className="px-3 py-2 text-slate-700">{item.name}</td>
                <td className="px-3 py-2 text-slate-700">{item.unit}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(index, Math.max(0, item.qty - 1))}
                      className="w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-700">₹{item.rate}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">₹{item.amount}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
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