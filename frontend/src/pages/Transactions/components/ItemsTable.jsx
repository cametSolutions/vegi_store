import React from "react";
import { Trash2 } from "lucide-react";
import { truncate } from "../../../../../shared/utils/string";

const ItemsTable = ({ items, onRemoveItem, handleItemClickInItemsTable }) => {

  return (
    <div className="bg-white rounded-t shadow-sm">
      <div className="h-[calc(100vh-405px)] overflow-y-auto border border-gray-200 rounded">

        <table className="w-full text-[11px] table-fixed">

          {/* ================= HEADER ================= */}
          <thead>
            <tr>
              {/* SL COLUMN */}
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center w-[50px]">
                SL
              </th>

              {/* CODE (SMALL WIDTH) */}
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-left w-[60px]">
                Code
              </th>

              {/* ITEM */}
              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-left w-[350px]">
                Item
              </th>

              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center w-[40px]">
                Unit
              </th>

              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center w-[40px]">
                Qty
              </th>

              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center w-[80px]">
                Rate
              </th>

              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center">
                Amount
              </th>

              <th className="sticky top-0 bg-slate-600 text-white px-2 py-1.5 text-center w-[60px]">
                Action
              </th>
            </tr>
          </thead>

          {/* ================= BODY ================= */}
          <tbody className="divide-y divide-slate-200 text-center">
            {items.map((item, index) => (
              <tr
                key={index}
                onClick={() => handleItemClickInItemsTable(index)}
                className="bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                {/* SL */}
                <td className="px-2 py-1.5 text-center font-medium text-slate-800">
                  {index + 1}
                </td>

                {/* CODE */}
                <td className="px-2 py-1.5 font-medium text-slate-900 text-left whitespace-nowrap">
                  {truncate(item?.itemCode, 7)}
                </td>

                {/* ITEM */}
                <td className="px-2 py-1.5 text-left text-slate-700">
                  {truncate(item?.itemName, 40)}
                </td>

                {/* UNIT */}
                <td className="px-2 py-1.5 text-slate-700">
                  {item?.unit}
                </td>

                {/* QTY */}
                <td className="px-2 py-1.5">
                  <span className="font-medium">
                    {item?.quantity}
                  </span>
                </td>

                {/* RATE */}
                <td className="px-2 py-1.5 text-slate-700">
                  ₹{item?.rate}
                </td>

                {/* AMOUNT */}
                <td className="px-2 py-1.5 font-semibold text-slate-900">
                  ₹{Number(item?.amountAfterTax)?.toFixed(2)}
                </td>

                {/* DELETE */}
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