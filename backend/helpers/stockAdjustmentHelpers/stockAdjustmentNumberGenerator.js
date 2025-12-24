// helpers/stockAdjustmentHelpers/stockAdjustmentNumberGenerator.js
import StockAdjustment from "../../model/StockAdjustmentModel.js";

export const generateStockAdjustmentNumber = async (
  companyId,
  branchId,
  session
) => {
  // Count existing adjustments for this company/branch
  const count = await StockAdjustment.countDocuments({
    company: companyId,
    branch: branchId,
  }).session(session);

  // Increment and pad
  const nextNumber = count + 1;
  const paddedNumber = String(nextNumber).padStart(6, "0");
  
  return `SA-${paddedNumber}`;
};
