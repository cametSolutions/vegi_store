import { getTransactionModel } from "./transactionMappers.js";

export const getTransactionModelName = (transactionType) => {
  const mapping = {
    sale: "Sale",
    purchase: "Purchase",
    sales_return: "CreditNote",
    purchase_return: "DebitNote",
  };
  return mapping[transactionType] || transactionType;
};

/**
 * Fetch original transaction by ID
 */
export const fetchOriginalTransaction = async (
  transactionId,
  transactionType,
  session
) => {
  const TransactionModel = getTransactionModel(transactionType);

  const transaction = await TransactionModel.findById(transactionId).session(
    session
  );

  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  return transaction;
};

/** * Determine transaction behavior based on type
 */

export const determineTransactionBehavior =  (transactionType) => {
  const behaviors = {
    sale: {
      stockDirection: "out",
      outstandingType: "dr", // Customer owes us (receivable)
      ledgerSide: "debit",
    },
    purchase_return: {
      stockDirection: "out",
      outstandingType: "dr",
      ledgerSide: "debit",
    },
    purchase: {
      stockDirection: "in",
      outstandingType: "cr", // We owe supplier (payable)
      ledgerSide: "credit",
    },
    sales_return: {
      stockDirection: "in",
      outstandingType: "cr",
      ledgerSide: "credit",
    },
  };

  const behavior = behaviors[transactionType];

  if (!behavior) {
    throw new Error(`Invalid transaction type: ${transactionType}`);
  }

  return behavior;
};
