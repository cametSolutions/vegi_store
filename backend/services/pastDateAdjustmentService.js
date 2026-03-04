import AdjustmentEntryModel from "../model/AdjustmentEntryModel.js";
import { transactionTypeToModelName } from "../helpers/transactionHelpers/transactionMappers.js";

const formatDateKey = (date) => {
  const txDate = new Date(date);
  const year = txDate.getFullYear();
  const month = String(txDate.getMonth() + 1).padStart(2, "0");
  const day = String(txDate.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const generatePastDateAdjustmentNumber = async (
  company,
  branch,
  transactionDate,
  session,
) => {
  const dateKey = formatDateKey(transactionDate);
  const prefix = `ADJ-${dateKey}`;

  let query = AdjustmentEntryModel.findOne({
    company,
    branch,
    adjustmentNumber: { $regex: new RegExp(`^${prefix}-\\d+$`) },
  })
    .sort({ adjustmentNumber: -1 })
    .select("adjustmentNumber")
    .lean();

  if (session) {
    query = query.session(session);
  }

  const lastEntry = await query;

  const lastSequence = lastEntry?.adjustmentNumber
    ? parseInt(lastEntry.adjustmentNumber.split("-").pop(), 10)
    : 0;
  const nextSequence = String(lastSequence + 1).padStart(4, "0");

  return `${prefix}-${nextSequence}`;
};

export const createPastDateAdjustmentEntry = async (
  createdTransaction,
  userId,
  session,
  isFundTns=false,
) => {
  const adjustmentNumber = await generatePastDateAdjustmentNumber(
    createdTransaction.company,
    createdTransaction.branch,
    createdTransaction.transactionDate,
    session,
  );

  const itemAdjustments = (createdTransaction.items || []).map((item) => ({
    item: item.item,
    itemName: item.itemName,
    itemCode: item.itemCode,
    adjustmentType: "added",
    oldQuantity: 0,
    newQuantity: item.quantity,
    quantityDelta: item.quantity,
    oldRate: 0,
    newRate: item.rate,
    rateDelta: item.rate,
  }));

  const payload = [
    {
      company: createdTransaction.company,
      branch: createdTransaction.branch,
      originalTransaction: createdTransaction._id,
      originalTransactionModel: transactionTypeToModelName(
        createdTransaction.transactionType,
      ),
      originalTransactionNumber: createdTransaction.transactionNumber,
      originalTransactionDate: createdTransaction.transactionDate,
      newTransactionDate: null,
      affectedAccount: createdTransaction.account,
      affectedAccountName: createdTransaction.accountName,
      adjustmentNumber,
      adjustmentDate: new Date(),
      adjustmentType: "item_change",
      adjustmentPurpose: "standalone",
      amountDelta: isFundTns ? createdTransaction.amount : createdTransaction.netAmount,
      oldAmount: 0,
      newAmount: isFundTns ? createdTransaction.amount : createdTransaction.netAmount,
      itemAdjustments,
      reason: "Transaction created on past date",
      editedBy: userId,
      isSystemGenerated: true,
      status: "active",
    },
  ];

  const options = session ? { session } : {};
  const [adjustmentEntry] = await AdjustmentEntryModel.create(payload, options);

  console.log("Created adjustment entry:", adjustmentEntry);
  

  return adjustmentEntry;
};
