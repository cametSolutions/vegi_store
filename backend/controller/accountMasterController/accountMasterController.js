import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import OutstandingModel from "../../model/OutstandingModel.js";
import { PaymentModel, ReceiptModel } from "../../model/FundTransactionMode.js";
import { PurchaseModel, SalesModel } from "../../model/TransactionModel.js";
import mongoose from "mongoose";
import { isMasterReferenced } from "../../helpers/MasterHelpers/masterHelper.js";

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

export const deleteAccountMaster = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const accountId = req.params.id;

    // Collections and fields to check
    const referencesToCheck = [
      { model: ReceiptModel, field: "account" },
      { model: PaymentModel, field: "account" },
      { model: PurchaseModel, field: "account" },
      { model: SalesModel, field: "account" },
      // More if needed
    ];

    const inUse = await isMasterReferenced(referencesToCheck, accountId);
    if (inUse) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Account is used in transactions and cannot be deleted.",
      });
    }

    const result = await AccountMasterModel.findByIdAndDelete(accountId, {
      session,
    });
    if (!result) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Account not found" });
    }

    // Delete opening outstanding
    await OutstandingModel.findOneAndDelete(
      { account: accountId, transactionType: "opening_balance" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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

    if (!searchTerm || !companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "searchTerm, companyId, branchId are required",
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
        .populate("priceLevel", "priceLevelName")
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

export const getAccountsWithOutstanding = async (req, res) => {
  try {
    const {
      searchTerm = "",
      companyId,
      branchId,
      accountType, // 'customer' or 'supplier'
      limit = 20,
      page = 1,
    } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "companyId is required" });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // =========================================================
    // 1. Base Filter (Applied to AccountMaster)
    // =========================================================
    const matchStage = {
      company: companyObjectId,
  
      // status: { $ne: "inactive" },
      // Restrict to only customer/supplier as requested
      accountType: { $in: ["customer", "supplier"] },
    };

    if (branchId) {
      matchStage.branches = new mongoose.Types.ObjectId(branchId);
    }

    if (accountType) {
      matchStage.accountType = accountType;
    }

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      matchStage.$or = [
        { accountName: searchRegex },
        { phoneNo: searchRegex },
        { email: searchRegex },
      ];
    }


    

    // =========================================================
    // 2. Data Pipeline (Fetches the paginated list)
    // =========================================================
    const dataPipeline = [
      { $match: matchStage },
      { $sort: { accountName: 1 } },
      { $skip: skip },
      { $limit: limitNum },
      // Lookup Outstandings for these specific visible accounts
      {
        $lookup: {
          from: "outstandings",
          let: { accountId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$account", "$$accountId"] },
                    { $eq: ["$company", companyObjectId] },
                    { $ne: ["$status", "paid"] }, // Exclude paid (0 balance)
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                netBalance: { $sum: "$closingBalanceAmount" },
                // DR is positive in your schema
                totalDr: {
                  $sum: {
                    $cond: [
                      { $gt: ["$closingBalanceAmount", 0] },
                      "$closingBalanceAmount",
                      0,
                    ],
                  },
                },
                // CR is negative in your schema
                totalCr: {
                  $sum: {
                    $cond: [
                      { $lt: ["$closingBalanceAmount", 0] },
                      "$closingBalanceAmount",
                      0,
                    ],
                  },
                },
                txCount: { $sum: 1 },
              },
            },
          ],
          as: "outstandingStats",
        },
      },
      // Flatten the lookup array
      {
        $addFields: {
          stats: { $arrayElemAt: ["$outstandingStats", 0] },
        },
      },
      // Format the fields exactly as per JSON requirement
      {
        $project: {
          partyId: "$_id",
          partyName: "$accountName",
          partyEmail: { $ifNull: ["$email", ""] },
          partyPhone: { $ifNull: ["$phoneNo", ""] },
          partyType: "$accountType",

          // Helper fields for calculation
          rawNet: { $ifNull: ["$stats.netBalance", 0] },
          rawDr: { $ifNull: ["$stats.totalDr", 0] },
          rawCr: { $ifNull: ["$stats.totalCr", 0] },
          transactionCount: { $ifNull: ["$stats.txCount", 0] },
        },
      },
      {
        $addFields: {
          // Logic: Net > 0 = Receivable, Net < 0 = Payable
          netPositionType: {
            $cond: {
              if: { $gte: ["$rawNet", 0] },
              then: "receivable",
              else: "payable",
            },
          },
          totalOutstanding: { $abs: "$rawNet" },
          totalDr: { $abs: "$rawDr" },
          totalCr: { $abs: "$rawCr" },

          // If party is customer, their total outstanding goes to 'customerOutstanding'
          customerOutstanding: {
            $cond: {
              if: { $eq: ["$partyType", "customer"] },
              then: { $abs: "$rawNet" },
              else: 0,
            },
          },
          // If party is supplier, their total outstanding goes to 'supplierOutstanding'
          supplierOutstanding: {
            $cond: {
              if: { $eq: ["$partyType", "supplier"] },
              then: { $abs: "$rawNet" },
              else: 0,
            },
          },

          customerTransactionCount: {
            $cond: {
              if: { $eq: ["$partyType", "customer"] },
              then: "$transactionCount",
              else: 0,
            },
          },
          supplierTransactionCount: {
            $cond: {
              if: { $eq: ["$partyType", "supplier"] },
              then: "$transactionCount",
              else: 0,
            },
          },

          netOutstanding: { $abs: "$rawNet" }, // Assuming display value is absolute
        },
      },
      {
        $project: {
          rawNet: 0,
          rawDr: 0,
          rawCr: 0,
          stats: 0, // Cleanup
        },
      },
    ];

    // =========================================================
    // 3. Summary Pipeline (Aggregates totals for ALL matching parties)
    // =========================================================
    // Note: Calculating financial totals for a search result can be heavy.
    // We use a separate aggregation for clarity and maintaining the "data" structure.

    const summaryPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "outstandings",
          let: { accountId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$account", "$$accountId"] },
                    { $eq: ["$company", companyObjectId] },
                    { $ne: ["$status", "paid"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                netBalance: { $sum: "$closingBalanceAmount" },
                totalDr: {
                  $sum: {
                    $cond: [
                      { $gt: ["$closingBalanceAmount", 0] },
                      "$closingBalanceAmount",
                      0,
                    ],
                  },
                },
                totalCr: {
                  $sum: {
                    $cond: [
                      { $lt: ["$closingBalanceAmount", 0] },
                      "$closingBalanceAmount",
                      0,
                    ],
                  },
                },
                txCount: { $sum: 1 },
              },
            },
          ],
          as: "accountBalance",
        },
      },
      {
        $unwind: { path: "$accountBalance", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: null,
          totalParties: { $sum: 1 },
          customersOnly: {
            $sum: { $cond: [{ $eq: ["$accountType", "customer"] }, 1, 0] },
          },
          suppliersOnly: {
            $sum: { $cond: [{ $eq: ["$accountType", "supplier"] }, 1, 0] },
          },
          partiesWithBothTypes: { $sum: 0 }, // Logic for 'Both' would require complex checking of Outstanding types vs Account types

          totalNetOutstanding: {
            $sum: { $ifNull: ["$accountBalance.netBalance", 0] },
          },
          totalDrAmount: { $sum: { $ifNull: ["$accountBalance.totalDr", 0] } },
          totalCrAmount: { $sum: { $ifNull: ["$accountBalance.totalCr", 0] } }, // Will sum negative numbers
          totalTransactions: {
            $sum: { $ifNull: ["$accountBalance.txCount", 0] },
          },
        },
      },
    ];

    // =========================================================
    // 4. Execution
    // =========================================================
    const [parties, summaryResult] = await Promise.all([
      AccountMasterModel.aggregate(dataPipeline),
      AccountMasterModel.aggregate(summaryPipeline),
    ]);


 
    

    const summaryData = summaryResult[0] || {
      totalParties: 0,
      customersOnly: 0,
      suppliersOnly: 0,
      partiesWithBothTypes: 0,
      totalNetOutstanding: 0,
      totalDrAmount: 0,
      totalCrAmount: 0,
      totalTransactions: 0,
    };

    // Construct final response
    const finalResponse = {
      success: true,
      data: {
        parties,
        summary: {
          totalParties: summaryData.totalParties,
          currentPage: pageNum,
          totalPages: Math.ceil(summaryData.totalParties / limitNum) || 1,
          pageSize: limitNum,

          partiesWithBothTypes: summaryData.partiesWithBothTypes,
          customersOnly: summaryData.customersOnly,
          suppliersOnly: summaryData.suppliersOnly,

          // Financial Totals
          totalNetOutstanding: Math.abs(summaryData.totalNetOutstanding),
          totalReceivables: Math.abs(summaryData.totalDrAmount), // Sum of all positive
          totalPayables: Math.abs(summaryData.totalCrAmount), // Sum of all negative (displayed as absolute)

          totalDrAmount: Math.abs(summaryData.totalDrAmount),
          totalCrAmount: Math.abs(summaryData.totalCrAmount),
          totalTransactions: summaryData.totalTransactions,
        },
      },
    };

    res.json(finalResponse);
  } catch (error) {
    console.error("Error fetching party list:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
