export const formatINR = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};