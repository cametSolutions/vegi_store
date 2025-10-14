import { SalesModel } from "../../model/TransactionModel.js";
import { updateStock } from "./stockManager.js";
import { createAccountLedger, createItemLedgers } from "./ledgerService.js";
import { createOutstanding } from "./outstandingService.js";
import {
  updateAccountMonthlyBalance,
  updateItemMonthlyBalances,
} from "./monthlyBalanceService.js";
import { transactionTypeToModelName } from "./transactionMappers.js";
/**
 * Main transaction processor - orchestrates all steps
 */
export const processTransaction = async (transactionData, session) => {
  try {
    const { transactionType, branch, items, createdBy } = transactionData;

    // Step 1: Determine transaction behavior
    const behavior = determineTransactionBehavior(transactionType);

    // // Step 2: Update stock
    await updateStock(
      items,
      behavior.stockDirection,
      branch,
      session
    );

    // // Step 3: Create transaction record
    const transaction = await SalesModel.create([transactionData], {
      session,
    });

   
    
    const createdTransaction = transaction[0];

    // Step 4: Create outstanding (if balance exists)
    let outstanding = null;
    if (createdTransaction.balanceAmount > 0) {
      outstanding = await createOutstanding(
        {
          company: createdTransaction.company,
          branch: createdTransaction.branch,
          account: createdTransaction.account,
          accountName: createdTransaction.accountName,
          accountType: createdTransaction.accountType,
          transactionModel: transactionTypeToModelName(createdTransaction.transactionType),
          sourceTransaction: createdTransaction._id,
          transactionType: createdTransaction.transactionType,
          transactionNumber: createdTransaction.transactionNumber,
          transactionDate: createdTransaction.transactionDate,
          outstandingType: behavior.outstandingType,
          totalAmount: createdTransaction.netAmount,
          paidAmount: createdTransaction.paidAmount,
          closingBalanceAmount: createdTransaction.netAmount,
          paymentTermDays: 30, // Can be made configurable
          notes: createdTransaction.notes,
          createdBy: createdBy,
        },
        session
      );
    }

    // Step 5: Create account ledger entry
    const accountLedger = await createAccountLedger(
      {
        company: createdTransaction.company,
        branch: createdTransaction.branch,
        account: createdTransaction.account,
        accountName: createdTransaction.accountName,
        transactionId: createdTransaction._id,
        transactionNumber: createdTransaction.transactionNumber,
        transactionDate: createdTransaction.transactionDate,
        transactionType: createdTransaction.transactionType,
        ledgerSide: behavior.ledgerSide,
        amount: createdTransaction.netAmount,
        narration: `${transactionType} - ${createdTransaction.transactionNumber}`,
        createdBy: createdBy,
      },
      session
    );

    // Step 6: Create item ledger entries
    const itemLedgers = await createItemLedgers(
      {
        company: createdTransaction.company,
        branch: createdTransaction.branch,
        items: createdTransaction.items,
        transactionId: createdTransaction._id,
        transactionNumber: createdTransaction.transactionNumber,
        transactionDate: createdTransaction.transactionDate,
        transactionType: createdTransaction.transactionType,
        movementType: behavior.stockDirection === "out" ? "out" : "in",
        account: createdTransaction.account,
        accountName: createdTransaction.accountName,
        createdBy: createdBy,
      },
      session
    );

    // // Step 7: Update monthly balances (real-time)
    // // Account monthly balance
    await updateAccountMonthlyBalance(
      {
        company: createdTransaction.company,
        branch: createdTransaction.branch,
        account: createdTransaction.account,
        accountName: createdTransaction.accountName,
        transactionDate: createdTransaction.transactionDate,
        ledgerSide: behavior.ledgerSide,
        amount: createdTransaction.netAmount,
      },
      session
    );

    // // Item monthly balances
    await updateItemMonthlyBalances(
      {
        company: createdTransaction.company,
        branch: createdTransaction.branch,
        items: createdTransaction.items,
        transactionDate: createdTransaction.transactionDate,
        movementType: behavior.stockDirection === "out" ? "out" : "in",
      },
      session
    );

    // Return all created documents
    return {
      transaction: createdTransaction,
      outstanding,
      accountLedger,
      itemLedgers,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Helper: Determine transaction behavior based on type
 */
function determineTransactionBehavior(transactionType) {
  const behaviors = {
    sale: {
      stockDirection: "out",
      outstandingType: "dr", // Customer owes us (receivable)
      ledgerSide: "debit",
    },
    debit_note: {
      stockDirection: "out",
      outstandingType: "dr",
      ledgerSide: "debit",
    },
    purchase: {
      stockDirection: "in",
      outstandingType: "cr", // We owe supplier (payable)
      ledgerSide: "credit",
    },
    credit_note: {
      stockDirection: "in",
      outstandingType: "cr",
      ledgerSide: "credit",
    },
  };

  const behavior = behaviors[transactionType];

  if (!behavior) {
    throw new Error(`Invalid transaction type: ${transactionType}`);
  }

  return behavior;
}
