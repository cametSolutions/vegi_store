import { Search, X } from "lucide-react";

const ListSearch = ({ searchTerm, onSearchChange, placeholder }) => {
  return (
    <div className="relative">
      {/* Search Icon (Left) */}
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-8 py-2 text-[9px] border border-gray-300 rounded-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Clear (X) Icon (Right) */}
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default ListSearch;

