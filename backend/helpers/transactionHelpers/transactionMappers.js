import { ReceiptModel } from "../../model/FundTransactionMode.js";
import { PurchaseModel, SalesModel } from "../../model/TransactionModel.js";

export const transactionTypeToModelName = (transactionType) => {
  const mapping = {
    sale: "Sale",
    purchase: "Purchase",
    credit_note: "CreditNote",
    debit_note: "DebitNote",
  };

  console.log("haiii",mapping[transactionType]);
  
  return mapping[transactionType] || transactionType;
};

// This function now returns the actual Mongoose model
export const getTransactionModel = (transactionType) => {
  const mapping = {
    sale: SalesModel,
    purchase: PurchaseModel,
    receipt: ReceiptModel,
    // credit_note: CreditNoteModel, // You'll need to create these
    // debit_note: DebitNoteModel, // You'll need to create these
  };
  return mapping[transactionType];
};
