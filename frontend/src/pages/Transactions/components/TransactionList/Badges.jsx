const StatusBadge = ({ status, getStatusColor }) => {
  return (
    <span className={`inline-flex px-2 py-1 text-[9px] font-medium rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

// Type Badge Component
const TypeBadge = ({ type, getTypeColor }) => {
  return (
    <span className={`inline-flex px-2 py-1 text-[9px] font-medium rounded-full ${getTypeColor(type)}`}>
      {type}
    </span>
  );
};

export { StatusBadge, TypeBadge };