// helpers/stockAdjustmentHelpers/stockAdjustmentProcessor.js
import StockAdjustment from "../../model/StockAdjustmentModel.js";
import { updateStock } from "../transactionHelpers/stockManager.js";
import { createItemLedgers } from "../CommonTransactionHelper/ledgerService.js";
import { updateItemMonthlyBalances } from "../CommonTransactionHelper/monthlyBalanceService.js";
import { generateStockAdjustmentNumber } from "./stockAdjustmentNumberGenerator.js";

/**
 * Process stock adjustment - creates adjustment, updates stock, ledgers, and balances
 */
export const processStockAdjustment = async (
  adjustmentData,
  userId,
  session
) => {
  try {
    const { company, branch, items, adjustmentType } = adjustmentData;

    // Step 1: Determine behavior
    const behavior = determineAdjustmentBehavior(adjustmentType);

    // Step 2: Update stock
    await updateStock(items, behavior.stockDirection, branch, session);

    // Step 3: Generate number
    const transactionNumber =
      adjustmentData.transactionNumber ||
      (await generateStockAdjustmentNumber(company, branch, session));

    // Step 4: Process items WITH all required fields for ledger
    const processedItems = items.map((item) => {
      const baseAmount = item.quantity * (item.rate || 0);
      
      return {
        ...item,
        amount: baseAmount,
        baseAmount: baseAmount,        // ✅ Required for ItemLedger
        amountAfterTax: baseAmount,    // ✅ Required for ItemLedger
        taxRate: 0,                    // ✅ Required for ItemLedger
        taxAmount: 0,                  // ✅ Required for ItemLedger
      };
    });

    const totalAmount = processedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Step 5: Create adjustment record
    const stockAdjustment = await StockAdjustment.create(
      [
        {
          ...adjustmentData,
          transactionNumber,
          items: processedItems,
          totalAmount,
          createdBy: userId,
          status: "completed",
        },
      ],
      { session }
    );

    const createdAdjustment = stockAdjustment[0];

    // Step 6: Create item ledgers (items now have all required fields)
    const itemLedgers = await createItemLedgers(
      {
        company: createdAdjustment.company,
        branch: createdAdjustment.branch,
        items: createdAdjustment.items, // ✅ Now includes baseAmount, amountAfterTax, taxRate, taxAmount
        transactionId: createdAdjustment._id,
        transactionNumber: createdAdjustment.transactionNumber,
        transactionDate: createdAdjustment.transactionDate,
        transactionType: "stock_adjustment",
        movementType: behavior.movementType,
        account: null,
        accountName: "Stock Adjustment",
        createdBy: userId,
      },
      session
    );

    // Step 7: Update monthly balances
    await updateItemMonthlyBalances(
      {
        company: createdAdjustment.company,
        branch: createdAdjustment.branch,
        items: createdAdjustment.items,
        transactionDate: createdAdjustment.transactionDate,
        movementType: behavior.movementType,
      },
      session
    );

    return {
      stockAdjustment: createdAdjustment,
      itemLedgers,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Determine behavior based on adjustment type
 */
function determineAdjustmentBehavior(adjustmentType) {
  const behaviors = {
    add: {
      stockDirection: "in",
      movementType: "in",
    },
    remove: {
      stockDirection: "out",
      movementType: "out",
    },
  };

  const behavior = behaviors[adjustmentType];

  if (!behavior) {
    throw new Error(`Invalid adjustment type: ${adjustmentType}`);
  }

  return behavior;
}

/**
 * Revert stock adjustment (for edit/delete)
 */
export const revertStockAdjustment = async (
  originalAdjustment,
  userId,
  session
) => {
  try {
    const { items, adjustmentType, branch, company } = originalAdjustment;

    // Reverse behavior
    const reverseBehavior = determineAdjustmentBehavior(
      adjustmentType === "add" ? "remove" : "add"
    );

    // Reverse stock
    await updateStock(items, reverseBehavior.stockDirection, branch, session);

    // Create reversing ledgers
    // Note: items from originalAdjustment already have baseAmount, amountAfterTax, etc.
    const reversingItemLedgers = await createItemLedgers(
      {
        company: company,
        branch: branch,
        items: items, // ✅ Already has all required fields from original creation
        transactionId: originalAdjustment._id,
        transactionNumber: `REV-${originalAdjustment.transactionNumber}`,
        transactionDate: new Date(),
        transactionType: "stock_adjustment_reversal",
        movementType: reverseBehavior.movementType,
        account: null,
        accountName: "Stock Adjustment Reversal",
        createdBy: userId,
      },
      session
    );

    // Update monthly balances
    await updateItemMonthlyBalances(
      {
        company: company,
        branch: branch,
        items: items,
        transactionDate: new Date(),
        movementType: reverseBehavior.movementType,
      },
      session
    );

    return {
      success: true,
      reversingItemLedgers,
    };
  } catch (error) {
    throw error;
  }
};
