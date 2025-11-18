// transactionHelpers/transactionEditHelper.js

import { generatePeriodKey } from "../../../shared/utils/date.js";
import AccountMonthlyBalance from "../../model/AccountMonthlyBalanceModel.js";
import AdjustmentEntry from "../../model/AdjustmentEntryModel.js";
import ItemMonthlyBalance from "../../model/ItemMonthlyBalanceModel.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";
import {
  createAccountLedger,
  createItemLedgers,
} from "../CommonTransactionHelper/ledgerService.js";
import {
  updateAccountMonthlyBalance,
  updateItemMonthlyBalances,
} from "../CommonTransactionHelper/monthlyBalanceService.js";
import { determineTransactionBehavior } from "./modelFindHelper.js";
import { transactionTypeToModelName } from "./transactionMappers.js";

/**
 * Create adjustment entries with proper tracking
 */
// When a user edits a transaction, instead of deleting the original ledger entries and creating new ones (reversal approach), this function creates adjustment entries that show only the net difference between old and new values.
// Original Sale: ₹10,000
// Edited to: ₹12,000
// Instead of: "Delete ₹10,000, Add ₹12,000" ❌
// You do: "Add adjustment of +₹2,000"

/**
 * Create adjustment entries with proper tracking
 */
export const createAdjustmentEntries = async (
  original,
  updated,
  deltas,
  userId,
  session
) => {
  // Sale/Debit Note: Dr (debit side) - Customer owes you
  // Purchase/Credit Note: Cr (credit side) - You owe supplier
  const behavior = determineTransactionBehavior(updated.transactionType);

  console.log("behavior", behavior);

  // ========================================
  // 1. Generate Adjustment Number
  // ========================================
  const adjustmentNumber = await AdjustmentEntry.generateAdjustmentNumber(
    updated.company,
    updated.branch,
    session
  );

  // ========================================
  // 2. Determine Adjustment Type
  // ========================================
  let adjustmentType = "amount_change";
  if (deltas.accountChanged && deltas.itemsChanged) {
    adjustmentType = "mixed";
  } else if (deltas.accountChanged) {
    adjustmentType = "account_change";
  } else if (deltas.itemsChanged) {
    adjustmentType = "item_change";
  }

  // ========================================
  // 3. Create Adjustment Entry Record (Metadata Only)
  // ========================================
  const adjustmentEntry = await AdjustmentEntry.create(
    [
      {
        company: updated.company,
        branch: updated.branch,
        originalTransaction: original._id,
        originalTransactionModel: transactionTypeToModelName(
          original.transactionType
        ),
        originalTransactionNumber: original.transactionNumber,
        originalTransactionDate: original.transactionDate,
        adjustmentNumber,
        adjustmentDate: new Date(),
        adjustmentType,
        affectedAccount: updated.account,
        affectedAccountName: updated.accountName,
        oldAccount: deltas.accountChanged ? deltas.oldAccount : null,
        oldAccountName: deltas.accountChanged ? deltas.oldAccountName : null,
        newAccount: deltas.accountChanged ? updated.account : null,
        newAccountName: deltas.accountChanged ? updated.accountName : null,

        // Store deltas only
        amountDelta: deltas.netAmountDelta,
        oldAmount: original.netAmount,
        newAmount: updated.netAmount,

        // Store item deltas
        itemAdjustments: deltas.stockDelta.map((delta) => {
          let oldQuantity, newQuantity;

          if (delta.isNew) {
            oldQuantity = 0;
            newQuantity = Math.abs(delta.quantityDelta);
          } else if (delta.isRemoved) {
            oldQuantity = Math.abs(delta.quantityDelta);
            newQuantity = 0;
          } else {
            const originalItem = original.items.find(
              (item) => item.item.toString() === delta.item.toString()
            );
            oldQuantity = originalItem ? originalItem.quantity : 0;
            newQuantity = oldQuantity + delta.quantityDelta;
          }

          return {
            item: delta.item,
            itemName: delta.itemName,
            itemCode: delta.itemCode,
            adjustmentType: delta.isNew
              ? "added"
              : delta.isRemoved
              ? "removed"
              : "quantity_changed",
            oldQuantity,
            newQuantity,
            quantityDelta: delta.quantityDelta,
          };
        }),
        reason: updated.editReason || "Transaction edited",
        notes: updated.editNotes || null,
        editedBy: userId,
        status: "active",
        isSystemGenerated: true,
      },
    ],
    { session }
  );

  console.log("✅ Adjustment created:", {
    adjustmentNumber,
    adjustmentType,
    note: "No ledger entries created - will be recalculated by nightly job",
  });

  return {
    adjustmentEntry: adjustmentEntry[0],
    message: "Adjustment stored. Ledger will be recalculated in nightly job.",
  };
};

/**
 * Create cash/bank ledger adjustment for cash transactions
 */
export const createCashAccountAdjustment = async (
  original,
  updated,
  deltas,
  userId,
  session
) => {
  if (deltas.netAmountDelta === 0) {
    return null;
  }

  const cashBankAccount = await getCashBankAccountForPayment({
    paymentMode: "cash",
    companyId: updated.company,
    branchId: updated.branch,
    session,
  });

  const behavior = determineTransactionBehavior(updated.transactionType);

  // Determine entry type for adjustment
  let entryType;
  if (deltas.netAmountDelta > 0) {
    // Amount increased
    entryType = behavior.ledgerSide === "debit" ? "debit" : "credit";
  } else {
    // Amount decreased
    entryType = behavior.ledgerSide === "debit" ? "credit" : "debit";
  }

  const adjustmentEntry = await createCashBankLedgerEntry({
    transactionId: original._id,
    transactionType: updated.transactionType.toLowerCase(),
    transactionNumber: `ADJ-${updated.transactionNumber}`,
    transactionDate: new Date(),
    accountId: updated.account,
    accountName: updated.accountName,
    amount: Math.abs(deltas.netAmountDelta),
    paymentMode: "cash",
    cashBankAccountId: cashBankAccount.accountId,
    cashBankAccountName: cashBankAccount.accountName,
    isCash: cashBankAccount.isCash,
    company: updated.company,
    branch: updated.branch,
    entryType,
    narration: `Cash adjustment for edit - ${original.transactionNumber} (${
      deltas.netAmountDelta > 0 ? "increased" : "decreased"
    } by ₹${Math.abs(deltas.netAmountDelta)})`,
    createdBy: userId,
    session,
  });

  return adjustmentEntry;
};
