// src/components/Outstanding/SettlementModal.jsx

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Receipt, Coins, FileText, Banknote, History, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "../../../../shared/utils/date";
import { formatINR } from "../../../../shared/utils/currency";
import { outstandingQueries } from "../../hooks/queries/outstandingQueries";

const SettlementModal = ({ isOpen, onClose, transaction }) => {
  const [includeReversed, setIncludeReversed] = useState(false);

  // ✅ MOVE useQuery BEFORE early return - hooks must be called unconditionally
  const { data, isLoading, isError, error, refetch } = useQuery({
    ...outstandingQueries.settlements(transaction?._id, { includeReversed }),
    enabled: isOpen && !!transaction?._id, // Only fetch when modal is open and transaction exists
  });

  // ✅ NOW you can do early return AFTER all hooks
  if (!isOpen || !transaction) return null;

  const settlements = data?.data?.settlements || [];
  const summary = data?.data?.summary || {};
  const byType = data?.data?.byType || [];
  const outstandingDetails = data?.data?.outstanding || transaction;

  const totalSettled = summary.totalSettled || 0;
  const remaining = summary.remaining || 0;

  const getTypeLabel = (type) => {
    switch (type) {
      case "offset": return "Offset";
      case "receipt": return "Receipt";
      case "payment": return "Payment";
      default: return type;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "offset": return <Coins className="w-4 h-4" />;
      case "receipt": return <Receipt className="w-4 h-4" />;
      case "payment": return <Banknote className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "offset": return "purple";
      case "receipt": return "green";
      case "payment": return "blue";
      default: return "slate";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 h-[calc(100vh-110px)] z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex-none flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-50 rounded-lg">
                <History className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Settlement History</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {transaction.transactionNumber} • {formatDate(transaction.transactionDate)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading settlements...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Failed to load settlements
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {error?.message || "An error occurred while fetching data"}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              {/* Summary Cards - Fixed */}
              <div className="flex-none px-6 pt-5 pb-4 bg-white">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-slate-800">{formatINR(outstandingDetails.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-[10px] uppercase font-semibold text-green-700 mb-1">Total Settled</p>
                    <p className="text-lg font-bold text-green-700">{formatINR(totalSettled)}</p>
                  </div>
                  <div className={`${remaining > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} rounded-lg p-3 border`}>
                    <p className="text-[10px] uppercase font-semibold text-slate-600 mb-1">Remaining</p>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-lg font-bold ${remaining > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                        {formatINR(remaining)}
                      </p>
                      {remaining > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${outstandingDetails.outstandingType === 'dr' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'}`}>
                          {outstandingDetails.outstandingType === 'dr' ? 'DR' : 'CR'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                    <p className="text-[10px] uppercase font-semibold text-sky-700 mb-1">Settlements</p>
                    <p className="text-lg font-bold text-sky-700">{settlements.length}</p>
                  </div>
                </div>
              </div>

              {/* No Settlements Message */}
              {settlements.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No settlements found</p>
                    <p className="text-xs mt-1">This outstanding has not been settled yet</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Table Container - Only tbody scrollable */}
                  <div className="flex-1 px-6 pb-5 overflow-hidden flex flex-col">
                    <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
                      <table className="w-full">
                        {/* Table Header - Fixed */}
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-12">#</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-32">Type</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Reference Number</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-32">Date</th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-32">Amount</th>
                          </tr>
                        </thead>
                      </table>

                      {/* Table Body - Scrollable */}
                      <div className="overflow-y-auto custom-scrollbar flex-1">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {settlements.map((settlement, index) => {
                              const color = getTypeColor(settlement.transactionType);
                              const isReversed = settlement.settlementStatus === "reversed";
                              
                              return (
                                <tr 
                                  key={settlement._id}
                                  className={`hover:bg-slate-50 transition-colors ${isReversed ? 'opacity-50' : ''}`}
                                >
                                  <td className="px-4 py-3 text-xs text-slate-400 font-medium w-12">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 w-32">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-${color}-600`}>
                                        {getTypeIcon(settlement.transactionType)}
                                      </span>
                                      <span className={`text-[10px] font-semibold px-2 py-1 rounded border bg-${color}-50 text-${color}-700 border-${color}-200`}>
                                        {getTypeLabel(settlement.transactionType)}
                                      </span>
                                      {isReversed && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                          Reversed
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-semibold text-slate-800 font-mono ${isReversed ? 'line-through' : ''}`}>
                                    {settlement.transactionNumber}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-600 w-32">
                                    {formatDate(settlement.settlementDate)}
                                  </td>
                                  <td className={`px-4 py-3 text-right text-sm font-bold text-slate-800 font-mono w-32 ${isReversed ? 'line-through' : ''}`}>
                                    {formatINR(settlement.settledAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Footer - Fixed */}
                      <table className="w-full">
                        <tfoot>
                          <tr className="bg-slate-50 border-t-2 border-slate-300">
                            <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">
                              Total Settled:
                            </td>
                            <td className="px-4 py-3 text-right text-base font-bold text-green-700 font-mono w-32">
                              {formatINR(totalSettled)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Summary by Type - Fixed */}
                  {byType.length > 0 && (
                    <div className="flex-none px-6 pb-5 bg-white">
                      <div className="grid grid-cols-3 gap-3">
                        {byType.map((typeData) => {
                          const color = getTypeColor(typeData.type);
                          return (
                            <div key={typeData.type} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-${color}-600`}>
                                  {getTypeIcon(typeData.type)}
                                </span>
                                <p className={`text-xs font-semibold text-${color}-700 uppercase`}>
                                  {getTypeLabel(typeData.type)}
                                </p>
                              </div>
                              <p className={`text-sm font-bold text-${color}-800`}>
                                {formatINR(typeData.total)}
                              </p>
                              <p className={`text-[10px] text-${color}-600 mt-0.5`}>
                                {typeData.count} transaction{typeData.count > 1 ? 's' : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Footer - Fixed */}
          <div className="flex-none flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-600">
                {!isLoading && (
                  <>
                    Showing <span className="font-semibold text-slate-800">{settlements.filter(s => s.settlementStatus === 'active').length}</span> active settlement{settlements.filter(s => s.settlementStatus === 'active').length !== 1 ? 's' : ''}
                  </>
                )}
              </div>
              {summary.reversedCount > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeReversed}
                    onChange={(e) => setIncludeReversed(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Show reversed ({summary.reversedCount})
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default SettlementModal;
