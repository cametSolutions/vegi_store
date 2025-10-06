import { Filter } from "lucide-react";


const ListHeader = ({ title, recordCount }) => {
  return (
    <div className="flex items-center justify-between mb-3 px-1 ">
      <h3 className="text-xs font-bold text-gray-900">{title}</h3>
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-[9px] text-gray-500">{recordCount} records</span>
      </div>
    </div>
  );
};

export default ListHeader;