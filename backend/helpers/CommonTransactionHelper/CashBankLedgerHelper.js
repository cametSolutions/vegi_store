import CashBankLedger from "../../model/CashBankLedgerModel.js";

/**
 * Create a Cash/Bank Ledger Entry
 * This records the movement of money in/out of cash or bank accounts
 *
 * For Receipt: Debit Cash/Bank (money coming in)
 * For Payment: Credit Cash/Bank (money going out)
 */
export const createCashBankLedgerEntry = async ({
  transactionId,
  transactionType, // 'receipt' or 'payment'
  transactionNumber,
  transactionDate,
  accountId,
  accountName,
  amount,
  paymentMode,
  cashBankAccountId,
  cashBankAccountName,
  isCash,
  chequeNumber,
  chequeDate,
  narration,
  company,
  branch,
  createdBy,
  session,
}) => {
  try {
    // ✅ Always force lowercase to match schema enum
    const type = transactionType.toLowerCase(); // "receipt" or "payment"
    const entryType = type === "receipt" ? "debit" : "credit";

    // ✅ Capitalize for Mongoose model name
    const modelName = type.charAt(0).toUpperCase() + type.slice(1); // "Receipt" or "Payment"

    const ledgerData = {
      company,
      branch,
      transaction: transactionId,
      transactionModel: modelName,
      transactionNumber: transactionNumber,
      transactionDate: transactionDate,
      transactionType: type,
      account: accountId,
      accountName: accountName,
      amount,
      entryType,
      paymentMode,
      chequeNumber,
      chequeDate,
      narration,
      createdBy,
    };

    // Assign proper cash/bank account
    if (isCash) {
      ledgerData.cashAccount = cashBankAccountId;
      ledgerData.cashAccountName = cashBankAccountName;
    } else {
      ledgerData.bankAccount = cashBankAccountId;
      ledgerData.bankAccountName = cashBankAccountName;
    }

    const ledgerEntry = new CashBankLedger(ledgerData);
    await ledgerEntry.save({ session });

    return ledgerEntry;
  } catch (error) {
    console.error("❌ Error creating CashBankLedger entry:", error.message);
    throw error;
  }
};

export const reverseCashBankLedgerEntry = async ({
  transactionId,
  userId,
  reason = "Transaction deleted",
  session,
}) => {
  console.log("\n↩️ Reversing Cash/Bank Ledger Entry...");

  const result = await CashBankLedger.reverseAllForTransaction(
    transactionId,
    userId,
    reason
  );

  console.log(`✅ Reversed ${result} ledger entry/entries`);

  return result;
};

/**
 * Get Cash/Bank Ledger for an account
 */
export const getCashBankLedger = async ({
  company,
  branch,
  bankAccountId = null, // null for cash
  startDate,
  endDate,
  page = 1,
  limit = 50,
}) => {
  const query = {
    company,
    branch,
  };

  // Filter by cash or specific bank account
  if (bankAccountId) {
    query.bankAccount = bankAccountId;
  } else {
    query.bankAccount = null;
    query.paymentMode = "cash";
  }

  if (startDate || endDate) {
    query.TransactionDate = {};
    if (startDate) query.TransactionDate.$gte = new Date(startDate);
    if (endDate) query.TransactionDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [entries, total, balance] = await Promise.all([
    CashBankLedger.find(query)
      .populate("Account", "accountName accountType")
      .populate("bankAccount", "accountName")
      .sort({ TransactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CashBankLedger.countDocuments(query),
    CashBankLedger.getAccountBalance(bankAccountId, startDate, endDate),
  ]);

  return {
    entries,
    balance,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get Cash/Bank statement with running balance
 */
export const getCashBankStatement = async ({
  company,
  branch,
  bankAccountId = null,
  startDate,
  endDate,
}) => {
  const query = {
    company,
    branch,
  };

  if (bankAccountId) {
    query.bankAccount = bankAccountId;
  } else {
    query.bankAccount = null;
    query.paymentMode = "cash";
  }

  if (startDate || endDate) {
    query.TransactionDate = {};
    if (startDate) query.TransactionDate.$gte = new Date(startDate);
    if (endDate) query.TransactionDate.$lte = new Date(endDate);
  }

  const entries = await CashBankLedger.find(query)
    .populate("Account", "accountName")
    .populate("bankAccount", "accountName")
    .sort({ TransactionDate: 1, createdAt: 1 });

  // Calculate running balance
  let runningBalance = 0;
  const statement = entries.map((entry) => {
    const balanceEffect =
      entry.entryType === "debit" ? entry.amount : -entry.amount;
    runningBalance += balanceEffect;

    return {
      date: entry.TransactionDate,
      transactionNumber: entry.TransactionNumber,
      transactionType: entry.TransactionType,
      party: entry.AccountName,
      narration: entry.narration,
      paymentMode: entry.paymentMode,
      chequeNumber: entry.chequeNumber,
      debit: entry.entryType === "debit" ? entry.amount : 0,
      credit: entry.entryType === "credit" ? entry.amount : 0,
      balance: runningBalance,
    };
  });

  return {
    statement,
    summary: {
      totalDebit: entries.reduce(
        (sum, e) => sum + (e.entryType === "debit" ? e.amount : 0),
        0
      ),
      totalCredit: entries.reduce(
        (sum, e) => sum + (e.entryType === "credit" ? e.amount : 0),
        0
      ),
      closingBalance: runningBalance,
      entryCount: entries.length,
    },
  };
};

/**
 * Get all Cash/Bank accounts with balances
 */
export const getAllCashBankBalances = async (company, branch) => {
  const pipeline = [
    {
      $match: {
        company: company,
        branch: branch,
      },
    },
    {
      $group: {
        _id: {
          bankAccount: "$bankAccount",
          bankAccountName: "$bankAccountName",
          paymentMode: "$paymentMode",
        },
        totalDebit: {
          $sum: { $cond: [{ $eq: ["$entryType", "debit"] }, "$amount", 0] },
        },
        totalCredit: {
          $sum: { $cond: [{ $eq: ["$entryType", "credit"] }, "$amount", 0] },
        },
        lastTransactionDate: { $max: "$TransactionDate" },
        entryCount: { $sum: 1 },
      },
    },
    {
      $project: {
        accountId: "$_id.bankAccount",
        accountName: "$_id.bankAccountName",
        paymentMode: "$_id.paymentMode",
        totalDebit: 1,
        totalCredit: 1,
        balance: { $subtract: ["$totalDebit", "$totalCredit"] },
        lastTransactionDate: 1,
        entryCount: 1,
        isCash: { $eq: ["$_id.bankAccount", null] },
      },
    },
    {
      $sort: { isCash: -1, accountName: 1 },
    },
  ];

  const accounts = await CashBankLedger.aggregate(pipeline);

  const summary = accounts.reduce(
    (acc, account) => {
      acc.totalBalance += account.balance;
      acc.totalDebit += account.totalDebit;
      acc.totalCredit += account.totalCredit;
      if (account.isCash) {
        acc.cashBalance += account.balance;
      } else {
        acc.bankBalance += account.balance;
      }
      return acc;
    },
    {
      totalBalance: 0,
      cashBalance: 0,
      bankBalance: 0,
      totalDebit: 0,
      totalCredit: 0,
    }
  );

  return {
    accounts,
    summary,
  };
};
