/**
 * UI utility functions for transaction components
 */

export const getStatusColor = (status) => {
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

export const getTypeColor = (type) => {
  switch (type) {
    case "Sale":
      return "bg-blue-100 text-blue-800";
    case "Purchase":
      return "bg-purple-100 text-purple-800";
    case "Sales Return":
      return "bg-green-100 text-green-800";
    case "Purchase Return":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const getTypeLabel = (type) => {
  switch (type) {
    case "Sale":
      return "Sale Invoice";
    case "Purchase":
      return "Purchase Invoice";
    case "Sales Return":
      return "Sales Return";
    case "Purchase Return":
      return "Purchase Return";
    default:
      return type;
  }
};
