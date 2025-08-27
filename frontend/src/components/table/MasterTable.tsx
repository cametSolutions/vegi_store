
import { Pencil, Trash } from "lucide-react"

interface TableProps<T> {
  headers: string[]
  data: T[]
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}

export function MasterTable<T extends { id: string }>({
  headers,
  data,
  onEdit,
  onDelete
}: TableProps<T>) {
  console.log(data)
  return (
    <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-200 bg-white w-full">
      <table className="min-w-full border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
            <th className="px-4 py-3 text-left border-b border-gray-200">
              No
            </th>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold border-b border-gray-200"
              >
                {header}
              </th>
            ))}
            <th className="px-4 py-3 text-center border-b border-gray-200">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                {Object.values(item).map((val, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-gray-800 text-sm border-b border-gray-100"
                  >
                    {String(val)}
                  </td>
                ))}
                {/* Action Buttons */}
                <td className="px-4 py-3 flex items-center justify-center gap-3 border-b border-gray-100">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </td>
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
