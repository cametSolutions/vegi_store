import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

const ItemsTable = ({ items, onUpdateQuantity, onRemoveItem }) => {
  console.log("item table component renders");

  return (
    <div className="bg-white rounded-t shadow-sm">
      <div className="h-[calc(100vh-358px)] overflow-y-auto border border-gray-200 rounded">
        <table className="w-full text-[9px]">
          <thead>
            <tr>
              <th className="sticky top-0 bg-slate-600 text-white px-4 py-1.5 text-left z-10">
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
                <td className="px-5 py-1.5 font-medium text-slate-900 text-left">
                  {item.itemCode}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item.itemName}</td>
                <td className="px-2 py-1.5 text-slate-700">{item.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="">
                    <span className="w-6 text-center font-medium">
                      {item.quantity}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item.amountAfterTax}
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
