// helpers/stockAdjustmentHelpers/stockAdjustmentNumberGenerator.js
import { nanoid } from "nanoid";
import StockAdjustment from "../../model/StockAdjustmentModel.js";

export const generateStockAdjustmentNumber = async (
  transactionType
) => {
  const prefix = transactionType?.toUpperCase().slice(0, 3) || "TXN";
  return `${prefix}-${nanoid(4)}`;
};
