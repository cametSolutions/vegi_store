import React from "react";
import { Save, Eye, Trash2, X, FileText } from "lucide-react";

const TransactionActions = ({
  onSave,
  onView,
  onDelete,
  onCancel,
  onPrint,
  isEditMode = false,
}) => {

  console.log("transaction actions component renders");

  return (
    <div className="mt-2">
      <div className="grid grid-cols-4 gap-2">
        {/* Primary Action - Darkest Blue */}
        <button
          onClick={onSave}
          className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[9px]"
        >
          <Save className="w-3 h-3" />
          {isEditMode ? "Update" : "Save"}
        </button>

        {/* Secondary Action - Medium Blue */}
        {/* <button
          onClick={onView}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[9px]"
        >
          <Eye className="w-3 h-3" />
          View
        </button> */}

        {/* Destructive - Red (Exception) */}
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[9px]"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>

        {/* Neutral - Light Blue */}
        <button
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[9px]"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>

        {/* Tertiary - Lightest Blue */}
        <button
          onClick={onPrint}
          className="bg-violet-500 hover:bg-violet-500 text-white px-2 py-2.5 rounded font-bold flex items-center justify-center gap-1 transition-colors text-[9px]"
        >
          <FileText className="w-3 h-3" />
          Print
        </button>
      </div>
    </div>
  );
};

export default TransactionActions;
