//// Truncates a string to a specified length and adds ellipsis if needed
export const truncate = (str, maxLength) => {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
};

/// Converts a  first letter of a string to title case
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
