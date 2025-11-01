// Footer Summary Component
const FooterSummary = ({ totalAmount }) => {
  return (
    <div className="flex items-center space-x-4">
      <span>Total: <span className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</span></span>
      {/* <span>Paid: <span className="font-semibold text-green-600">₹{totalPaid.toFixed(2)}</span></span>
      <span>Outstanding: <span className="font-semibold text-red-600">₹{totalOutstanding.toFixed(2)}</span></span> */}
    </div>
  );
};

// Footer Component
const ListFooter = ({ totalAmount}) => {
  return (
    <div className="px-4 py-3 border-t bg-gray-50">
      <div className="flex items-center justify-between text-[9px] text-gray-600 flex-wrap gap-2">
        {/* <FooterSummary
          totalAmount={totalAmount}
          // totalPaid={totalPaid}
          // totalOutstanding={totalOutstanding}
        /> */}
        <div className="text-[9px] text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ListFooter;