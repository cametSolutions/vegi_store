# Item Ledger Recalculation System

A robust, transaction-safe system for recalculating item stock ledger balances in a double-entry inventory ERP system. This module handles the complex task of maintaining accurate running stock balances when inventory transactions are edited, accounts are changed, quantities are adjusted, or rates are modified.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

---

## Overview

### Problem Statement

In a double-entry inventory system, editing a past transaction creates a ripple effect:
- Running stock balances for all subsequent entries become incorrect
- Monthly inventory summaries (opening/closing stock) need recalculation
- Quantity and rate changes affect financial calculations (baseAmount, taxAmount, amountAfterTax)
- Account changes require removing entries from old accounts and adding to new ones
- Changes in historical months propagate forward through all subsequent months

### Solution

This system uses a **"dirty flag" pattern** combined with **monthly folding** to efficiently recalculate only affected data:

1. When a transaction is edited, affected months are marked as "dirty" (`needsRecalculation: true`)
2. A nightly background process finds all dirty months and recalculates them chronologically
3. Adjustments are applied to determine the "effective" quantity, rate, and account for each ledger entry
4. Running stock balances and financial amounts cascade forward automatically
5. All months for an item-branch are processed in a single transaction for consistency

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               processAllDirtyItems()                            │
│              (Main Entry Point - Nightly Job)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      findDirtyItems()                           │
│         Queries ItemMonthlyBalance for dirty records            │
│         Groups by item-branch combination                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     processOneItem()                            │
│            Handles single item-branch combo                     │
│      Wraps all dirty months in ONE transaction                  │
│                                                                 │
│  ✨ All months processed sequentially in same transaction       │
│  ✨ Later months read newly calculated closing of earlier ones  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     refoldMonth()                               │
│         Core recalculation logic per month                      │
│                                                                 │
│  1. Get opening stock (prev month or Item Master)               │
│  2. Fetch ledger entries for the month                          │
│  3. Fetch active adjustments                                    │
│  4. Build adjustment delta map                                  │
│  5. Apply adjustments (quantity, rate, account)                 │
│  6. Recalculate running balances & financial fields             │
│  7. Update ledger entries & monthly summary                     │
│  8. Mark next month dirty (cascade)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                buildAdjustmentDeltaMap()                        │
│       Processes adjustments into actionable deltas              │
│                                                                 │
│  • Quantity changes: Apply delta to stock movement              │
│  • Rate changes: Update cost per unit                           │
│  • Account changes: Move to new account                         │
│  • Financial recalc: baseAmount, tax, total                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Dirty Flag Pattern

Instead of recalculating everything immediately when a transaction changes, we:
1. Mark affected `ItemMonthlyBalance` records with `needsRecalculation: true`
2. Process dirty records in a nightly batch job (via cron or manual trigger)
3. This decouples edit operations from expensive recalculations
4. Bulk recalculation is faster and less taxing on the database

### Monthly Folding

Stock balances are "folded" at month boundaries:
- Each month has an **opening stock** (= previous month's closing)
- **Running stock balance** is calculated entry-by-entry within the month
- Stock movements are tracked as **totalStockIn** and **totalStockOut**
- **Closing stock** becomes next month's opening
- This creates an audit trail where each month's opening can be verified against previous month's closing

### Adjustment System

When a transaction is edited, an `Adjustment` record is created containing:
- Original transaction reference
- Item adjustments array with:
  - Quantity delta (±change in units)
  - Rate delta (±change in cost per unit)
- New account reference (if account changed)
- New account name (if account changed)
- Status flags (active, reversed)

The refold system reads these adjustments and applies them to recalculate ledger entries.

### Transaction Safety in Monthly Processing

All dirty months for an item-branch are processed in a **single MongoDB transaction**:
- If October is refolded first, its new closing stock is immediately visible
- November processing reads October's newly calculated closing (not the old value)
- If any month fails during processing, ALL changes for that item-branch are rolled back
- This maintains consistency across month boundaries

---

## How It Works

### Scenario 1: Quantity Adjustment (Stock In/Out)

**Original:** Oct 20 transaction: Stock In 10 KGS @ ₹100/KG
**Edit:** Change quantity to 15 KGS

```
Adjustment created:
  originalTransaction: Oct20TxnId
  itemAdjustments: [{
    item: TomatoId,
    quantityDelta: +5,
    rateDelta: 0
  }]
  
During refold (October):
  Opening stock: 100 KGS
  
  Original entry: 10 KGS in
  Adjustment applied: +5 KGS delta
  Effective quantity: 10 + 5 = 15 KGS
  
  Running balance: 100 + 15 = 115 KGS ✓
  
  Financial impact:
    Original amount: 10 × 100 = ₹1000
    New amount: 15 × 100 = ₹1500 (+₹500)
```

### Scenario 2: Rate/Price Adjustment

**Original:** Oct 15 transaction: 10 KGS @ ₹100/KG = ₹1000
**Edit:** Change rate to ₹120/KG

```
Adjustment created:
  originalTransaction: Oct15TxnId
  itemAdjustments: [{
    item: TomatoId,
    quantityDelta: 0,
    rateDelta: +20  (120 - 100)
  }]

During refold (October):
  Stock quantity unchanged: 10 KGS in
  
  Original rate: ₹100/KG
  Rate adjustment: +20/KG
  Effective rate: 100 + 20 = ₹120/KG
  
  Running stock balance: Unchanged (still 10 KGS)
  
  Financial impact:
    Original amount: 10 × 100 = ₹1000
    New amount: 10 × 120 = ₹1200 (+₹200)
    Tax recalculated on new amount
```

### Scenario 3: Account/Destination Change

**Original:** Oct 10 transaction: 5 KGS from Supplier A account
**Edit:** Change to Supplier B account

```
Adjustment created:
  originalTransaction: Oct10TxnId
  newAccount: SupplierBId
  newAccountName: "Supplier B"
  itemAdjustments: [{
    item: TomatoId,
    quantityDelta: 0,
    rateDelta: 0
  }]

During refold (October):
  Stock quantity: 5 KGS (unchanged)
  Stock balance: Unchanged
  
  Account changed: Supplier A → Supplier B
  
  Financial impact:
    Amount unchanged
    But now appears under Supplier B instead of A
    Accounting reconciliation updated
```

### Scenario 4: Cascade Effect Across Months

**What happens when October's closing changes:**

```
September (clean):
  Opening: 100 KGS
  Closing: 100 KGS (no activity)

October (dirty):
  Opening: 100 KGS
  Transaction edited: 10 → 15 KGS (added 5 KGS)
  Closing: 105 KGS ← CHANGED from previous 100 KGS

November (cascade marked dirty):
  Opening MUST change: 100 → 105 KGS
  ↓ (Within same transaction, November reads October's new closing: 105)
  If Nov transaction: 20 KGS out
  New closing: 105 - 20 = 85 KGS ← CHANGED

December (cascade marked dirty):
  Opening MUST change: 90 → 85 KGS
  ↓ (Within same transaction, December reads November's new closing: 85)
  Continue cascade...

All in ONE transaction:
- October updates calculated
- November immediately reads October's new closing: 105
- November updates calculated
- December immediately reads November's new closing: 85
- December updates calculated
- All commit together or all rollback together
```

---

## API Reference

### processAllDirtyItems()

Main entry point. Finds and processes all items with dirty months. Typically called by a nightly cron job.

```javascript
const result = await processAllDirtyItems();

// Returns:
{
  itemsProcessed: 8,              // Item-branch combos processed
  monthsRefolded: 24,             // Total months recalculated
  errors: [],                     // Array of error objects
  success: true,                  // True if no errors
  processedAdjustmentIds: [...]   // Adjustment IDs processed
}
```

**Usage:**
```javascript
// Cron job: Run every night at 2 AM
cron.schedule('0 2 * * *', async () => {
  const result = await processAllDirtyItems();
  console.log(`Refolded ${result.monthsRefolded} months`);
});
```

### findDirtyItems()

Queries and groups items with dirty months by item-branch combination.

```javascript
const workMap = await findDirtyItems();

// Returns structure:
{
  "itemId_branchId": {
    itemId: "690...",
    branchId: "68f...",
    itemName: "Tomato",
    itemCode: "T",
    months: [
      { year: 2025, month: 10 },
      { year: 2025, month: 11 }
    ]
  },
  "itemId2_branchId2": {
    // ... more items
  }
}
```

**What it does:**
- Queries `ItemMonthlyBalance` for all records with `needsRecalculation: true`
- Groups by composite key: `itemId_branchId`
- Collects all dirty months for each item-branch combination
- Returns organized work map for processing

### processOneItem(itemId, branchId, dirtyMonths, allProcessedAdjustmentIds)

Processes all dirty months for a single item in a single branch within a single transaction.

| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | string/ObjectId | Item to process |
| branchId | string/ObjectId | Branch context |
| dirtyMonths | Array | `[{year, month}, ...]` months to reprocess |
| allProcessedAdjustmentIds | Set | Accumulator for processed adjustment IDs |

**Returns:**
```javascript
{ monthsProcessed: 3 }  // Number of months successfully refolded
```

**Key behavior:**
- Sorts dirty months chronologically (oldest first)
- Starts MongoDB transaction
- Processes each month sequentially within same transaction
- If any month fails, rolls back ALL changes for that item-branch
- Later months can read updated closing values from earlier months

### refoldMonth(itemId, branchId, year, month, session, processedAdjustmentIds)

Core algorithm that recalculates balances and financial fields for a single month.

| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | string/ObjectId | Item to process |
| branchId | string/ObjectId | Branch context |
| year | number | Year (e.g., 2025) |
| month | number | Month (1-12) |
| session | ClientSession | Mongoose transaction session |
| processedAdjustmentIds | Set | Accumulator for adjustment IDs |

**Key steps:**
1. **Opening balance:** Fetches previous month's closing or Item Master opening
2. **Ledger entries:** Gets all transactions for this month chronologically
3. **Adjustments:** Finds all quantity/rate/account changes
4. **Apply deltas:** Recalculates quantity, rate, financial amounts
5. **Update ledger:** Updates all entries with new balances and amounts
6. **Update summary:** Updates `ItemMonthlyBalance` with totals
7. **Cascade:** Marks next month dirty if it exists

### buildAdjustmentDeltaMap(adjustments, itemId)

Builds a map of adjustments organized by transaction for efficient application.

```javascript
const deltaMap = buildAdjustmentDeltaMap(adjustments, itemId);

// Returns structure:
{
  quantityDeltaMap: {     // { transactionId: totalQuantityDelta }
    "tx123": 5,           // Transaction 123 had +5 KGS adjustment
    "tx124": -2           // Transaction 124 had -2 KGS adjustment
  },
  rateDeltaMap: {         // { transactionId: rateDelta }
    "tx123": 20,          // Rate changed by +20 per unit
    "tx125": -5
  },
  accountMap: {           // { transactionId: newAccountId }
    "tx126": ObjectId("...")  // Account changed for this transaction
  },
  accountNameMap: {       // { transactionId: newAccountName }
    "tx126": "Supplier B"
  }
}
```

**Logic:**
- Iterates through all adjustments
- For each adjustment, checks `itemAdjustments` array for this item's specific changes
- Accumulates multiple adjustments to same transaction
- Tracks account changes separately
- Returns organized maps for efficient lookup during ledger processing

---

## Data Models

### ItemMonthlyBalance

```javascript
{
  item: ObjectId,           // Reference to ItemMaster
  branch: ObjectId,         // Reference to Branch
  year: Number,             // e.g., 2025
  month: Number,            // 1-12
  itemName: String,         // Denormalized for quick access
  itemCode: String,         // Item code
  openingStock: Number,     // Stock at start of month (units)
  closingStock: Number,     // Stock at end of month (units)
  totalStockIn: Number,     // Sum of all inward movements (units)
  totalStockOut: Number,    // Sum of all outward movements (units)
  needsRecalculation: Boolean,  // Dirty flag
  lastUpdated: Date
}
```

### ItemLedger

```javascript
{
  item: ObjectId,
  branch: ObjectId,
  transactionId: ObjectId,    // Parent transaction reference
  transactionNumber: String,
  transactionDate: Date,
  movementType: String,       // "in" or "out"
  quantity: Number,           // Stock moved (units)
  rate: Number,               // Cost per unit
  baseAmount: Number,         // quantity × rate
  taxRate: Number,            // Tax percentage
  taxAmount: Number,          // baseAmount × (taxRate/100)
  amountAfterTax: Number,     // baseAmount + taxAmount
  account: ObjectId,          // Associated ledger account
  accountName: String,        // Account display name
  runningStockBalance: Number // Stock balance after this entry (units)
}
```

### Adjustment

```javascript
{
  originalTransaction: ObjectId,
  originalTransactionDate: Date,
  branch: ObjectId,
  itemAdjustments: [{          // Array for multi-item transactions
    item: ObjectId,
    quantityDelta: Number,     // Change in quantity (±)
    rateDelta: Number          // Change in rate (±)
  }],
  newAccount: ObjectId,        // New account if changed
  newAccountName: String,      // New account name if changed
  status: String,              // "active", "reversed"
  isReversed: Boolean
}
```

---

## Usage Examples

### Manual Trigger (Admin API)

```javascript
import { processAllDirtyItems } from './services/inventory/refold/itemRefold.js';

// In an API endpoint
app.post('/admin/recalculate-inventory', async (req, res) => {
  try {
    const result = await processAllDirtyItems();
    res.json({
      success: result.success,
      message: `Processed ${result.itemsProcessed} items, ${result.monthsRefolded} months`,
      processedAdjustmentIds: result.processedAdjustmentIds,
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Cron Job Setup (Nightly Recalculation)

```javascript
import cron from 'node-cron';
import { processAllDirtyItems } from './services/inventory/refold/itemRefold.js';

// Run every night at 2 AM IST
// Gives time after business hours end (usually 6 PM) and before next business day
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Starting nightly inventory recalculation...');
  try {
    const result = await processAllDirtyItems();
    
    if (result.monthsRefolded === 0) {
      console.log('✨ No items needed recalculation');
      return;
    }
    
    console.log('✅ Recalculation complete:');
    console.log(`   - Items: ${result.itemsProcessed}`);
    console.log(`   - Months: ${result.monthsRefolded}`);
    console.log(`   - Adjustments: ${result.processedAdjustmentIds.length}`);
    
    if (result.errors.length > 0) {
      console.error('⚠️  Errors:', result.errors);
    }
  } catch (error) {
    console.error('❌ Nightly recalculation failed:', error);
    // Send alert to admin
  }
}, {
  timezone: "Asia/Kolkata"  // IST timezone
});
```

### Marking a Month as Dirty (When Transaction is Edited)

```javascript
// When a transaction is edited, mark affected months as dirty
async function markMonthDirtyAfterEdit(itemId, branchId, transactionDate) {
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth() + 1;
  
  await ItemMonthlyBalance.updateOne(
    {
      item: itemId,
      branch: branchId,
      year: year,
      month: month
    },
    { needsRecalculation: true },
    { upsert: true }  // Create if doesn't exist
  );
  
  console.log(`Marked ${itemId} in month ${month}/${year} as dirty`);
}

// Usage when editing a transaction:
app.put('/api/transactions/:id', async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  
  // ... perform edit ...
  
  // Create adjustment record
  const adjustment = new Adjustment({
    originalTransaction: transaction._id,
    originalTransactionDate: transaction.date,
    itemAdjustments: [{
      item: transaction.item,
      quantityDelta: req.body.newQuantity - transaction.quantity,
      rateDelta: req.body.newRate - transaction.rate
    }],
    branch: transaction.branch,
    status: 'active'
  });
  await adjustment.save();
  
  // Mark month dirty
  await markMonthDirtyAfterEdit(
    transaction.item,
    transaction.branch,
    transaction.date
  );
  
  res.json({ success: true });
});
```

### Verify Recalculation Results

```javascript
// After recalculation, verify integrity
async function verifyItemBalances(itemId, branchId) {
  const months = await ItemMonthlyBalance.find({
    item: itemId,
    branch: branchId
  }).sort({ year: 1, month: 1 });
  
  let previousClosing = 0;
  
  for (const record of months) {
    console.log(`
      Month: ${record.year}-${record.month}
      Opening: ${record.openingStock}
      In: ${record.totalStockIn}
      Out: ${record.totalStockOut}
      Closing: ${record.closingStock}
    `);
    
    // Verify opening equals previous closing
    if (previousClosing !== record.openingStock) {
      console.error(`⚠️ Mismatch at month ${record.month}: 
        Previous closing (${previousClosing}) ≠ Opening (${record.openingStock})`);
    }
    
    // Verify closing calculation
    const calculatedClosing = record.openingStock + record.totalStockIn - record.totalStockOut;
    if (calculatedClosing !== record.closingStock) {
      console.error(`⚠️ Calculation error at month ${record.month}`);
    }
    
    previousClosing = record.closingStock;
  }
  
  console.log('✅ Integrity check complete');
}
```

---

## Error Handling

### Transaction Rollback on Failure

All months for an item-branch are processed in a single MongoDB transaction. If any month fails, everything rolls back:

```javascript
// In processOneItem()
const session = await mongoose.startSession();
session.startTransaction();

try {
  for (const { year, month } of dirtyMonths) {
    await refoldMonth(itemId, branchId, year, month, session, adjustmentIds);
  }
  await session.commitTransaction();  // All months commit
} catch (error) {
  await session.abortTransaction();   // All changes rolled back
  throw error;
}
```

### Error Reporting

Failed items are collected and reported but don't stop processing of other items:

```javascript
{
  errors: [
    {
      itemId: "690...",
      branchId: "68f...",
      itemName: "Tomato",
      itemCode: "T",
      error: "Failed at 2025-11: Connection timeout",
      stack: "..."
    }
  ]
}
```

### Cascade Failures

If a month fails to process, all subsequent months for that item-branch remain dirty and will be retried in the next nightly run.

### Partial Success

The system continues processing other items even if one fails:
- Check `result.success` for overall status
- Check `result.errors` array for specific failures
- Items in the `errors` array will be retried in next run

---

## Performance Considerations

### Indexing Requirements

Ensure these indexes exist for optimal performance:

```javascript
// ItemMonthlyBalance
db.itemmonthlybalances.createIndex({ needsRecalculation: 1 });
db.itemmonthlybalances.createIndex({ item: 1, branch: 1, year: 1, month: 1 });
db.itemmonthlybalances.createIndex({ item: 1, branch: 1 });

// ItemLedger
db.itemledgers.createIndex({ item: 1, branch: 1, transactionDate: 1 });
db.itemledgers.createIndex({ transactionId: 1 });
db.itemledgers.createIndex({ item: 1, branch: 1 });

// Adjustment
db.adjustments.createIndex({ "itemAdjustments.item": 1, branch: 1, originalTransactionDate: 1, status: 1 });
db.adjustments.createIndex({ originalTransaction: 1 });
```

### Batch Processing

- Items are processed **sequentially** (not parallel) to avoid overwhelming the database
- Within each item-branch, all months are in a **single transaction** for consistency
- Ledger entry updates are done one-by-one (consider batch updates for very large datasets)

### Large Dataset Considerations

For organizations with:
- **100K+ transactions per month**: Consider batch updating ledger entries
- **50+ items × 12 months**: Run during off-peak hours (midnight)
- **Multiple branches**: May take 1-2 hours, monitor MongoDB resources

### Cascade Depth Monitoring

Very old edits can cascade through many months. Monitor:
- Maximum months marked dirty per run
- Processing time per month
- If cascade becomes too deep, consider capping (e.g., max 24 months)

---

## Dependencies

```javascript
// External
import mongoose from "mongoose";

// Internal Models
import ItemMonthlyBalance from "../../../model/ItemMonthlyBalanceModel.js";
import ItemLedger from "../../../model/ItemsLedgerModel.js";
import Adjustment from "../../../model/AdjustmentEntryModel.js";
import ItemMaster from "../../../model/masters/ItemMasterModel.js";

// Utilities
import {
  getPreviousMonth,
  getNextMonth,
  getMonthDateRange,
  formatYearMonth,
  sortMonthsChronologically,
} from "../utils/dateHelpers.js";
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Infinite cascade (many months marked dirty) | Circular adjustment references | Check adjustments don't reference each other |
| Opening stock mismatch | Previous month not processed first | Ensure chronological sorting works |
| Stock balance doesn't equal (opening ± in/out) | Adjustment quantity not applied | Verify `itemAdjustments` array populated correctly |
| Financial amounts wrong | Rate adjustment not calculated | Check rate delta applied before amount calculation |
| Transaction timeout | Too many entries in one month | Batch ledger updates or increase MongoDB timeout |
| Memory error | Processing very large months | Process smaller month ranges or add RAM |
| Adjustment not applied | Query filter excludes it | Verify status='active' and isReversed=false |

---

## Contributing

When modifying this system:

1. **Test with real data** - Stock and financial calculations are sensitive to edge cases
2. **Verify cascade behavior** - Ensure changes propagate correctly through multiple months
3. **Check transaction safety** - All updates must remain atomic
4. **Test multi-item scenarios** - Some transactions affect multiple items
5. **Validate account reconciliation** - Ensure accounts match ledger updates
6. **Update this README** - Document any new behavior or parameters

---

## Comparison with Account Refold

| Aspect | Account Refold | Item Refold |
|--------|----------------|-----------|
| **Purpose** | Recalculate account balances | Recalculate inventory stock |
| **Unit** | Currency amount | Stock quantity |
| **Key Fields** | amount, runningBalance | quantity, runningStockBalance |
| **Financial Fields** | Direct amount | baseAmount, taxAmount, amountAfterTax |
| **Adjustments** | Account changes, amount changes | Quantity changes, rate changes, account changes |
| **Cascade Trigger** | Opening balance changes | Opening stock changes |
| **Core Calc** | Running debit/credit balance | Running stock in/out |

Both systems follow the same **dirty flag + monthly folding + transaction-safe** architecture.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial implementation |
| 1.1.0 | Dec 2025 | Added multi-item adjustment support |
| 1.2.0 | Dec 2025 | Added adjustment ID tracking for audit trail |

---

*Last updated: December 2025*
