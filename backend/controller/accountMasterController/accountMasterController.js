import AccountMasterModel from "../../model/masters/AccountMasterModel.js";

export const createAccountMaster = async (req, res) => {
  try {
    const {
      companyId,
      branchId,
      accountName,
      accountType,
      address,
      openingBalance,
      openingBalanceType,
      phoneNo,
      pricelevel,
    } = req.body;

    if (!companyId || !branchId) {
      return res
        .status(400)
        .json({ message: "Companyid or branchid is missing" });
    }
    const existingAccountholder = await AccountMasterModel.findOne({
      companyId,
      branchId,
      accountName,
    });
    if (existingAccountholder) {
      return res.status(409).json({
        message: "This account holder is already registered in the same branch",
      });
    }
    const newAccntholder = new AccountMasterModel({
      companyId,
      branchId,
      accountName,
      accountType,
      address,
      phoneNo,
      pricelevel,
      openingBalance,
      openingBalanceType,
    });
    const savedholder = await newAccntholder.save();
    if (savedholder) {
      const newholderlist = await AccountMasterModel.find({}).populate({
        path: "pricelevel",
        select: "_id priceLevelName",
      });
      res.status(201).json({
        message: "Account holder created succesfully",
        data: newholderlist,
      });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getallaccountHolder = async (req, res) => {
  try {
    const result = await AccountMasterModel.find({}).populate({
      path: "pricelevel",
      select: "_id priceLevelName",
    });
    return res
      .status(201)
      .json({ message: "account holders found", data: result });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAccntmaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, branchId } = req.query;
    if (!id) {
      return res.status(400).json({ message: "Account holder ID is required" });
    }

    // Build query object
    const query = { _id: id };
    if (companyId) query.companyId = companyId;
    if (branchId) query.branchId = branchId;

    // Find and delete the account holder
    const deletedAccount = await AccountMasterModel.findOneAndDelete(query);

    if (!deletedAccount) {
      return res.status(404).json({
        message: "No account holder found matching the given criteria",
      });
    } else {
      const updatedaccntholder = await AccountMasterModel.find({
        companyId,
        branchId,
      });
      return res.status(200).json({
        message: "Account holder deleted successfully",
        data: updatedaccntholder,
      });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const updateAccntMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, branchId } = req.query;
    const updateData = req.body;
    if (!id) {
      return res.status(400).json({ message: "Account id is required" });
    }
    const filter = { _id: id };
    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;
    const updatedAccnt = await AccountMasterModel.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedAccnt) {
      return res
        .status(404)
        .json({ message: "Account holder not found for update" });
    } else {
      const updatedholerlist = await AccountMasterModel.find({}).populate({
        path: "pricelevel",
        select: "priceLevel",
      });

      return res.status(200).json({
        message: "Account holder updated successfully",
        data: [updatedholerlist],
      });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

////
// controllers/accountMasterController.js
export const searchAccounts = async (req, res) => {
  try {
    const {
      searchTerm,
      companyId,
      branchId,
      accountType,
      limit = 25, // Default to 25 results
      offset = 0, // For potential future pagination
    } = req.query;

    // Validate required query parameters
    if (!searchTerm || !companyId || !branchId || !accountType) {
      return res.status(400).json({
        success: false,
        message: "searchTerm, companyId, branchId and accountType are required",
      });
    }

    // Parse limit to integer and cap it
    const parsedLimit = Math.min(parseInt(limit) || 25, 50); // Max 50
    const parsedOffset = parseInt(offset) || 0;

    // Call the model method with pagination
    const result = await AccountMasterModel.searchAccounts(
      companyId,
      searchTerm,
      branchId,
      accountType,
      {}, // Optional filters
      parsedLimit,
      parsedOffset
    );

    // Get total count for informational purposes
    const totalCount = result?.totalCount || result?.accounts?.length;
    const accounts = result?.accounts || result;

    res.status(200).json({
      success: true,
      count: accounts?.length || 0,
      totalCount: totalCount, // Total matching records
      hasMore: totalCount > parsedOffset + accounts?.length, // Are there more results?
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
