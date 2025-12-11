import CompanyModel from "../../model/masters/CompanyModel.js";
import mongoose from "mongoose";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import OutstandingModel from "../../model/OutstandingModel.js";
import {PaymentModel,ReceiptModel} from "../../model/FundTransactionMode.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import {PurchaseModel,SalesModel} from "../../model/TransactionModel.js";
import BranchModel from "../../model/masters/BranchModel.js";
import UserModel from "../../model/userModel.js"; // Import the UserModel
// ✅ Your existing createCompany function
export const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      companyType,
      registrationNumber,
      incorporationDate,
      permanentAddress,
      residentialAddress,
      email,
      numEmployees,
      notificationEmail,
      mobile,
      landline,
      gstNumber,
      panNumber,
      website,
      industry,
      status,
    } = req.body;

    // 1️⃣ Validate required fields
    if (!companyName || !email) {
      console.log("noteset");
      return res.status(400).json({ message: "Company name and email are required" });
    }

    // 2️⃣ Check if company already exists
    const existingCompany = await CompanyModel.findOne({ companyName: companyName });
    if (existingCompany) {
      return res.status(409).json({ message: "Company already exists" });
    }

    // 3️⃣ Prepare the new company object
    const newCompany = new CompanyModel({
      companyName,
      companyType,
      registrationNumber,
      incorporationDate,
      permanentAddress,
      residentialAddress,
      email,
      notificationEmail,
      mobile,
      landline,
      gstNumber,
      panNumber,
      website,
      industry,
      numEmployees,
      status: status || "Active",
    });

    // 4️⃣ Save to database
    const savedCompany = await newCompany.save();

    // 5️⃣ Return success response
    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: savedCompany,
    });
  } catch (error) {
    console.log("error", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create company",
    });
  }
};

// ✅ Your existing getallCompanies function
export const getallCompanies = async (req, res) => {
  try {
    const allcompanies = await CompanyModel.find({});
    return res.status(200).json({
      success: true,
      message: "Companies found",
      data: allcompanies,
    });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ✅ NEW: List companies with pagination and search
export const listCompanies = async (req, res) => {
  try {
    const { searchTerm = "", limit = 30, skip = 0 } = req.query;

    const query = searchTerm
      ? {
          $or: [
            { companyName: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { mobile: { $regex: searchTerm, $options: "i" } },
            { registrationNumber: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    const companies = await CompanyModel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalCount = await CompanyModel.countDocuments(query);
    const hasMore = parseInt(skip) + companies.length < totalCount;

    return res.status(200).json({
      success: true,
      data: companies,
      hasMore,
      totalCount,
      nextPage: hasMore ? parseInt(skip) + parseInt(limit) : null,
    });
  } catch (error) {
    console.error("Error listing companies:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch companies",
    });
  }
};

// ✅ NEW: Search companies
export const searchCompanies = async (req, res) => {
  try {
    const { searchTerm = "", limit = 25 } = req.query;

    const query = searchTerm
      ? {
          $or: [
            { companyName: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { mobile: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    const companies = await CompanyModel.find(query)
      .limit(parseInt(limit))
      .select("companyName email mobile status companyType")
      .lean();

    return res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Error searching companies:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search companies",
    });
  }
};

// ✅ NEW: Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await CompanyModel.findById(id).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch company",
    });
  }
};

// ✅ NEW: Update company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if company exists
    const company = await CompanyModel.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if updating to a name that already exists (excluding current company)
    if (updateData.companyName && updateData.companyName !== company.companyName) {
      const existingCompany = await CompanyModel.findOne({
        companyName: updateData.companyName,
        _id: { $ne: id },
      });

      if (existingCompany) {
        return res.status(409).json({
          success: false,
          message: "Company with this name already exists",
        });
      }
    }

    // Update company
    const updatedCompany = await CompanyModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update company",
    });
  }
};

// ✅ NEW: Delete company
const isCompanyReferenced = async (referencesToCheck, companyId) => {
  for (const ref of referencesToCheck) {
    const count = await ref.model.countDocuments({
      [ref.field]: companyId,
    });
    if (count > 0) {
      return true;
    }
  }
  return false;
};

export const deleteCompany = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;

    // Check if company exists
    const company = await CompanyModel.findById(id);
    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Collections and fields to check for company references
    const referencesToCheck = [
      { model: BranchModel, field: "companyId" },
      { model: AccountMasterModel, field: "company" },
      { model: ItemMasterModel, field: "company" },
      { model: ReceiptModel, field: "company" },
      { model: PaymentModel, field: "company" },
      { model: PurchaseModel, field: "company" },
      { model: SalesModel, field: "company" },
      { model: UserModel, field: "company" }, // If users are linked to companies
      // Add more models as needed
    ];

    // Check if company is referenced in any collection
    const inUse = await isCompanyReferenced(referencesToCheck, id);
    if (inUse) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Company is used in branches, accounts, transactions or other records and cannot be deleted.",
      });
    }

    // Delete the company
    const result = await CompanyModel.findByIdAndDelete(id, { session });
    if (!result) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Optionally: Delete related data if needed
    // await BranchModel.deleteMany({ company: id }, { session });
    // await AccountMasterModel.deleteMany({ company: id }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting company:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete company",
    });
  }
};