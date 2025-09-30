import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
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
    const { searchTerm, companyId, branchId } = req.query;

    // Validate required query parameters
    if (!searchTerm || !companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "searchTerm, companyId, and branchId are required",
      });
    }

    // Call the static method on the Model (not instance)
    const accounts = await AccountMasterModel.searchAccounts(
      companyId,
      searchTerm,
      branchId,
      {} // Optional filters object
    );

    res.status(200).json({
      success: true,
      count: accounts.length,
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
