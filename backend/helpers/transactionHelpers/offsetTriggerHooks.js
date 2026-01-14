import mongoose from "mongoose";
import { applyOffset, reverseOffset } from "./offsetEngine.js";

/**
 * ============================================
 * AUTO-TRIGGER HOOKS FOR OFFSET
 * ============================================
 * 
 * Automatically applies/reverses offset when:
 * 1. Sale/Purchase created
 * 2. Sale/Purchase edited
 * 3. Receipt/Payment created
 * 4. Receipt/Payment deleted
 */

/**
 * Trigger offset after transaction creation
 * Call this AFTER Sale/Purchase is created (within same session)
 */
export const triggerOffsetAfterCreate = async (transaction, userId, session) => {
  try {
    // Only trigger for customer/supplier (not cash)
    if (transaction.accountType !== "customer" && transaction.accountType !== "supplier") {
      console.log("⏭️ Skipping offset (cash transaction)");
      return null;
    }

    console.log(`🔄 Triggering offset after ${transaction.transactionType} creation`);

    const result = await applyOffset({
      accountId: transaction.account,
      companyId: transaction.company,
      branchId: transaction.branch,
      userId,
      session,
    });

    return result;
  } catch (error) {
    console.error("❌ Offset trigger error (after create):", error);
    // Don't throw - offset failure shouldn't block transaction
    return null;
  }
};

/**
 * Trigger offset after transaction edit
 * Call this AFTER Sale/Purchase is edited (within same session)
 * 
 * Steps:
 * 1. Reverse any existing offset for this account
 * 2. Recalculate and apply new offset
 */
export const triggerOffsetAfterEdit = async (
  originalTransaction,
  updatedTransaction,
  userId,
  session
) => {
  try {
    // Only trigger for customer/supplier
    if (
      updatedTransaction.accountType !== "customer" &&
      updatedTransaction.accountType !== "supplier"
    ) {
      console.log("⏭️ Skipping offset (cash transaction)");
      return null;
    }

    console.log(`🔄 Triggering offset after ${updatedTransaction.transactionType} edit`);

    // Step 1: Reverse existing offsets for this account
    await reverseExistingOffsets({
      accountId: updatedTransaction.account,
      companyId: updatedTransaction.company,
      branchId: updatedTransaction.branch,
      userId,
      reason: "Transaction edited - recalculating offset",
      session,
    });

    // Step 2: Apply new offset
    const result = await applyOffset({
      accountId: updatedTransaction.account,
      companyId: updatedTransaction.company,
      branchId: updatedTransaction.branch,
      userId,
      session,
    });

    return result;
  } catch (error) {
    console.error("❌ Offset trigger error (after edit):", error);
    return null;
  }
};

/**
 * Trigger offset after Receipt/Payment creation
 * Call this AFTER Receipt/Payment is created (within same session)
 */
export const triggerOffsetAfterReceiptPayment = async (
  fundTransaction,
  userId,
  session
) => {
  try {
    console.log(
      `🔄 Triggering offset after ${fundTransaction.transactionType} creation`
    );

    const result = await applyOffset({
      accountId: fundTransaction.account,
      companyId: fundTransaction.company,
      branchId: fundTransaction.branch,
      userId,
      session,
    });

    return result;
  } catch (error) {
    console.error("❌ Offset trigger error (after receipt/payment):", error);
    return null;
  }
};

/**
 * Trigger offset after Receipt/Payment deletion
 * Call this AFTER Receipt/Payment is deleted (within same session)
 */
export const triggerOffsetAfterReceiptPaymentDelete = async (
  fundTransaction,
  userId,
  session
) => {
  try {
    console.log(
      `🔄 Triggering offset after ${fundTransaction.transactionType} deletion`
    );

    // Reverse existing offsets and recalculate
    await reverseExistingOffsets({
      accountId: fundTransaction.account,
      companyId: fundTransaction.company,
      branchId: fundTransaction.branch,
      userId,
      reason: "Receipt/Payment deleted - recalculating offset",
      session,
    });

    const result = await applyOffset({
      accountId: fundTransaction.account,
      companyId: fundTransaction.company,
      branchId: fundTransaction.branch,
      userId,
      session,
    });

    return result;
  } catch (error) {
    console.error("❌ Offset trigger error (after receipt/payment delete):", error);
    return null;
  }
};

/**
 * Reverse all active offsets for an account
 * Used before recalculating offset
 */
const reverseExistingOffsets = async ({
  accountId,
  companyId,
  branchId,
  userId,
  reason,
  session,
}) => {
  const OutstandingOffset = mongoose.model("OutstandingOffset");

  // Find all active offsets for this account
  const activeOffsets = await OutstandingOffset.find({
    company: companyId,
    branch: branchId,
    account: accountId,
    status: "active",
  }).session(session);

  console.log(`🔄 Reversing ${activeOffsets.length} active offsets`);

  // Reverse each offset
  for (const offset of activeOffsets) {
    await reverseOffset(offset._id, userId, reason, session);
  }

  return activeOffsets.length;
};

/**
 * ============================================
 * INTEGRATION GUIDE
 * ============================================
 * 
 * 1. AFTER SALE/PURCHASE CREATION:
 * 
 *    // In your processTransaction function
 *    const result = await processTransaction(transactionData, userId, session);
 *    
 *    // Add this line:
 *    await triggerOffsetAfterCreate(result.transaction, userId, session);
 * 
 * 
 * 2. AFTER SALE/PURCHASE EDIT:
 * 
 *    // In your updateTransaction function
 *    const updated = await updateTransaction(originalTxn, editedData, userId, session);
 *    
 *    // Add this line:
 *    await triggerOffsetAfterEdit(originalTxn, updated, userId, session);
 * 
 * 
 * 3. AFTER RECEIPT/PAYMENT CREATION:
 * 
 *    // In your createFundTransaction function
 *    const receipt = await createFundTransaction(data, session);
 *    
 *    // Add this line:
 *    await triggerOffsetAfterReceiptPayment(receipt.transaction, userId, session);
 * 
 * 
 * 4. AFTER RECEIPT/PAYMENT DELETION:
 * 
 *    // In your deleteFundTransaction function
 *    const deleted = await deleteFundTransaction(receiptId, userId, session);
 *    
 *    // Add this line:
 *    await triggerOffsetAfterReceiptPaymentDelete(deleted, userId, session);
 */
