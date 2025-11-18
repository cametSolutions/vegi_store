import { generatePeriodKey, getMonthYear } from "../../../shared/utils/date.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";

/**
 * Update original transaction document with new data
 * Based on actual Sale transaction schema
 */
export const updateOriginalTransactionRecord = async (
  originalTransaction,
  updatedData,
  userId,
  session
) => {
  // ========================================
  // Update all editable fields
  // ========================================
  const fieldsToUpdate = [
    // Account/Party details
    "account",
    "accountName",
    "accountType",
    "email",
    "phone",
    "openingBalance",
    
    // Price level
    "priceLevel",
    "priceLevelName",
    
    // Items array
    "items",
    
    // Amounts
    "subtotal",
    "totalTaxAmount",
    "totalAmountAfterTax",
    "discount",
    "discountAmount",
    "netAmount",
    "totalDue",
    "paidAmount",
    "balanceAmount",
    
    // Payment details
    "paymentMethod",
    "paymentStatus",
    
    // Transaction details
    "transactionDate",
    "status",
    "reference",
    "notes",
  ];

  fieldsToUpdate.forEach((field) => {
    if (updatedData[field] !== undefined) {
      originalTransaction[field] = updatedData[field];
    }
  });

  // ========================================
  // Update metadata (audit fields)
  // ========================================
  originalTransaction.lastUpdatedBy = userId;
  originalTransaction.lastUpdatedAt = new Date();
  originalTransaction.editCount = (originalTransaction.editCount || 0) + 1;
  originalTransaction.lastEditReason =  "Transaction edited";

  // Save with session
  await originalTransaction.save({ session });

  return originalTransaction;
};


/**
 * Mark monthly balances as needing recalculation
 * Recalculation will be done in nightly job.
 * CRITICAL: Mark edited month AND all subsequent months
 */
export const markMonthlyBalancesForRecalculation = async (
  original,
  updated,
  session
) => {
  const periodKey = generatePeriodKey(original.transactionDate);
  const { month, year } = getMonthYear(original.transactionDate);

  // ========================================
  // 1. Mark Account Monthly Balances as Dirty
  // ========================================
  
  // Mark edited month and all subsequent months
  await AccountMonthlyBalance.updateMany(
    {
      account: original.account,
      $or: [
        { year: { $gt: year } },  // All future years
        { 
          year: year,              // Same year
          month: { $gte: month }   // Current month onwards
        }
      ]
    },
    {
      $set: {
        needsRecalculation: true,
        lastModified: new Date(),
      },
    }
  ).session(session);

  // If account changed, also mark new account's months
  if (updated.account && updated.account.toString() !== original.account.toString()) {
    await AccountMonthlyBalance.updateMany(
      {
        account: updated.account,
        $or: [
          { year: { $gt: year } },
          { year: year, month: { $gte: month } }
        ]
      },
      {
        $set: {
          needsRecalculation: true,
          lastModified: new Date(),
        },
      }
    ).session(session);
  }

  // ========================================
  // 2. Mark Item Monthly Balances as Dirty
  // ========================================
  
  // Collect all unique items (original + updated)
  const allItemIds = new Set();
  
  original.items.forEach(item => {
    allItemIds.add(item.item.toString());
  });
  
  if (updated.items) {
    updated.items.forEach(item => {
      allItemIds.add(item.item.toString());
    });
  }

  // Mark each item's monthly balances (current month onwards)
  for (const itemId of allItemIds) {
    await ItemMonthlyBalance.updateMany(
      {
        item: itemId,
        branch: original.branch,
        $or: [
          { year: { $gt: year } },
          { year: year, month: { $gte: month } }
        ]
      },
      {
        $set: {
          needsRecalculation: true,
          lastModified: new Date(),
        },
      }
    ).session(session);
  }

  console.log(`✅ Marked ${year}-${month} and all subsequent months as dirty`);

  return { 
    success: true,
    markedFrom: `${year}-${month}`,
    message: "All months from edited month onwards marked for recalculation"
  };
};


