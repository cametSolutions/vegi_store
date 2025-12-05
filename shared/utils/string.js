//// Truncates a string to a specified length and adds ellipsis if needed
export const truncate = (str, maxLength) => {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
};

export const capitalizeFirstLetter = (str = "") => {
  if (!str) return "";
  return str
    .replace(/_/g, " ") // replace underscores with space
    .toLowerCase() // convert entire string to lowercase
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize first letter of each word
};
