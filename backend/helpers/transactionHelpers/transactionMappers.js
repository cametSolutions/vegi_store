export const transactionTypeToModelName = (transactionType) => {
  const mapping = {
    'sale': 'Sale',
    'purchase': 'Purchase',
    'credit_note': 'CreditNote',
    'debit_note': 'DebitNote'
  };
  return mapping[transactionType] || transactionType;
};