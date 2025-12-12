import {SalesModel} from "../../model/TransactionModel.js";
export const getSalesSummary = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      search = "",
    } = req.query;

    // Build query
    const query = {
      company: companyId,
      branch: branchId,
      transactionType: "sale", // Filter only sales transactions
    };

    // Date filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = endDateTime;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: "i" } },
        { accountName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch sales with pagination
    const sales = await SalesModel.find(query)
      .select(
        "transactionNumber transactionDate accountName phone email netAmount totalAmountAfterTax status paymentStatus"
      )
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count
    const totalRecords = await SalesModel.countDocuments(query);

    // Calculate total amount
    const totalAmountResult = await SalesModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$netAmount" },
        },
      },
    ]);

    const totalAmount = totalAmountResult[0]?.totalAmount || 0;

    return res.status(200).json({
      success: true,
      data: {
        sales,
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit)),
        currentPage: Number(page),
        pageSize: Number(limit),
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sales summary",
    });
  }
};
