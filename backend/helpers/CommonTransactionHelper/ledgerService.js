// const AccountLedger = require('../models/AccountLedger');
// const ItemLedger = require('../models/ItemLedger');
import AccountLedger from "../../model/AccountLedgerModel.js";
import ItemLedger from "../../model/ItemsLedgerModel.js";

/**
 * Create account ledger entry
 */
export const createAccountLedger = async (data, session) => {
  try {
    const {
      company,
      branch,
      account,
      accountName,
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType,
      ledgerSide, // "debit" or "credit"

      amount,
      narration,
      createdBy,
    } = data;

    console.log("call came herr");

    // Get last running balance for this account
    const lastBalance = await AccountLedger.getLastBalance(
      account,
      company,
      branch,
      session,
    );

    // console.log("last Balance",lastBalance);
    // console.log("ledgerSide",ledgerSide);

    // Calculate new running balance
    let runningBalance;
    if (ledgerSide === "debit") {
      runningBalance = lastBalance + amount;
    } else if (ledgerSide === "credit") {
      runningBalance = lastBalance - amount;
    } else {
      throw new Error(`Invalid ledger side: ${ledgerSide}`);
    }

    // console.log("runningBalance",runningBalance);

    // Create ledger entry
    const ledgerEntry = await AccountLedger.create(
      [
        {
          company,
          branch,
          account,
          accountName,
          transactionId,
          transactionNumber,
          transactionDate,
          transactionType,
          ledgerSide,
          amount,
          runningBalance,
          narration: narration || `${transactionType} transaction`,
          createdBy,
        },
      ],
      { session },
    );

    console.log("leger entry ", ledgerEntry);

    return ledgerEntry[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create item ledger entries for all items in transaction
 */

export const createItemLedgers = async (data, session) => {
  try {
    const {
      company,
      branch,
      items,
      transactionId,
      transactionNumber,
      transactionDate,
      transactionType,
      movementType,
      account,
      accountName,
      createdBy,
    } = data;

    /**
     * STEP 1
     * Convert mongoose subdocuments to plain objects
     */
    const plainItems = items.map((item) =>
      typeof item.toObject === "function" ? item.toObject() : item,
    );

    /**
     * STEP 2
     * Consolidate same items into single entry
     */
    const consolidatedMap = new Map();

    for (const item of plainItems) {
      const itemId = item.item.toString();

      if (!consolidatedMap.has(itemId)) {
        consolidatedMap.set(itemId, {
          item: item.item,
          itemName: item.itemName,
          itemCode: item.itemCode,
          unit: item.unit,
          quantity: Number(item.quantity),
          baseAmount: Number(item.baseAmount),
          amountAfterTax: Number(item.amountAfterTax),
          taxAmount: Number(item.taxAmount),
          taxRate: Number(item.taxRate || 0),
        });
      } else {
        const existing = consolidatedMap.get(itemId);
        existing.quantity += Number(item.quantity);
        existing.baseAmount += Number(item.baseAmount);
        existing.amountAfterTax += Number(item.amountAfterTax);
        existing.taxAmount += Number(item.taxAmount);
      }
    }

    /**
     * STEP 3
     * Fetch all previous balances IN PARALLEL (safe — these are reads only)
     */
    const consolidatedItems = [...consolidatedMap.values()];

    const previousBalances = await Promise.all(
      consolidatedItems.map((item) =>
        ItemLedger.getLastStockBalance(item.item, company, branch, session),
      ),
    );

    /**
     * STEP 4
     * Build ledger entries using fetched balances (pure in-memory, no DB)
     */
    const ledgerEntries = consolidatedItems.map((item, index) => {
      const previousBalance = previousBalances[index];

      let runningStockBalance;
      if (movementType === "in") {
        runningStockBalance = previousBalance + item.quantity;
      } else if (movementType === "out") {
        runningStockBalance = previousBalance - item.quantity;
      } else {
        throw new Error(`Invalid movement type: ${movementType}`);
      }

      const avgRate =
        item.quantity > 0 ? Number(item.baseAmount / item.quantity) : 0;

      return {
        company,
        branch,
        item: item.item,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        transactionId,
        transactionNumber,
        transactionDate,
        transactionType,
        movementType,
        quantity: item.quantity,
        rate: avgRate,
        baseAmount: item.baseAmount,
        amountAfterTax: item.amountAfterTax,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        runningStockBalance,
        account,
        accountName,
        createdBy,
      };
    });

    /**
     * STEP 5
     * Insert all ledger entries in a single insertMany call
     */
    const createdEntries = await ItemLedger.create(ledgerEntries, {
      session,
      ordered: true,
    });

    return createdEntries;
  } catch (error) {
    throw error;
  }
};

/**
 * update ledger dates
 */

export const updateLedgerDates = async (
  company,
  branch,
  transactionId,
  newTransactionDate,
  session,
) => {
  await AccountLedger.updateOne(
    {
      company: company,
      branch: branch,
      transactionId: transactionId,
    },
    {
      $set: {
        transactionDate: newTransactionDate,
      },
    },
    { session },
  );
  // STEP 8.6: Update ItemLedger date (and amount if needed)
  await ItemLedger.updateOne(
    {
      company: company,
      branch: branch,
      transactionId: transactionId,
    },
    {
      $set: {
        transactionDate: newTransactionDate,
      },
    },
    { session },
  );
};
