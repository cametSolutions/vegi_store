const { ChevronUp, ChevronDown } = require("lucide-react");

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-40" />;
  return sortDirection === 'asc' ? 
    <ChevronUp className="w-3 h-3" /> : 
    <ChevronDown className="w-3 h-3" />;
};