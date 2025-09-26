import React from 'react';
import { Calendar, User } from 'lucide-react';
import { getPartyLabel, getDocumentLabel } from '../utils/transactionUtils';

const TransactionHeader = ({ 
  transactionData, 
  onTransactionChange, 
  currentTransactionType 
}) => {
  const partyLabel = getPartyLabel(transactionData.type);
  const documentLabel = getDocumentLabel(transactionData.type);

  return (
    <div className="bg-white rounded-xs shadow p-6 mb-6 border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className={`w-12 h-12 bg-${currentTransactionType.color}-600 rounded-xl flex items-center justify-center`}>
              <currentTransactionType.icon className="text-white w-7 h-7" />
            </div>
            Transaction Manager
          </h1>
        </div>
        <div className="text-sm text-slate-500">
          {documentLabel}: <span className="font-semibold text-slate-700">{transactionData.documentNo}</span>
        </div>
      </div>

      {/* Date and Party Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date
          </label>
          <input
            type="date"
            value={transactionData.date}
            onChange={(e) => onTransactionChange({ ...transactionData, date: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Party Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="partyType"
                value="customer"
                checked={transactionData.partyType === 'customer'}
                onChange={(e) => onTransactionChange({ ...transactionData, partyType: e.target.value })}
                className="mr-2 text-blue-600 "
              />
              {partyLabel}
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="partyType"
                value="others"
                checked={transactionData.partyType === 'others'}
                onChange={(e) => onTransactionChange({ ...transactionData, partyType: e.target.value })}
                className="mr-2 text-blue-600"
              />
              Others
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{partyLabel} Name</label>
          <input
            type="text"
            value={transactionData.partyName}
            onChange={(e) => onTransactionChange({ ...transactionData, partyName: e.target.value })}
            placeholder={`Enter ${partyLabel.toLowerCase()} name`}
            className=" shadow-lg w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Opening Balance</label>
          <input
            type="number"
            value={transactionData.balance}
            onChange={(e) => onTransactionChange({ ...transactionData, balance: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Reference</label>
          <input
            type="text"
            value={transactionData.reference}
            onChange={(e) => onTransactionChange({ ...transactionData, reference: e.target.value })}
            placeholder="Reference number/note"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
          <input
            type="text"
            value={transactionData.notes}
            onChange={(e) => onTransactionChange({ ...transactionData, notes: e.target.value })}
            placeholder="Additional notes"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;