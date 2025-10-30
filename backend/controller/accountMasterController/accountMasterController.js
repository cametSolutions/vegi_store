import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import mongoose from "mongoose";

export const createAccountMaster = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const data = req.body;

    const account = new AccountMasterModel(data);
    await account.save({ session });

    await account.createOrUpdateOpeningOutstanding(session, req);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(account);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[1];
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({ message: err.message });
  }
};

export const updateAccountMaster = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const accountId = req.params.id;
    const data = { ...req.body };

    if (data.openingBalanceType === "cr") {
      data.openingBalance = data.openingBalance * -1;
    }

    const account = await AccountMasterModel.findByIdAndUpdate(
      accountId,
      data,
      {
        new: true,
        session,
      }
    );
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Account not found" });
    }

    /// we omitted it because we are not updating opening outstanding ,we had restricted it
    // await account.createOrUpdateOpeningOutstanding(session);

    await session.commitTransaction();
    session.endSession();

    res.json(account);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[1];
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({ message: err.message });
  }
};

// (Optional) For delete, consider deleting opening outstanding if needed

export const deleteAccountMaster = async (req, res) => {
  try {
    const accountId = req.params.id;
    const result = await AccountMasterModel.findByIdAndDelete(accountId);
    if (!result) return res.status(404).json({ message: "Account not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchAccounts = async (req, res) => {
  try {
    const {
      searchTerm,
      companyId,
      branchId,
      accountType,
      limit = 25,
      offset = 0,
      withOutstanding, // boolean: true/false
    } = req.query;

    if (!searchTerm || !companyId || !branchId || !accountType) {
      return res.status(400).json({
        success: false,
        message:
          "searchTerm, companyId, branchId, and accountType are required",
      });
    }

    const parsedLimit = Math.min(parseInt(limit) || 25, 50);
    const parsedOffset = parseInt(offset) || 0;

    // Build filters object
    const filters = {};
    if (withOutstanding !== undefined) {
      filters.withOutstanding = withOutstanding === "true";
    }

    const result = await AccountMasterModel.searchAccounts(
      companyId,
      searchTerm,
      branchId,
      accountType,
      filters,
      parsedLimit,
      parsedOffset
    );

    const totalCount = result?.totalCount || 0;
    const accounts = result?.accounts || [];

    res.status(200).json({
      success: true,
      count: accounts.length,
      totalCount,
      hasMore: totalCount > parsedOffset + accounts.length,
      data: accounts,
    });
  } catch (error) {
    console.error("❌ Search Accounts Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching accounts",
      error: error.message,
    });
  }
};

export const getAccountsList = async (req, res) => {
  try {
    const {
      searchTerm = "",
      companyId,
      branchId = null,
      accountType = null,
      limit = 25,
      skip = 0,
    } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    let filter = { company: companyId };

    if (branchId) {
      filter.branches = branchId;
    }
    if (accountType) {
      filter.accountType = accountType;
    }

    if (searchTerm) {
      filter.$or = [
        { accountName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const queryLimit = parseInt(limit) || 25;
    const querySkip = parseInt(skip) || 0;

    const [accounts, totalCount] = await Promise.all([
      AccountMasterModel.find(filter)
        .sort({ accountName: 1 })
        .skip(querySkip)
        .limit(queryLimit)
        .lean()
        .exec(),
      AccountMasterModel.countDocuments(filter),
    ]);

    // Calculate hasMore
    const hasMore = querySkip + queryLimit < totalCount;

    res.json({ data: accounts, totalCount, hasMore });
  } catch (error) {
    console.error("Error fetching account list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
