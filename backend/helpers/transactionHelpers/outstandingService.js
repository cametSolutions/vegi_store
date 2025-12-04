import { calculateDueDate } from "../../../shared/utils/date.js";
import CashBankLedgerModel from "../../model/CashBankLedgerModel.js";
import Outstanding from "../../model/OutstandingModel.js";
import { getCashBankAccountForPayment } from "../CommonTransactionHelper/CashBankAccountHelper.js";
import { createCashBankLedgerEntry } from "../CommonTransactionHelper/CashBankLedgerHelper.js";
import { determineTransactionBehavior } from "./modelFindHelper.js";
import { transactionTypeToModelName } from "./transactionMappers.js";

/**
 * Create outstanding record
 */
export const createOutstanding = async (data, session) => {
  try {
    const {
      company,
      branch,
      account,
      accountName,
      accountType,
      transactionModel,
      sourceTransaction,
      transactionType,
      transactionNumber,
      transactionDate,
      outstandingType, // "dr" or "cr"
      totalAmount,
      paidAmount,
      closingBalanceAmount,
      paymentTermDays = 30,
      notes,
      createdBy,
    } = data;

    // Only create outstanding if there's a balance
    if (closingBalanceAmount <= 0) {
      return null;
    }

    // Calculate due date
    const dueDate = calculateDueDate(transactionDate, paymentTermDays);

    // Determine initial status
    let status = "pending";
    if (paidAmount > 0 && closingBalanceAmount > 0) {
      status = "partial";
    }

    // Create outstanding record
    const outstanding = await Outstanding.create(
      [
        {
          company,
          branch,
          account,
          accountName,
          accountType,
          transactionModel,
          sourceTransaction,
          transactionType,
          transactionNumber,
          transactionDate,
          outstandingType,
          totalAmount,
          paidAmount,
          closingBalanceAmount,
          dueDate,
          status,
          notes,
          createdBy,
        },
      ],
      { session }
    );

    return outstanding[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Update outstanding when payment is received
 */
export const updateOutstandingPayment = async (
  outstandingId,
  paidAmount,
  userId,
  session
) => {
  try {
    const outstanding = await Outstanding.findById(outstandingId).session(
      session
    );

    if (!outstanding) {
      throw new Error("Outstanding record not found");
    }

    // Use instance method to update payment
    outstanding.updatePayment(paidAmount, userId);

    await outstanding.save({ session });

    return outstanding;
  } catch (error) {
    throw error;
  }
};

/**
 * Update outstanding on edit
 * CRITICAL: Retains the original outstanding _id
 */
export const updateOutstandingOnEdit = async (
  original,
  updated,
  deltas,
  userId,
  session
) => {
  // Find existing outstanding by original transaction ID
  const existingOutstanding = await Outstanding.findOne({
    sourceTransaction: original._id,
  }).session(session);

  if (!existingOutstanding) {
    // No existing outstanding - might be cash transaction
    // Or outstanding was already settled and closed
    console.log("No outstanding found for this transaction");
    return null;
  }

  // ========================================
  // Recalculate Outstanding Balance
  // ========================================
  const behavior = determineTransactionBehavior(updated.transactionType);

  // Get all settlements for this outstanding
  const appliedReceipts = existingOutstanding.appliedReceipts || 0;
  const appliedPayments = existingOutstanding.appliedPayments || 0;

  // Calculate closingBalanceAmount based on voucher type
  let closingBalanceAmount;

  if (behavior.outstandingType === "dr") {
    // For Sale and Purchase Return (Dr vouchers)
    closingBalanceAmount =
      updated.netAmount - appliedReceipts + appliedPayments;
  } else {
    // For Purchase and Sales Return (Cr vouchers)
    closingBalanceAmount = -(
      updated.netAmount -
      appliedPayments +
      appliedReceipts
    );
  }

  // ========================================
  // Update Outstanding (RETAIN _id)
  // ========================================
  existingOutstanding.totalAmount = updated.netAmount;
  existingOutstanding.closingBalanceAmount = closingBalanceAmount;
  existingOutstanding.transactionNumber = updated.transactionNumber;
  existingOutstanding.transactionDate = updated.transactionDate;
  existingOutstanding.accountName = updated.accountName;

  // Handle account change
  if (deltas.accountChanged) {
    existingOutstanding.account = updated.account;
  }

  existingOutstanding.lastUpdatedBy = userId;
  existingOutstanding.lastUpdatedAt = new Date();

  // Update status
  if (closingBalanceAmount <= 0) {
    existingOutstanding.status = "settled";
  } else if (appliedReceipts > 0 || appliedPayments > 0) {
    existingOutstanding.status = "partial";
  } else {
    existingOutstanding.status = "pending";
  }

  await existingOutstanding.save({ session });

  return existingOutstanding;
};

/**
 * Handle outstanding and cash/bank ledger changes when account type changes
 * Covers all 4 cases of account type transitions
 */

export const handleAccountTypeChangeOnEdit = async (
  original,
  updated,
  deltas,
  userId,
  session
) => {
  console.log("original",original);
  
  const behavior = determineTransactionBehavior(updated.transactionType);

  const originalAccountType = original.accountType;
  const newAccountType = updated.accountType;

  console.log(
    `Account type transition: ${originalAccountType} → ${newAccountType}`
  );

  let result = {
    outstandingDeleted: false,
    outstandingCreated: false,
    cashBankDeleted: false,
    cashBankCreated: false,
    outstanding: null,
    cashBankLedger: null,
  };

  // ========================================
  // CASE 1: Customer or Supplier → Cash
  // Delete outstanding, Create cash/bank ledger
  // ========================================
  if (
    (originalAccountType === "customer" ||
      originalAccountType === "supplier") &&
    newAccountType === "cash"
  ) {
    console.log("📝 Case 1: Customer → Cash");

    // Delete existing outstanding
    const deleteResult = await Outstanding.deleteOne({
      sourceTransaction: original._id,
    }).session(session);

    result.outstandingDeleted = deleteResult.deletedCount > 0;
    console.log(`🗑️ Deleted outstanding: ${result.outstandingDeleted}`);

    // Create cash/bank ledger entry
    const cashBankAccount = await getCashBankAccountForPayment({
      paymentMode: "cash",
      companyId: updated.company,
      branchId: updated.branch,
      session,
    });

    console.log("cash or bank",cashBankAccount);
    

    result.cashBankLedger = await createCashBankLedgerEntry({
      transactionId: original._id,
      transactionType: updated.transactionType.toLowerCase(),
      transactionNumber: updated.transactionNumber,
      transactionDate: updated.transactionDate || original.transactionDate,
      accountId: updated.account,
      accountName: updated.accountName,
      amount: updated.netAmount,
      paymentMode: "cash",
      cashBankAccountId: cashBankAccount.accountId,
      cashBankAccountName: cashBankAccount.accountName,
      isCash: cashBankAccount.isCash,
      company: updated.company,
      branch: updated.branch,
      entryType: behavior.ledgerSide,
      narration: `${updated.transactionType} - ${updated.transactionNumber} (Edited from customer to cash)`,
      createdBy: userId,
      session,
    });

    result.cashBankCreated = true;
    console.log(`✅ Created cash/bank ledger: ${result.cashBankLedger._id}`);
  }

  // ========================================
  // CASE 2: Cash → Customer
  // Delete cash/bank ledger, Create outstanding
  // ========================================
  else if (originalAccountType === "cash" && newAccountType === "customer") {
    console.log("📝 Case 2: Cash → Customer");

    // Delete existing cash/bank ledger entry
    const deleteResult = await CashBankLedgerModel.deleteOne({
      transaction: original._id,
      transactionModel: transactionTypeToModelName(original.transactionType),
    }).session(session);

    result.cashBankDeleted = deleteResult.deletedCount > 0;
    console.log(`🗑️ Deleted cash/bank ledger: ${result.cashBankDeleted}`);

    // Create outstanding
    result.outstanding = await createOutstanding(
      {
        company: updated.company,
        branch: updated.branch,
        account: updated.account,
        accountName: updated.accountName,
        accountType: updated.accountType,
        transactionModel: transactionTypeToModelName(updated.transactionType),
        sourceTransaction: original._id,
        transactionType: updated.transactionType,
        transactionNumber: updated.transactionNumber,
        transactionDate: updated.transactionDate || original.transactionDate,
        outstandingType: behavior.outstandingType,
        totalAmount: updated.netAmount,
        paidAmount: 0,
        closingBalanceAmount: updated.netAmount,
        paymentTermDays: 30,
        notes: updated.notes || "",
        createdBy: userId,
      },
      session
    );

    result.outstandingCreated = true;
    console.log(`✅ Created outstanding: ${result.outstanding._id}`);
  }

  // ========================================
  // CASE 3: Customer → Another Customer
  // Delete old outstanding, Create new outstanding
  // ========================================
  else if (
    originalAccountType === "customer" &&
    newAccountType === "customer"
  ) {
    if (deltas.accountChanged) {
      console.log("📝 Case 3: Customer → Another Customer");

      // Delete old outstanding
      const deleteResult = await Outstanding.deleteOne({
        sourceTransaction: original._id,
      }).session(session);

      console.log("deleteResult",deleteResult);
      

      result.outstandingDeleted = deleteResult.deletedCount > 0;
      console.log(`🗑️ Deleted old outstanding: ${result.outstandingDeleted}`);

      // Create new outstanding for new customer
      result.outstanding = await createOutstanding(
        {
          company: updated.company,
          branch: updated.branch,
          account: updated.account,
          accountName: updated.accountName,
          accountType: updated.accountType,
          transactionModel: transactionTypeToModelName(updated.transactionType),
          sourceTransaction: original._id,
          transactionType: updated.transactionType,
          transactionNumber: updated.transactionNumber,
          transactionDate: updated.transactionDate || original.transactionDate,
          outstandingType: behavior.outstandingType,
          totalAmount: updated.netAmount,
          paidAmount: 0,
          closingBalanceAmount: updated.netAmount,
          paymentTermDays: 30,
          notes: updated.notes || "",
          createdBy: userId,
        },
        session
      );

      result.outstandingCreated = true;
      // result.outstandingId = result.outstanding._id.toString();
      // console.log("result",result);
      
      // console.log(`✅ Created new outstanding: ${result.outstandingId}`);
    } else {
      // Same customer, just update outstanding
      console.log("📝 Case 3b: Same Customer, updating outstanding");
      result.outstanding = await updateOutstandingOnEdit(
        original,
        updated,
        deltas,
        userId,
        session
      );
    }
  }

  // ========================================
  // CASE 4: Cash → Another Cash Account
  // Delete old cash/bank ledger, Create new
  // ========================================
  else if (originalAccountType === "cash" && newAccountType === "cash") {
    if (deltas.accountChanged) {
      console.log("📝 Case 4: Cash → Another Cash Account");

      // Delete old cash/bank ledger
      const deleteResult = await CashBankLedgerModel.deleteOne({
        transaction: original._id,
        transactionModel: transactionTypeToModelName(original.transactionType),
      }).session(session);

      result.cashBankDeleted = deleteResult.deletedCount > 0;
      console.log(`🗑️ Deleted old cash/bank ledger: ${result.cashBankDeleted}`);

      // Create new cash/bank ledger
      const cashBankAccount = await getCashBankAccountForPayment({
        paymentMode: "cash",
        companyId: updated.company,
        branchId: updated.branch,
        session,
      });

      result.cashBankLedger = await createCashBankLedgerEntry({
        transactionId: original._id,
        transactionType: updated.transactionType.toLowerCase(),
        transactionNumber: updated.transactionNumber,
        transactionDate: updated.transactionDate || original.transactionDate,
        accountId: updated.account,
        accountName: updated.accountName,
        amount: updated.netAmount,
        paymentMode: "cash",
        cashBankAccountId: cashBankAccount.accountId,
        cashBankAccountName: cashBankAccount.accountName,
        isCash: cashBankAccount.isCash,
        company: updated.company,
        branch: updated.branch,
        entryType: behavior.ledgerSide,
        narration: `${updated.transactionType} - ${updated.transactionNumber} (Edited to different cash account)`,
        createdBy: userId,
        session,
      });

      result.cashBankCreated = true;
      console.log(
        `✅ Created new cash/bank ledger: ${result.cashBankLedger._id}`
      );
    } else {
      // Same cash account, just update amount if changed
      console.log("📝 Case 4b: Same Cash Account, updating ledger");

      if (deltas.netAmountDelta !== 0) {
        const existingEntry = await CashBankLedgerModel.findOne({
          transaction: original._id,
          transactionModel: transactionTypeToModelName(
            original.transactionType
          ),
        }).session(session);

        if (existingEntry) {
          existingEntry.amount = updated.netAmount;
          existingEntry.updatedAt = new Date();
          await existingEntry.save({ session });
          result.cashBankLedger = existingEntry;
          console.log(`✅ Updated cash/bank ledger amount`);
        }
      }
    }
  }

  return result;
};
