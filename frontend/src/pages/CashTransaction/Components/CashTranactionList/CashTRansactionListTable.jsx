import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function TransactionList() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const transactions = [
    { billNo: 'PUR-280596', PayPaydate: '27/09/2025', AccountName: 'BABU SAS', PreviousBlanceAmount: '₹3716.40', amount: '₹0.00', paid: '₹3716.40', closingBalnceAmount: '₹2000.00', status: 'unpaid' },
    { billNo: 'CN-280595', Paydate: '27/09/2025', AccountName: 'SULYMAN', PreviousBlanceAmount: '₹1051.30', amount: '₹130.00', paid: '₹961.30', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'INV-280594', Paydate: '27/09/2025', AccountName: 'BAVU P', PreviousBlanceAmount: '₹6273.60', amount: '₹500.00', paid: '₹5773.60', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'PUR-280593', Paydate: '27/09/2025', AccountName: 'ANTHU A.', PreviousBlanceAmount: '₹2144.80', amount: '₹0.00', paid: '₹2144.80', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'INV-280592', Paydate: '27/09/2025', AccountName: 'UDUPP H.', PreviousBlanceAmount: '₹4545.50', amount: '₹0.00', paid: '₹0.00', closingBalnceAmount: '₹4545.50', status: 'unpaid' },
    { billNo: 'PUR-280599', Paydate: '26/09/2025', AccountName: 'ESMAYL', PreviousBlanceAmount: '₹4407.60', amount: '₹0.00', paid: '₹0.00', closingBalnceAmount: '₹4407.60', status: 'unpaid' },
    { billNo: 'INV-280598', Paydate: '26/09/2025', AccountName: 'HASSAN', PreviousBlanceAmount: '₹8460.80', amount: '₹0.00', paid: '₹8460.80', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'DN-280597', Paydate: '26/09/2025', AccountName: 'S P', PreviousBlanceAmount: '₹4150.70', amount: '₹350.00', paid: '₹3800.70', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'CN-280601', Paydate: '25/09/2025', AccountName: 'PEETER', PreviousBlanceAmount: '₹2640.80', amount: '₹500.00', paid: '₹2140.80', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'CN-280601', Paydate: '25/09/2025', AccountName: 'PEETER', PreviousBlanceAmount: '₹2640.80', amount: '₹500.00', paid: '₹2140.80', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'CN-280601', Paydate: '25/09/2025', AccountName: 'PEETER', PreviousBlanceAmount: '₹2640.80', amount: '₹500.00', paid: '₹2140.80', closingBalnceAmount: '₹0.00', status: 'paid' },
    { billNo: 'CN-280601', Paydate: '25/09/2025', AccountName: 'PEETER', PreviousBlanceAmount: '₹2640.80', amount: '₹500.00', paid: '₹2140.80', closingBalnceAmount: '₹0.00', status: 'paid' }
  ];

  const filteredTransactions = transactions.filter(t => 
    t.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.AccountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-700 text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase">Bill No</th>
              <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase">Paydate</th>
              <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase">AccountName</th>
              <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase">PreviousBlanceAmount</th>
              <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase">amount</th>

              <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase">closingBalnceAmount</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredTransactions.map((transaction, index) => (
              <tr 
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-center text-[9px] text-gray-700">{transaction.billNo}</td>
                <td className="px-4 py-3  text-center text-[9px] text-gray-600">{transaction.Paydate}</td>
                <td className="px-4 py-3 text-center text-[9px] text-gray-700 font-medium">{transaction.AccountName}</td>
                <td className="px-4 py-3 text-center text-[9px] text-gray-700 text-right">{transaction.PreviousBlanceAmount}</td>
                <td className="px-4 py-3 text-center text-[9px] text-gray-700 text-right">{transaction.amount}</td>
             
                <td className={`px-4 py-3 text-[9px] text-right font-semibold ${
                  transaction.status === 'unpaid' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {transaction.closingBalnceAmount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
     
    </div>
  );
}