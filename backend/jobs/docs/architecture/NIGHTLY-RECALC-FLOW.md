# Nightly Recalculation Job - Execution Flow

## Overview
This document describes the complete execution flow of the nightly recalculation job that processes dirty item ledger months.

## Architecture Diagram

NIGHTLY RECALCULATION - COMPLETE FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11:00 PM - Cron Triggers
    ↓
┌───────────────────────────────────────────────────────────────┐
│ nightlyRecalculation.js                                       │
├───────────────────────────────────────────────────────────────┤
│  runNightlyJob()                                              │
│    ├─> Log start time                                         │
│    ├─> Call itemLedgerRefold.processAllDirtyItems()          │
│    └─> Log completion & statistics                            │
└───────────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────────┐
│ itemLedgerRefold.js                                           │
├───────────────────────────────────────────────────────────────┤
│  processAllDirtyItems()                                       │
│    ├─> findDirtyItems()                                       │
│    │     └─> Query: needsRecalculation: true                 │
│    │     └─> Group by itemId                                  │
│    │     └─> Return: { itemId: [{year, month}] }            │
│    │                                                           │
│    └─> FOR EACH item (sequential):                           │
│          ├─> processOneItem(itemId, dirtyMonths)             │
│          │     ├─> Sort months chronologically               │
│          │     └─> FOR EACH month (sequential):              │
│          │           └─> refoldMonth(itemId, year, month)    │
│          └─> Catch errors, log, continue                      │
└───────────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────────┐
│ refoldMonth() - THE CORE ALGORITHM                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Get Opening Balance                                  │
│    └─> Query previous month's closingStock                   │
│                                                               │
│  Step 2: Fetch Ledger Entries                                │
│    └─> ItemLedger.find({ item, date range })                │
│    └─> Sort by transactionDate ASC                           │
│                                                               │
│  Step 3: Fetch Adjustments                                    │
│    └─> Adjustment.find({ item, date range, active })        │
│                                                               │
│  Step 4: Build Delta Map                                      │
│    └─> { transactionId: quantityDelta }                     │
│                                                               │
│  Step 5: Recalculate Balances                                │
│    ├─> runningBalance = openingStock                         │
│    └─> FOR EACH ledger entry:                                │
│          ├─> effectiveQty = entry.quantity + delta          │
│          ├─> Update runningBalance (+/- based on type)      │
│          └─> Track totalIn, totalOut                         │
│                                                               │
│  Step 6: Update Database (Transaction)                        │
│    ├─> START MongoDB Transaction                             │
│    ├─> Update all ledger.runningStockBalance                │
│    ├─> Update monthly balance summary                        │
│    ├─> Mark needsRecalculation = false                      │
│    ├─> Cascade: Mark next month dirty                        │
│    └─> COMMIT or ROLLBACK                                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
    ↓
COMPLETED - Return to nightlyRecalculation.js
    ↓
Log Final Statistics & Exit


## Key Components

### 1. cronScheduler.js
- Triggers job at 11 PM daily (production) or every 2 minutes (dev)
- Located: `schedulers/cronScheduler.js`

### 2. nightlyRecalculation.js  
- Main orchestrator
- Coordinates phases and logs results
- Located: `tasks/nightly/nightlyRecalculation.js`

### 3. itemLedgerRefold.js
- Core refold algorithm
- Processes dirty items and months
- Located: `tasks/nightly/itemLedgerRefold.js`

### 4. dateHelpers.js
- Utility functions for month calculations
- Located: `tasks/utils/dateHelpers.js`

## Execution Sequence

[Add the detailed step-by-step flow]

## Testing Checklist

/**
 * TESTING CHECKLIST
 * ===============================================
 * 
 * Test 1: Single Item, Single Month
 * ----------------------------------
 * 1. Create 1 item (Tomato)
 * 2. Create 3 transactions in October
 * 3. Edit 1 transaction (creates adjustment)
 * 4. Verify needsRecalculation = true
 * 5. Trigger job manually via API
 * 6. Verify:
 *    - Ledger running balances updated
 *    - Monthly balance updated
 *    - needsRecalculation = false
 * 
 * Test 2: Single Item, Multiple Months (Cascade)
 * -----------------------------------------------
 * 1. Create transactions in Oct, Nov, Dec
 * 2. Edit October transaction
 * 3. Run job
 * 4. Verify November gets marked dirty (cascade)
 * 5. Run job again
 * 6. Verify November and December refolded
 * 
 * Test 3: Multiple Items
 * ----------------------
 * 1. Create 3 items (Tomato, Onion, Potato)
 * 2. Create transactions for all
 * 3. Edit transactions in all items
 * 4. Run job
 * 5. Verify all items processed independently
 * 
 * Test 4: Error Handling
 * ----------------------
 * 1. Delete a required monthly balance record (break data)
 * 2. Run job
 * 3. Verify job logs error but continues with other items
 * 4. Check error array in results
 * 
 * Test 5: Performance
 * -------------------
 * 1. Create 100 items with 10 transactions each
 * 2. Edit 50 random transactions
 * 3. Run job and measure time
 * 4. Should complete in < 5 minutes
 */

