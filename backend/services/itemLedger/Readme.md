# Item Summary Report – Architecture & Flow

This document explains how the **Item Summary Report** works: what it calculates, why it is structured into multiple "paths", and how the different services and controller cooperate. It is meant for future developers who need to understand the logic without reading every line of code.

The core problem:  
> "Given a date range, show each item's opening quantity, in/out movements, values, and closing quantity/value – accounting for monthly snapshots and retroactive adjustments."

---

## 1. What the Report Returns

For each item, the report returns (simplified view):

- `itemId`
- `itemName`
- `itemCode`
- `unit`
- `openingQuantity` – stock at the report start date
- `totalIn` – quantity moved **into** stock in the period
- `totalOut` – quantity moved **out of** stock in the period
- `amountIn` – value of inward movements (quantity × rate + tax)
- `amountOut` – value of outward movements
- `closingQuantity` – opening + totalIn − totalOut
- `lastPurchaseRate` – latest purchase rate before end date
- `closingBalance` – closingQuantity × lastPurchaseRate
- `transactionCount` – number of ledger rows in the period

This is returned along with:

- `pagination` – page, limit, totalItems, totalPages
- `filters` – company, branch, date range, transaction type, search term

The **controller always shapes the final JSON into this format**, regardless of which internal path (Fast / Hybrid / Full Refold) was used.

---

## 2. Core Concepts

Understanding a few domain concepts makes the rest much easier.

### 2.1 Item Ledger

- The **Item Ledger** stores one row per stock movement: purchase, sale, sales return, purchase return, etc.
- Key fields:
  - `company`, `branch`, `item`
  - `transactionDate`
  - `transactionType` (sale, purchase, etc.)
  - `movementType` ("in" or "out")
  - `quantity`
  - `rate`
  - `taxAmount`
  - `transactionNumber` (for linking adjustments)

You can think of it as the **raw transaction history**.

### 2.2 Monthly Balances

- The **Item Monthly Balance** collection stores **end-of-month snapshots** per item per branch.
- Key fields:
  - `company`, `branch`, `item`
  - `year`, `month`
  - `closingStock` – quantity at month end
  - `needsRecalculation` – whether this snapshot is still valid

This is used to avoid recomputing from system start for every report.  
If a snapshot is *clean* (`needsRecalculation: false`), it can be trusted as a starting point.

### 2.3 Adjustments

- The **Adjustment Entry** collection stores corrections to past transactions.
- Example: a sale quantity was entered as 10 but should have been 15; an adjustment adds a +5 delta.
- Adjustments are linked to original transactions via:
  - `originalTransactionNumber`
  - `originalTransactionModel` (Sale, Purchase, SalesReturn, PurchaseReturn)
  - `itemAdjustments[]` with `item`, `quantityDelta`, `rateDelta`
- Only active, non-reversed adjustments affect current stock.

---

## 3. The Three Execution Paths

The system uses **three different internal strategies** to build the report:

1. **Fast Path** – everything is clean, no adjustments → no heavy joins.
2. **Hybrid Path** – opening is dirty (needs calculation), but period itself has no adjustments.
3. **Full Refold Path** – adjustments exist or base data is missing → full recomputation.

The **controller decides which path to use** based on date and data conditions, but the **output shape is the same**.

### 3.1 Why Multiple Paths?

- Full recomputation with joins and adjustments is accurate but slow at scale.
- Many reports (e.g., "previous clean month with no adjustments") do not need that much work.
- Splitting into paths gives **performance** without sacrificing **correctness**.

---

## 4. High-Level Flow

### 4.1 Controller: `getItemSummaryReport`

1. **Read request parameters**:
   - `company`, `branch`
   - `startDate`, `endDate`
   - `transactionType` (sale / purchase / all)
   - `page`, `limit`
   - `searchTerm`

2. **Find which items are in scope**:
   - Query Item Ledger for distinct `item` IDs matching company, branch, date range, and transaction type.
   - If no items → return empty response immediately.

3. **Ask the "dirty checker"** which path to use:
   - Call a service that inspects:
     - Monthly balances for previous month
     - Adjustments in the report period
     - Whether the report starts on 1st of the month
   - It returns something like:
     - `isDirty` (does opening need calculation?)
     - `needsFullRefold` (does ledger need adjustments lookup?)
     - `reason` (for debugging/logging)

4. **Select the path**:
   - If `isDirty = false` → **Fast Path** service
   - If `isDirty = true` and `needsFullRefold = false` → **Hybrid Path** service
   - If `isDirty = true` and `needsFullRefold = true` → **Full Refold** service

5. **Shape the result**:
   - Regardless of path, the service returns a consistent structure (`items`, `pagination`, `filters`).
   - The controller maps each internal item to the public response format fields (openingQuantity, totalIn, etc.).

6. **Return JSON response**.

---

## 5. Path Selection Logic (With Examples)

The decision of which path to use is **data-driven**.

### 5.1 Inputs to the Dirty Check

Given:

- `company`, `branch`
- `itemIds[]` (from ledger)
- `startDate`, `endDate`

The checker evaluates:

1. **Monthly balance availability** for previous month of `startDate`.
2. **Adjustments in report period** (`startDate` → `endDate`).
3. Whether `startDate` is the **1st day of the month**.

### 5.2 Possible Outcomes

#### Outcome A – Fast Path

Conditions:

- `startDate` is the **1st of a month**
- Every item has a **clean monthly balance** for the previous month
- There are **no adjustments** in the report period

Interpretation:

- Opening at `startDate` is exactly the previous month's closing stock.
- No retroactive corrections affect this date range.
- Ledger rows can be read "as-is" without joining adjustments.

**Example:**

- Report: `2025-12-01` to `2025-12-31`
- Previous month: November 2025
- All items have `ItemMonthlyBalance(year=2025, month=11, needsRecalculation=false)`
- No adjustments whose `originalTransactionDate` falls in December

Result: **Fast Path** is used.

#### Outcome B – Hybrid Path

Conditions:

- Opening needs computation (e.g., `startDate` is mid-month), **but**
- There are **no adjustments in the report period**
- Monthly balances are available and clean, or at least enough to compute opening via ledger movements + adjustments before `startDate`

Interpretation:

- To know opening at, say, `2025-12-15`, you must:
  - Start from previous clean snapshot (e.g., November 30)
  - Apply all transactions (and adjustments) from Dec 1–14
- However, inside the actual report range (Dec 15–31), there are **no adjustments**, so the ledger for the report can be a **simple aggregation** of raw ledger rows.

**Example:**

- Report: `2025-12-15` to `2025-12-31`
- There are adjustments in early December (impacting opening), but **none between 15 and 31**.

Result: **Hybrid Path** is used.

#### Outcome C – Full Refold Path

Conditions (any of these):

- Some items **don't have a clean monthly balance** for previous month
- Or there **are adjustments in the report period**
- Or other conditions make it unsafe to skip adjustments

Interpretation:

- Either the base snapshot is missing/dirty, or
- The transactions within the report range themselves have been adjusted.
- In both cases, you must **rebuild** the ledger carefully with adjustments.

**Example:**

- Report: `2025-12-01` to `2025-12-31`
- An adjustment exists on a sale of `2025-12-10` (quantity corrected from 10 to 12).
- To get correct quantities/value, you must apply the +2 delta on that transaction.

Result: **Full Refold Path** is used.

---

## 6. What Each Path Actually Does (Conceptual)

This section describes **what** each path does conceptually, without diving into specific code.

### 6.1 Shared Steps

All three paths share some high-level structure:

1. **Identify items** in the period (with filters and search).
2. **Paginate** items.
3. Compute:
   - Opening quantity per item
   - Movements (in/out) in the period
   - Value of those movements
   - Closing quantity and value
4. Attach **last purchase rate** per item.

The difference lies in **how opening is computed** and **whether adjustments are applied inside the period**.

### 6.2 Fast Path – "Snapshot + Simple Sum"

**When used:** Everything is clean, no adjustments impact the period.

**Opening Quantity per Item:**

- Look up the **previous month's closing stock** from monthly balance:
  - Example: report starts at `2025-12-01`
  - Use `ItemMonthlyBalance(2025, 11, item)` → `closingStock`
- No need to scan ledger before `startDate`.

**Period Movements (In/Out, Amounts):**

- Scan Item Ledger from `startDate` to `endDate`.
- Group by item:
  - Sum quantities where `movementType = "in"`
  - Sum quantities where `movementType = "out"`
  - Sum values (quantity × rate + tax) similarly.
- **No adjustments are joined in**, because there are none for this period.

**Closing Quantity:**

```
closingQty = openingQty + totalIn - totalOut
```

**Last Purchase Rate:**

- For each item, query the latest purchase/purchase-return transaction up to `endDate`.
- If none found, fall back to opening rate from item master.

**Closing Balance:**

```
closingBalance = closingQty × lastPurchaseRate
```

This path is **fastest** because it avoids:

- Scanning long history before the period (opening comes from snapshot).
- Any joins to adjustment documents.

### 6.3 Hybrid Path – "Calculated Opening + Simple Period"

**When used:** Opening is not directly from a snapshot, but the period has no adjustments.

**Opening Quantity per Item:**

- Start from the **latest clean monthly balance** (or item master opening).
- Define a **dirty period** from that snapshot date up to `startDate`.
- For each item:
  - Sum signed quantities (in as +, out as −) from ledger in the dirty period.
  - Add signed deltas from adjustments in the dirty period.

Formula per item:

```
opening = baseSnapshot + ledgerMovements(dirtyPeriod) + adjustmentDeltas(dirtyPeriod)
```

**Period Movements (In/Out, Amounts):**

- Same as Fast Path: simple aggregation on Item Ledger from `startDate` to `endDate`.
- No adjustments joined, because report period is known to have no adjustments.

**Closing Quantity / Value:** same formulas as Fast Path.

Hybrid is **slower than Fast** (because opening is calculated) but **faster than Full Refold** (no joins for the report period).

### 6.4 Full Refold Path – "Calculated Opening + Adjusted Period"

**When used:** Some base snapshots are missing/dirty, or adjustments exist in the report period.

**Opening Quantity per Item:**

- Same as Hybrid Path – use dirty period logic to compute opening.

**Period Movements (In/Out, Amounts):**

- For each ledger row in the report period:
  - Join associated adjustment entries for that transaction and item.
  - Compute **effective quantity** = original quantity + quantityDelta.
  - Compute **effective rate/amount** similarly.
- Group by item using effective values instead of raw ones.

This ensures the report reflects the **corrected** quantities and values, not the originally entered ones.

**Closing Quantity / Value:** same formulas, but using adjusted totals.

This path is the **most accurate** and **most expensive**, used only when necessary.

---

## 7. Typical Scenarios (Concrete Examples)

### Scenario 1 – Previous Month, Clean

- Invoice volume: normal.
- No adjustments in the last month.
- Monthly balances for that month are all clean.

Request:

- `startDate = 2025-11-01`
- `endDate = 2025-11-30`

Path used: **Fast Path**

Behavior:

- Opening = October 31 closing from monthly balances.
- Period: sum November movements directly from ledger.

### Scenario 2 – Mid-Month, No Adjustments

- User wants `2025-12-10` to `2025-12-20`.
- There were some movements from Dec 1–9.
- No adjustments exist anywhere in December.

Path used: **Hybrid Path**

Behavior:

- Opening at Dec 10 is computed from:
  - Last monthly snapshot (e.g., Nov 30)
  - All transactions + adjustments from Dec 1–9
- Period Dec 10–20 is read from ledger without adjustments join.

### Scenario 3 – Adjustments in Period

- A sale on Dec 15 was later adjusted (quantity corrected).
- Report range: Dec 1–31.

Path used: **Full Refold Path**

Behavior:

- Opening at Dec 1 computed using pre-December history.
- In the Dec 1–31 period:
  - All relevant adjustments are joined and their deltas applied to the original transactions.

---

## 8. How to Safely Modify or Extend

### 8.1 Adding a New Filter (e.g., by Category)

- Add the filter in the **controller** when building the base match object (for item IDs and for the later aggregations in each path).
- Be consistent: any condition applied in the controller should also be mirrored in path services where they query Item Ledger for the same period/company/branch.

### 8.2 Changing Opening Balance Rules

- If the business definition of "opening" changes, look at the **opening calculation service** (the batch opening balances logic).
- Fast Path may also need adjustment if monthly snapshot semantics change (e.g., if monthly balances become start-of-month instead of end-of-month).

### 8.3 Debugging Wrong Quantities

Checklist:

1. Check which path was used (logs usually include something like `FAST_PATH`, `HYBRID_PATH`, `FULL_REFOLD`).
2. For wrong opening:
   - Inspect the batch opening balance logic.
   - Verify monthly balances for the previous month.
3. For wrong period totals:
   - If Fast/Hybrid path was used, check raw ledger rows.
   - If Full Refold was used, also check adjustments and their deltas.

---

## 9. Mental Model Summary

You can summarize the system like this:

- **Monthly balance** = "safe checkpoint" at month-end.
- **Dirty period** = range after that checkpoint until report start.
- **Opening** = checkpoint + all movements + adjustments in dirty period.
- **Report period** = the requested date range.
  - If **no adjustments** in this range → simple sums are enough.
  - If **adjustments exist** → must join and apply deltas.

The three paths are just **different optimizations** of the same accounting truth.

- **Fast Path:** "Everything clean; just trust the checkpoints and sum."
- **Hybrid Path:** "Opening is tricky; period is clean."
- **Full Refold:** "Everything might be messy; recompute carefully."

---

## 10. Performance Expectations

### Expected Execution Times

For a typical report with 15 items and 100–500 ledger rows:

| Path | Time | When |
|------|------|------|
| **Fast Path** | 150–200ms | Previous clean month, no adjustments |
| **Hybrid Path** | 220–280ms | Mid-month report, clean period |
| **Full Refold** | 300–350ms | Adjustments or missing snapshots |

**Important:** With very small datasets (< 10 rows), Full Refold may appear faster due to query-planning overhead in the Hybrid path. This is expected and normalizes at production scale.

### How to Monitor Performance

Check the response JSON (in development mode):

```json
{
  "items": [...],
  "pagination": {...},
  "filters": {...},
  "_debug": {
    "executionTimeMs": 187,
    "pathUsed": "FAST_PATH",
    "reason": "All conditions perfect for fast path"
  }
}
```

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **Item Ledger** | Transaction records (purchases, sales, returns) |
| **Monthly Balance** | End-of-month snapshot for each item |
| **Dirty Period** | Time between last clean snapshot and report start |
| **Adjustment** | Retroactive correction to a past transaction |
| **Effective Quantity** | Original quantity + adjustment delta |
| **Movement Type** | "in" (stock increase) or "out" (stock decrease) |
| **needsRecalculation** | Flag indicating if a snapshot is reliable |

---

This README should give future developers enough context to reason about the system, debug issues, and extend behavior without having to fully understand every aggregation pipeline from day one.
