import AccountMasterModel from "../../model/masters/AccountMasterModel.js";

export const getallaccountHolder = async (req, res) => {
  try {
    const {
      companyId,
      branchId,
      page = 1,
      limit = 25,
      searchTerm = "",
      filterType = "",
    } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const query = { companyId };

    if (branchId) {
      query.branchId = branchId;
    }

    if (filterType) {
      query.accountType = filterType;
    }

    if (searchTerm) {
      query.$or = [
        { accountName: { $regex: searchTerm, $options: "i" } },
        { phoneNo: { $regex: searchTerm, $options: "i" } },
        { address: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await AccountMaster.countDocuments(query);

    const accounts = await AccountMaster.find(query)
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;

    res.json({
      data: accounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNextPage,
        nextPage: hasNextPage ? parseInt(page) + 1 : null,
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET account by ID
export const getAccountMasterById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await AccountMaster.findById(id)
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ data: account });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CREATE new account
export const createAccountMaster = async (req, res) => {
  try {
    const {
      accountName,
      accountType,
      pricelevel,
      openingBalance,
      openingBalanceType,
      address,
      phoneNo,
      companyId,
      branchId,
    } = req.body;

    // Validation
    if (!accountName || !accountType || !pricelevel || !companyId || !branchId) {
      return res.status(400).json({
        message: "Required fields: accountName, accountType, pricelevel, companyId, branchId",
      });
    }

    // Check if price level exists
    const priceLevelExists = await PriceLevel.findById(pricelevel);
    if (!priceLevelExists) {
      return res.status(404).json({ message: "Price level not found" });
    }

    // Create account
    const newAccount = new AccountMaster({
      accountName: accountName.trim(),
      accountType,
      pricelevel,
      openingBalance: openingBalance || 0,
      openingBalanceType: openingBalanceType || "",
      address: address?.trim() || "",
      phoneNo: phoneNo?.trim() || "",
      companyId,
      branchId,
    });

    await newAccount.save();

    // Populate and return
    const populatedAccount = await AccountMaster.findById(newAccount._id)
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name");

    res.status(201).json({
      message: "Account created successfully",
      data: populatedAccount,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE account
export const updateAccntMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!updateData.accountName || !updateData.accountType || !updateData.pricelevel) {
      return res.status(400).json({
        message: "Required fields: accountName, accountType, pricelevel",
      });
    }

    if (updateData.accountName) updateData.accountName = updateData.accountName.trim();
    if (updateData.address) updateData.address = updateData.address.trim();
    if (updateData.phoneNo) updateData.phoneNo = updateData.phoneNo.trim();

    const updatedAccount = await AccountMaster.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name");

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({
      message: "Account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE account
export const deleteAccntmaster = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAccount = await AccountMaster.findByIdAndDelete(id);

    if (!deletedAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({
      message: "Account deleted successfully",
      data: deletedAccount,
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET accounts by branch
export const getAccountMastersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const accounts = await AccountMaster.find({ branchId })
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name")
      .sort({ createdAt: -1 });

    res.json({ data: accounts });
  } catch (error) {
    console.error("Error fetching accounts by branch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET accounts by company
export const getAccountMastersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const accounts = await AccountMaster.find({ companyId })
      .populate("pricelevel", "priceLevelName")
      .populate("branchId", "branchName name")
      .sort({ createdAt: -1 });

    res.json({ data: accounts });
  } catch (error) {
    console.error("Error fetching accounts by company:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
