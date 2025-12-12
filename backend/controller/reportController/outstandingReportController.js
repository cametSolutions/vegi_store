import mongoose from "mongoose";
import Outstanding from "../../model/OutstandingModel.js";

export const getOutstandingReport = async (req, res) => {
  try {
    const {
      companyId,
      branchId,
      accountId,
      accountType,
      outstandingType,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 200,
    } = req.query;

    // Build match conditions
    const matchConditions = {};

    if (companyId) matchConditions.company =new  mongoose.Types.ObjectId(companyId);
    if (branchId) matchConditions.branch =new  mongoose.Types.ObjectId(branchId);
    if (accountId) matchConditions.account = new mongoose.Types.ObjectId(accountId);
    if (accountType) matchConditions.accountType = accountType;
    if (outstandingType) matchConditions.outstandingType = outstandingType;
    if (status) matchConditions.status = status;

    // Date range filter
    if (startDate || endDate) {
      matchConditions.transactionDate = {};
      if (startDate) matchConditions.transactionDate.$gte = new Date(startDate);
      if (endDate) matchConditions.transactionDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query with sorting by account first, then by transaction date
    const outstandingData = await Outstanding.find(matchConditions)
      .populate("account", "accountName phoneNo")
      .populate("branch", "name")
      .sort({ account: 1, transactionDate: -1 }) // Sort by account first, then by date
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Outstanding.countDocuments(matchConditions);

    // Format the response
    const formattedData = outstandingData.map((item) => ({
      _id: item._id,
      accountName: item.accountName,
      accountPhone: item.account?.phoneNo || "",
      accountType: item.accountType,
      branchName: item.branch?.name || "",
      transactionType: item.transactionType,
      transactionNumber: item.transactionNumber,
      transactionDate: item.transactionDate,
      outstandingType: item.outstandingType,
      totalAmount: item.totalAmount,
      paidAmount: item.paidAmount,
      closingBalanceAmount: item.closingBalanceAmount,
      dueDate: item.dueDate,
      status: item.status,
      isOverdue: new Date() > item.dueDate && item.closingBalanceAmount !== 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalRecords: totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching outstanding report:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching outstanding report",
      error: error.message,
    });
  }
};

// Get outstanding summary
export const getOutstandingSummary = async (req, res) => {
  try {
    const { companyId, branchId, accountType } = req.query;

    const matchConditions = { status: { $ne: "paid" } };
    if (companyId) matchConditions.company =new mongoose.Types.ObjectId(companyId);
    if (branchId) matchConditions.branch = new mongoose.Types.ObjectId(branchId);
    if (accountType) matchConditions.accountType = accountType;

    const summary = await Outstanding.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$outstandingType",
          totalOutstanding: { $sum: "$closingBalanceAmount" },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          count: { $sum: 1 },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$closingBalanceAmount", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$closingBalanceAmount", 0] },
                  ],
                },
                "$closingBalanceAmount",
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching outstanding summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching outstanding summary",
      error: error.message,
    });
  }
};
