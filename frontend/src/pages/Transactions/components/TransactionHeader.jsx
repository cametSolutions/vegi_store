import React from 'react';
import { Calendar, User } from 'lucide-react';
import { getPartyLabel, getDocumentLabel } from '../utils/transactionUtils';

const TransactionHeader = ({ transactionData, onTransactionChange, currentTransactionType }) => {
  const partyLabel = getPartyLabel(transactionData.type);

  return (
    <div className="bg-white rounded-xs border shadow p-4 mb-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date
          </label>
          <input
            type="date"
            value={transactionData.date}
            onChange={(e) => onTransactionChange({ ...transactionData, date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <User className="inline w-4 h-4 mr-1" />
            Party Type
          </label>
          <div className="flex gap-3 text-sm mt-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="partyType"
                value="customer"
                checked={transactionData.partyType === 'customer'}
                onChange={(e) => onTransactionChange({ ...transactionData, partyType: e.target.value })}
                className="mr-1 text-blue-600"
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
                className="mr-1 text-blue-600"
              />
              Others
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{partyLabel} Name</label>
          <input
            type="text"
            value={transactionData.partyName}
            onChange={(e) => onTransactionChange({ ...transactionData, partyName: e.target.value })}
            placeholder={`Enter ${partyLabel.toLowerCase()} name`}
            className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
          <input
            type="number"
            value={transactionData.balance}
            onChange={(e) => onTransactionChange({ ...transactionData, balance: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
          <input
            type="text"
            value={transactionData.reference}
            onChange={(e) => onTransactionChange({ ...transactionData, reference: e.target.value })}
            placeholder="Reference number/note"
            className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <input
            type="text"
            value={transactionData.notes}
            onChange={(e) => onTransactionChange({ ...transactionData, notes: e.target.value })}
            placeholder="Additional notes"
            className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;