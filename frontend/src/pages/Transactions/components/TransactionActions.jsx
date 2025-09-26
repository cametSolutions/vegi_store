import React from 'react';
import { Save, Eye, Trash2, X, FileText } from 'lucide-react';

const TransactionActions = ({ 
  onSave, 
  onView, 
  onDelete, 
  onCancel, 
  onPrint,
  isEditMode = false 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {isEditMode ? 'Update' : 'Save'}
        </button>
        <button 
          onClick={onView}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <button 
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        <button 
          onClick={onCancel}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
      <button 
        onClick={onPrint}
        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
      >
        <FileText className="w-4 h-4" />
        Print Document
      </button>
    </div>
  );
};


export default TransactionActions;