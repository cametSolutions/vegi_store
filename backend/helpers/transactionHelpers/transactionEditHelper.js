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
  
  // Mark edited month and all subsequent months for original account
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
  // 2. Mark ONLY CHANGED Items as Dirty
  // ========================================
  
  // Build maps for comparison: itemId → item data
  const originalItemsMap = new Map();
  original.items.forEach(item => {
    originalItemsMap.set(item.item.toString(), {
      quantity: item.quantity,
      rate: item.rate,
    });
  });

  const updatedItemsMap = new Map();
  if (updated.items) {
    updated.items.forEach(item => {
      updatedItemsMap.set(item.item.toString(), {
        quantity: item.quantity,
        rate: item.rate,
      });
    });
  }

  // ========================================
  // Detect which items actually changed
  // ========================================
  const changedItemIds = new Set();

  // Check for modified or removed items
  for (const [itemId, originalData] of originalItemsMap) {
    const updatedData = updatedItemsMap.get(itemId);
    
    if (!updatedData) {
      // Item was REMOVED from transaction
      changedItemIds.add(itemId);
      console.log(`   🗑️  Item ${itemId} removed`);
    } else if (
      originalData.quantity !== updatedData.quantity ||
      originalData.rate !== updatedData.rate
    ) {
      // Item quantity or rate CHANGED
      changedItemIds.add(itemId);
      console.log(
        `   ✏️  Item ${itemId} changed: qty ${originalData.quantity}→${updatedData.quantity}, rate ${originalData.rate}→${updatedData.rate}`
      );
    }
    // else: Item unchanged, don't mark it
  }

  // Check for newly added items
  for (const [itemId, updatedData] of updatedItemsMap) {
    if (!originalItemsMap.has(itemId)) {
      // Item was ADDED to transaction
      changedItemIds.add(itemId);
      console.log(`   ➕ Item ${itemId} added (new)`);
    }
  }

  // ========================================
  // Mark ONLY changed items as dirty
  // ========================================
  if (changedItemIds.size === 0) {
    console.log(`   ✨ No item changes detected, skipping item recalculation`);
  } else {
    console.log(`   🔧 Marking ${changedItemIds.size} changed items as dirty`);
    
    for (const itemId of changedItemIds) {
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
  }

  console.log(
    `✅ Marked ${year}-${month} and subsequent months as dirty (${changedItemIds.size} items affected)`
  );

  return { 
    success: true,
    markedFrom: `${year}-${month}`,
    changedItemsCount: changedItemIds.size,
    changedItemIds: Array.from(changedItemIds),
    message: `Only ${changedItemIds.size} changed items marked for recalculation`
  };
};



