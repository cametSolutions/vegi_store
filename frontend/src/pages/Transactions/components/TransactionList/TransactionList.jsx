import ListFooter from "./ListFooter";
import ListHeader from "./ListHeader";
import ListSearch from "./ListSearch";
import ListTable from "./ListTable";
import { useTransactionListActions } from "../../hooks/useTransactionListActions";

const TransactionList = () => {
  const {
    sortField,
    sortDirection,
    searchTerm,
    sortedData,
    totals: { totalAmount, totalOutstanding, totalPaid },
    getStatusColor,
    getTypeColor,
    handleSort,
    handleSearchChange,
  } = useTransactionListActions();

  return (
    <div className="w-full h-[calc(100vh-110px)] bg-white rounded-xs shadow-sm border flex flex-col">
      {/* Header Section */}
      <div className="px-1 py-2 border-b  flex-shrink-0">
        <ListHeader
          title="Recent Transactions"
          recordCount={sortedData.length}
        />
        <ListSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search by party, document, or type..."
        />
      </div>

      {/* Table Section (Scrollable) */}
      <div className="flex-1 overflow-y-hidden overflow-x-auto">
        <table className="w-full">
          <ListTable
            data={sortedData}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        </table>
      </div>

      {/* Footer Section */}
      <div className="flex-shrink-0 border-t">
        <ListFooter
          totalAmount={totalAmount}
          totalPaid={totalPaid}
          totalOutstanding={totalOutstanding}
        />
      </div>
    </div>
  );
};

export default TransactionList;