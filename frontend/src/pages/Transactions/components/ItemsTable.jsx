import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

const ItemsTable = ({ items, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="bg-white rounded-t shadow-sm">
      <div className="h-[calc(100vh-358px)] overflow-y-auto border border-gray-200 rounded">
        <table className="w-full text-[9px]">
          <thead>
            <tr>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-left z-10">
                Code
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Item
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Unit
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Qty
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Rate
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Amount
              </th>
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center z-10">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-center">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left">
                  {item.code}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.name}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() =>
                        onUpdateQuantity(index, Math.max(0, item.qty - 1))
                      }
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.qty + 1)}
                      className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amount}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-colors"
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
