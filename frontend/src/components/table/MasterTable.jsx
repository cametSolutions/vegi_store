
import { Pencil, Trash } from "lucide-react"
import clsx from "clsx"
export function MasterTable({
  headers,
  data,
  onEdit,
  onDelete,
  action = false,
  className,
  tableClassName,
  rowClassName,
  cellClassName
}) {
  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white w-full",
        className
      )}
    >
      <table
        className={clsx("min-w-full border-collapse text-sm", tableClassName)}
      >
        {/* Table Header */}
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider">
            <th className="px-4 py-3 text-left border-b border-gray-200">No</th>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold border-b border-gray-200"
              >
                {header}
              </th>
            ))}
            {action && (
              <th className="px-4 py-3 text-center border-b border-gray-200">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.length > 0 ? (
            data.map((item, idx) => (
              <tr
                key={item.id}
                className={clsx(
                  "hover:bg-gray-50 transition-colors duration-200",
                  rowClassName
                )}
              >
                <td
                  className={clsx(
                    "px-4 py-3 text-gray-800 border-b border-gray-100",
                    cellClassName
                  )}
                >
                  {idx + 1}
                </td>
                {Object.values(item).map((val, index) => (
                  <td
                    key={index}
                    className={clsx(
                      "px-4 py-3 text-gray-800 border-b border-gray-100",
                      cellClassName
                    )}
                  >
                    {String(val)}
                  </td>
                ))}
                {action && (
                  <td
                    className={clsx(
                      "px-4 py-3 flex items-center justify-center gap-3 border-b border-gray-100",
                      cellClassName
                    )}
                  >
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="text-center py-6 text-gray-500"
              >
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
