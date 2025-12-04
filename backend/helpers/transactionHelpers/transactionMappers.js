import { ReceiptModel } from "../../model/FundTransactionMode.js";
import { PurchaseModel, SalesModel, SalesReturnModel, PurchaseReturnModel } from "../../model/TransactionModel.js";

export const transactionTypeToModelName = (transactionType) => {
  const mapping = {
    sale: "Sale",
    purchase: "Purchase",
    sales_return: "SalesReturn",
    purchase_return: "PurchaseReturn",
  };

  
  return mapping[transactionType] || transactionType;
};

// This function now returns the actual Mongoose model
export const getTransactionModel = (transactionType) => {
  const mapping = {
    sale: SalesModel,
    purchase: PurchaseModel,
    receipt: ReceiptModel,
    sales_return: SalesReturnModel, // You'll need to create these
    purchase_return: PurchaseReturnModel, // You'll need to create these
  };
  return mapping[transactionType];
};
