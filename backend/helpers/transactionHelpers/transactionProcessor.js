import { SalesModel } from "../../model/TransactionModel.js";
import { updateStock } from "./stockManager.js";
import {
  createAccountLedger,
  createItemLedgers,
} from "../CommonTransactionHelper/ledgerService.js";
import { createOutstanding } from "./outstandingService.js";
import {
  updateAccountMonthlyBalance,
  updateItemMonthlyBalances,
} from "../CommonTransactionHelper/monthlyBalanceService.js";
import {
  getTransactionModel,
  transactionTypeToModelName,
} from "./transactionMappers.js";
import { getCashBankAccountForPayment } from "../CommonTransactionHelper/CashBankAccountHelper.js";
import { createCashBankLedgerEntry } from "../../helpers/CommonTransactionHelper/CashBankLedgerHelper.js";
/**
 * Main transaction processor - orchestrates all steps
 */
export const processTransaction = async (transactionData, userId, session) => {
  try {
    const { transactionType, branch, items, createdBy, company } =
      transactionData;

    // Step 1: Determine transaction behavior
    const behavior = determineTransactionBehavior(transactionType);

    // // Step 2: Update stock
    await updateStock(items, behavior.stockDirection, branch, session);

    const transactionModel = getTransactionModel(transactionType);

    // // Step 3: Create transaction record
    const transaction = await transactionModel.create([transactionData], {
      session,
    });

    const createdTransaction = transaction[0];

    // Step 4: Create outstanding (if balance exists) only if accountType is customer
    // else we create a settlement for cash since we have only two options for transactions customer or cash(other)
    let outstanding = null;
    if (createdTransaction.accountType === "cash") {
      // This finds the actual Cash/Bank account based on payment mode
      const cashBankAccount = await getCashBankAccountForPayment({
        paymentMode: "cash",
        companyId: company,
        branchId: branch,
        session,
      });
      console.log("cashBankAccount", cashBankAccount);

      console.log("createdTransaction", createdTransaction);

      /// create cash ledger entry for cash transaction
      const ledgerEntry = await createCashBankLedgerEntry({
        transactionId: createdTransaction._id,
        transactionType: transactionType.toLowerCase(),
        transactionNumber: createdTransaction.transactionNumber,
        transactionDate: createdTransaction.transactionDate,
        accountId: createdTransaction.account,
        accountName: createdTransaction?.accountName,
        amount: createdTransaction?.netAmount,
        paymentMode: "cash",
        cashBankAccountId: cashBankAccount.accountId,
        cashBankAccountName: cashBankAccount.accountName,
        isCash: cashBankAccount.isCash,
        company: company,
        branch: branch,
        createdBy: userId,
        session,
      });
    } else if (
      createdTransaction.balanceAmount > 0 &&
      createdTransaction.accountType === "customer"
    ) {
      outstanding = await createOutstanding(
        {
          company: createdTransaction.company,
          branch: createdTransaction.branch,
          account: createdTransaction.account,
          accountName: createdTransaction.accountName,
          accountType: createdTransaction.accountType,
          transactionModel: transactionTypeToModelName(
            createdTransaction.transactionType
          ),
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
