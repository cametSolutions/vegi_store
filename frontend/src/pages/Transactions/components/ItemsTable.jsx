import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { truncate } from "../../../../../shared/utils/string";

const ItemsTable = ({ items, onRemoveItem, handleItemClickInItemsTable }) => {
  console.log("item table component renders");

  // const handleItemClick=(item)=>{
  //   // console.log("item",item)
  //   handleItemClickInItemsTable(item)
  // }

  return (
    <div className="bg-white rounded-t shadow-sm">
      <div className="h-[calc(100vh-405px)] overflow-y-auto border border-gray-200 rounded">
        <table className="w-full text-[11px]">
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
              <tr
                onClick={() => handleItemClickInItemsTable(item)}
                key={index}
                className= " bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <td className="px-5 py-1.5 font-medium text-slate-900 text-left">
                  {truncate(item?.itemCode, 7)}
                </td>
                <td className="px-2 py-1.5 text-slate-700">
                  {truncate(item?.itemName, 15)}
                </td>
                <td className="px-2 py-1.5 text-slate-700">{item?.unit}</td>
                <td className="px-2 py-1.5">
                  <div className="">
                    <span className="w-6 text-center font-medium">
                      {item?.quantity}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-700">₹{item?.rate}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{item?.amountAfterTax}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveItem(index);
                    }}
                    className="text-red-600 hover:text-red-800 p-0.5 transition-all transform hover:scale-110 ease-in-out duration-200"
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
