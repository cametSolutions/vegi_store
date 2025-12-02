# Account Ledger Recalculation System

A robust, transaction-safe system for recalculating account ledger balances in a double-entry accounting ERP system. This module handles the complex task of maintaining accurate running balances when transactions are edited, accounts are changed, or amounts are modified.

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

In a double-entry accounting system, editing a past transaction creates a ripple effect:
- Running balances for all subsequent entries become incorrect
- Monthly summaries (opening/closing balances) need recalculation
- Account changes require removing amounts from old accounts and adding to new ones

### Solution

This system uses a **"dirty flag" pattern** combined with **monthly folding** to efficiently recalculate only affected data:

1. When a transaction is edited, affected months are marked as "dirty" (`needsRecalculation: true`)
2. A background process finds all dirty months and recalculates them chronologically
3. Adjustments are applied to determine the "effective" amount for each ledger entry
4. Running balances cascade forward automatically

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    processAllDirtyAccounts()                    │
│                      (Main Entry Point)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      findDirtyAccounts()                        │
│         Queries AccountMonthlyBalance for dirty records         │
│         Groups by account-branch combination                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     processOneAccount()                         │
│            Handles single account-branch combo                  │
│            Wraps all months in ONE transaction                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     refoldAccountMonth()                        │
│              Core recalculation logic per month                 │
│                                                                 │
│  1. Get opening balance (prev month or AccountMaster)           │
│  2. Fetch ledger entries for the month                          │
│  3. Fetch active adjustments                                    │
│  4. Build adjustment delta map                                  │
│  5. Apply adjustments & recalculate running balances            │
│  6. Update ledger entries & monthly summary                     │
│  7. Mark next month dirty (cascade)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                buildAccountAdjustmentDeltaMap()                 │
│           Processes adjustments into actionable deltas          │
│                                                                 │
│  • Account changes: Zero old account, full amount to new        │
│  • Amount changes: Apply delta to same account                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Dirty Flag Pattern

Instead of recalculating everything immediately when a transaction changes, we:
1. Mark affected `AccountMonthlyBalance` records with `needsRecalculation: true`
2. Process dirty records in batches (via cron job or manual trigger)
3. This decouples edit operations from expensive recalculations

### Monthly Folding

Balances are "folded" at month boundaries:
- Each month has an **opening balance** (= previous month's closing)
- **Running balance** is calculated entry-by-entry within the month
- **Closing balance** becomes next month's opening

### Adjustment System

When a transaction is edited, an `Adjustment` record is created containing:
- Original transaction reference
- Old values (account, amount)
- New values (account, amount)
- Status flags (active, reversed)

The refold system reads these adjustments and applies deltas to ledger entries.

---

## How It Works

### Scenario 1: Amount Change (Same Account)

**Original:** Binu account, ₹2000 debit
**Edit:** Binu account, ₹2500 debit

```
Adjustment created:
  oldAccount: Binu
  affectedAccount: Binu
  oldAmount: 2000
  newAmount: 2500

During refold:
  delta = newAmount - oldAmount = 500
  effectiveAmount = ledgerEntry.amount + delta
  effectiveAmount = 2000 + 500 = 2500 ✓
```

### Scenario 2: Account Change

**Original:** Binu account, ₹2000 debit
**Edit:** Sony account, ₹2500 debit

```
Adjustment created:
  oldAccount: Binu
  affectedAccount: Sony
  oldAmount: 2000
  newAmount: 2500

During refold for Binu (old account):
  - Transaction marked in accountChanges set
  - effectiveAmount = 0 (zeroed out)

During refold for Sony (new account):
  - isAccountChange = true (oldAccount !== affectedAccount)
  - effectiveAmount = 0 + newAmount = 0 + 2500 = 2500 ✓
```

### Cascade Effect

When a month is refolded, its closing balance may change. If the next month exists, it's automatically marked dirty to propagate the change forward.

```
December refolded → Closing balance changed
  ↓
January marked dirty → Will be refolded in next run
  ↓
February marked dirty → And so on...
```

---

## API Reference

### processAllDirtyAccounts()

Main entry point. Finds and processes all dirty accounts.

```javascript
const result = await processAllDirtyAccounts();

// Returns:
{
  accountsProcessed: 5,      // Account-branch combos processed
  monthsRefolded: 12,        // Total months recalculated
  errors: [],                // Array of error objects
  success: true,             // True if no errors
  processedAdjustmentIds: [] // Adjustment IDs processed
}
```

### findDirtyAccounts()

Queries and groups dirty records.

```javascript
const workMap = await findDirtyAccounts();

// Returns:
{
  "accountId_branchId": {
    accountId: "...",
    branchId: "...",
    accountName: "Cash Account",
    months: [
      { year: 2025, month: 11 },
      { year: 2025, month: 12 }
    ]
  }
}
```

### processOneAccount(accountId, branchId, dirtyMonths, processedAdjustmentIdsSet)

Processes one account-branch combination with transaction safety.

| Parameter | Type | Description |
|-----------|------|-------------|
| accountId | string/ObjectId | Account to process |
| branchId | string/ObjectId | Branch context |
| dirtyMonths | Array | `[{year, month}, ...]` |
| processedAdjustmentIdsSet | Set | Accumulator for processed adjustment IDs |

### refoldAccountMonth(accountId, branchId, year, month, session)

Core recalculation logic for a single month.

| Parameter | Type | Description |
|-----------|------|-------------|
| accountId | string/ObjectId | Account to process |
| branchId | string/ObjectId | Branch context |
| year | number | Year (e.g., 2025) |
| month | number | Month (1-12) |
| session | ClientSession | Mongoose transaction session |

### buildAccountAdjustmentDeltaMap(adjustments, currentAccountIdStr)

Builds adjustment deltas for ledger entries.

```javascript
// Returns:
{
  amountDeltaMap: { "txId": 500 },     // Amount changes to apply
  accountMap: { "txId": ObjectId },    // Account changes
  accountNameMap: { "txId": "Sony" },  // Account name changes
  accountChanges: Set(["txId"])        // Transactions to zero out
}
```

---

## Data Models

### AccountMonthlyBalance

```javascript
{
  account: ObjectId,          // Reference to AccountMaster
  branch: ObjectId,           // Reference to Branch
  year: Number,               // e.g., 2025
  month: Number,              // 1-12
  accountName: String,        // Denormalized for quick access
  openingBalance: Number,     // Balance at start of month
  totalDebit: Number,         // Sum of all debits
  totalCredit: Number,        // Sum of all credits
  closingBalance: Number,     // Balance at end of month
  transactionCount: Number,   // Number of entries
  needsRecalculation: Boolean,// Dirty flag
  lastUpdated: Date
}
```

### AccountLedger

```javascript
{
  account: ObjectId,
  branch: ObjectId,
  transactionId: ObjectId,    // Parent transaction reference
  transactionNumber: String,
  transactionDate: Date,
  ledgerSide: String,         // "debit" or "credit"
  amount: Number,
  runningBalance: Number,     // Calculated balance after this entry
  accountName: String
}
```

### Adjustment

```javascript
{
  originalTransaction: ObjectId,
  originalTransactionDate: Date,
  branch: ObjectId,
  oldAccount: ObjectId,       // Account before edit
  affectedAccount: ObjectId,  // Account after edit (may be same)
  oldAmount: Number,
  newAmount: Number,
  newAccount: ObjectId,       // New account reference
  newAccountName: String,
  status: String,             // "active", "reversed"
  isReversed: Boolean
}
```

---

## Usage Examples

### Manual Trigger

```javascript
import { processAllDirtyAccounts } from './services/account/refold/accountRefold.js';

// In an API endpoint or script
app.post('/admin/recalculate-ledgers', async (req, res) => {
  try {
    const result = await processAllDirtyAccounts();
    res.json({
      success: result.success,
      message: `Processed ${result.accountsProcessed} accounts, ${result.monthsRefolded} months`,
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Cron Job Setup

```javascript
import cron from 'node-cron';
import { processAllDirtyAccounts } from './services/account/refold/accountRefold.js';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Starting scheduled ledger recalculation...');
  try {
    const result = await processAllDirtyAccounts();
    if (result.monthsRefolded > 0) {
      console.log(`✅ Refolded ${result.monthsRefolded} months`);
    }
  } catch (error) {
    console.error('❌ Scheduled recalculation failed:', error);
  }
});
```

### Marking a Month as Dirty

```javascript
// When editing a transaction, mark the affected month dirty
await AccountMonthlyBalance.updateOne(
  {
    account: affectedAccountId,
    branch: branchId,
    year: transactionDate.getFullYear(),
    month: transactionDate.getMonth() + 1
  },
  { needsRecalculation: true },
  { upsert: true }
);
```

---

## Error Handling

### Transaction Rollback

All updates for an account-branch combination are wrapped in a MongoDB transaction. If any month fails, all changes for that account are rolled back.

```javascript
// In processOneAccount()
try {
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();  // All changes rolled back
  throw error;
}
```

### Error Reporting

Failed accounts are collected and reported in the final result:

```javascript
{
  errors: [
    {
      accountId: "...",
      branchId: "...",
      accountName: "Cash Account",
      error: "Failed at 2025-12: Connection timeout",
      stack: "..."
    }
  ]
}
```

### Partial Success

The system continues processing other accounts even if one fails. Check `result.success` and `result.errors` to determine if any accounts need attention.

---

## Performance Considerations

### Indexing Requirements

Ensure these indexes exist for optimal performance:

```javascript
// AccountMonthlyBalance
{ needsRecalculation: 1 }
{ account: 1, branch: 1, year: 1, month: 1 }

// AccountLedger
{ account: 1, branch: 1, transactionDate: 1 }
{ transactionId: 1 }

// Adjustment
{ oldAccount: 1, branch: 1, originalTransactionDate: 1, status: 1 }
{ affectedAccount: 1, branch: 1, originalTransactionDate: 1, status: 1 }
```

### Batch Size

The system processes accounts sequentially to maintain balance integrity. For very large datasets, consider:
- Running during off-peak hours
- Limiting concurrent refold processes
- Monitoring MongoDB connection pool

### Cascade Limits

Deep historical edits can cascade through many months. Monitor the cascade depth and consider implementing a maximum cascade limit if needed.

---



## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Infinite loop of dirty months | Cascade keeps marking months dirty | Check for circular adjustment references |
| Wrong opening balance | Previous month not yet refolded | Ensure chronological processing |
| Missing adjustments | Query filter mismatch | Verify `originalTransactionDate` falls within month range |
| Transaction timeout | Too many entries in one month | Increase MongoDB timeout or batch updates |

---

## Contributing

When modifying this system:

1. **Test with real data** - Balance calculations are sensitive to edge cases
2. **Verify cascade behavior** - Ensure changes propagate correctly
3. **Check transaction safety** - All updates must remain atomic
4. **Update this README** - Document any new behavior or parameters

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial implementation |
| 1.1.0 | Dec 2025 | Fixed account change delta calculation |

---

*Last updated: December 2025*
