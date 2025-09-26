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
    <div className="bg-white rounded-xs shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          {isEditMode ? 'Update' : 'Save'}
        </button>
        <button 
          onClick={onView}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Eye className="w-5 h-5" />
          View
        </button>
        <button 
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Delete
        </button>
        <button 
          onClick={onCancel}
          className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
      <button 
        onClick={onPrint}
        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <FileText className="w-5 h-5" />
        Print Document
      </button>
    </div>
  );
};

export default TransactionActions;