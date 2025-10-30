import mongoose from "mongoose";
import AccountMaster from "../../model/masters/AccountMasterModel.js";

/**
 * Find Cash account for a company/branch
 * Cash accounts have accountType: 'other' and accountName: 'cash'
 *
 * @param {ObjectId} companyId - Company ID
 * @param {ObjectId} branchId - Branch ID
 * @param {Session} session - Mongoose session
 * @returns {Object} Cash account document with full details
 */
export const getCashAccount = async (companyId, branchId, session) => {
  console.log("\n💵 Finding Cash Account...");

  const cashAccount = await AccountMaster.findOne({
    company: companyId,
    branches: branchId,
    accountType: "cash",
    accountName: { $regex: /^cash$/i }, // Case-insensitive "Cash"
    status: "active",
  }).session(session);

  if (!cashAccount) {
    console.log("⚠️ Cash account not found for this branch");
    throw new Error(
      "Cash account not found. Please create a Cash account (accountType: other, accountName: cash) for this branch."
    );
  }

  console.log("✅ Cash account found:", {
    id: cashAccount._id,
    name: cashAccount.accountName,
    type: cashAccount.accountType,
  });

  return cashAccount;
};

/**
 * Find Bank account for a company/branch
 * Bank accounts have accountType: 'other' and accountName contains 'bank'
 *
 * @param {ObjectId} companyId - Company ID
 * @param {ObjectId} branchId - Branch ID
 * @param {ObjectId} bankAccountId - Specific bank account ID (optional)
 * @param {Session} session - Mongoose session
 * @returns {Object} Bank account document with full details
 */
export const getBankAccount = async (companyId, branchId, session) => {
  console.log("\n🏦 Finding Bank Account...");

  // Find any active bank account for this branch
 const  bankAccount = await AccountMaster.findOne({
    company: companyId,
    branches: branchId,
    accountType: "bank",
    accountName: { $regex: /bank/i }, // Contains "bank" (case-insensitive)
    status: "active",
  }).session(session);

  if (!bankAccount) {
    throw new Error(
      "No active bank account found for this branch. Please specify bankAccount or create a bank account (accountType: other, accountName: [bank name])."
    );
  }

  console.log("✅ Bank account found:", {
    id: bankAccount._id,
    name: bankAccount.accountName,
    type: bankAccount.accountType,
  });

  return bankAccount;
};

/**
 * Get Cash or Bank account based on payment mode
 * Returns the FULL AccountMaster document for saving to CashBankLedger
 *
 * @param {String} paymentMode - 'cash', 'bank', 'cheque', etc.
 * @param {ObjectId} companyId - Company ID
 * @param {ObjectId} branchId - Branch ID
 * @param {ObjectId} bankAccountId - Specific bank account ID (optional for bank payments)
 * @param {Session} session - Mongoose session
 * @returns {Object} { accountId, accountName, accountDocument, isCash }
 */
export const getCashBankAccountForPayment = async ({
  paymentMode,
  companyId,
  branchId,
  session,
}) => {


  const normalizedPaymentMode = (paymentMode || "cash").toLowerCase();
  const isCashPayment = normalizedPaymentMode === "cash";

  if (isCashPayment) {
    // For cash payments, get the cash account from AccountMaster
    const cashAccount = await getCashAccount(companyId, branchId, session);
    return {
      accountId: cashAccount._id,
      accountName: cashAccount.accountName,
      accountDocument: cashAccount, // Full document for reference
      isCash: true,
    };
  } else {
    // For bank/cheque payments, get the bank account from AccountMaster
    const bankAccount = await getBankAccount(companyId, branchId, session);
    return {
      accountId: bankAccount._id,
      accountName: bankAccount.accountName,
      accountDocument: bankAccount, // Full document for reference
      isCash: false,
    };
  }
};

/**
 * Get all Cash and Bank accounts for a company/branch
 * Useful for dropdowns and selection
 *
 * @param {ObjectId} companyId - Company ID
 * @param {ObjectId} branchId - Branch ID
 * @returns {Object} { cashAccounts, bankAccounts }
 */
export const getAllCashBankAccounts = async (
  companyId,
  branchId,
  paymentMode
) => {
  const [cashAccounts, bankAccounts] = await Promise.all([
    // Find all cash accounts
    AccountMaster.find({
      company: companyId,
      branches: branchId,
      accountType: "cash",
      accountName: { $regex: /^cash$/i },
      status: "active",
    }).select("_id accountName accountType"),

    // Find all bank accounts
    AccountMaster.find({
      company: companyId,
      branches: branchId,
      accountType: "bank",
      accountName: { $regex: /bank/i },
      status: "active",
    }).select("_id accountName accountType"),
  ]);

  return {
    cashAccounts,
    bankAccounts,
    hasCash: cashAccounts.length > 0,
    hasBank: bankAccounts.length > 0,
    totalAccounts: cashAccounts.length + bankAccounts.length,
  };
};
