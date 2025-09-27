import { useState } from "react";
import ListFooter from "./ListFooter";
import ListHeader from "./ListHeader";
import ListSearch from "./ListSearch";
import ListTable from "./ListTable";

const TransactionList = () => {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy transaction data - mixed types
  const transactionData = [
    {
      id: "INV-280592",
      date: "27/09/2025",
      party: "UDUFP H.",
      type: "Sale",
      total: 4545.5,
      discount: 0.0,
      paid: 0.0,
      balance: 4545.5,
      status: "pending",
    },
    {
      id: "PUR-280593",
      date: "27/09/2025",
      party: "ANTHU A.",
      type: "Purchase",
      total: 2144.8,
      discount: 0.0,
      paid: 2144.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "INV-280594",
      date: "27/09/2025",
      party: "BAVU P",
      type: "Sale",
      total: 6273.6,
      discount: 500.0,
      paid: 5773.6,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280595",
      date: "27/09/2025",
      party: "SULYMAN",
      type: "Credit Note",
      total: 1091.3,
      discount: 130.0,
      paid: 961.3,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "PUR-280596",
      date: "27/09/2025",
      party: "BABU SAS.",
      type: "Purchase",
      total: 3716.4,
      discount: 0.0,
      paid: 1716.4,
      balance: 2000.0,
      status: "partial",
    },
    {
      id: "DN-280597",
      date: "26/09/2025",
      party: "S P",
      type: "Debit Note",
      total: 4150.7,
      discount: 350.0,
      paid: 3800.7,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "INV-280598",
      date: "26/09/2025",
      party: "HASSAN",
      type: "Sale",
      total: 8460.8,
      discount: 0.0,
      paid: 8460.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "PUR-280599",
      date: "26/09/2025",
      party: "ESMAYL",
      type: "Purchase",
      total: 4407.6,
      discount: 0.0,
      paid: 0.0,
      balance: 4407.6,
      status: "pending",
    },
    {
      id: "INV-280600",
      date: "25/09/2025",
      party: "L F",
      type: "Sale",
      total: 2558.8,
      discount: 0.0,
      paid: 2558.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
    {
      id: "CN-280601",
      date: "25/09/2025",
      party: "PEETER",
      type: "Credit Note",
      total: 2640.8,
      discount: 500.0,
      paid: 2140.8,
      balance: 0.0,
      status: "paid",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Sale":
        return "bg-blue-100 text-blue-800";
      case "Purchase":
        return "bg-purple-100 text-purple-800";
      case "Credit Note":
        return "bg-green-100 text-green-800";
      case "Debit Note":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = transactionData.filter(
    (transaction) =>
      transaction.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (
      sortField === "total" ||
      sortField === "paid" ||
      sortField === "balance"
    ) {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const calculateTotals = () => {
    const totalAmount = sortedData.reduce(
      (sum, transaction) => sum + transaction.total,
      0
    );
    const totalOutstanding = sortedData.reduce(
      (sum, transaction) => sum + transaction.balance,
      0
    );
    const totalPaid = sortedData.reduce(
      (sum, transaction) => sum + transaction.paid,
      0
    );

    return { totalAmount, totalOutstanding, totalPaid };
  };

  const { totalAmount, totalOutstanding, totalPaid } = calculateTotals();

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
          onSearchChange={setSearchTerm}
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
