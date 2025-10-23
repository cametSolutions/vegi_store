import mongoose from "mongoose";
import PricelevelModel from "../../model/masters/PricelevelModel.js";
import { sleep } from "../../../shared/utils/delay.js";

// ==================== CREATE PRICE LEVEL ====================
export const createPriceLevel = async (req, res) => {
  try {
    const { priceLevelName, description, status, company, branches } = req.body;

    // Validation
    if (!priceLevelName || !company) {
      return res.status(400).json({ 
        message: "Price level name and company are required" 
      });
    }

    // Check if price level name already exists for this company
    const existingPriceLevel = await PricelevelModel.findOne({
      company: new mongoose.Types.ObjectId(company),
      priceLevelName: { $regex: new RegExp(`^${priceLevelName}$`, 'i') }
    });

    if (existingPriceLevel) {
      return res.status(409).json({ 
        message: "Price level with this name already exists" 
      });
    }

    // Create new price level
    const newPriceLevel = new PricelevelModel({
      priceLevelName: priceLevelName.trim(),
      description: description?.trim(),
      status: status || 'active',
      company: new mongoose.Types.ObjectId(company),
      branches: branches?.map(id => new mongoose.Types.ObjectId(id)) || []
    });

    await newPriceLevel.save();

    // Populate and return
    const populatedPriceLevel = await PricelevelModel.findById(newPriceLevel._id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    return res.status(201).json({ 
      message: "Price level created successfully", 
      data: populatedPriceLevel 
    });

  } catch (error) {
    console.error("Create price level error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== GET ALL PRICE LEVELS (WITH PAGINATION) ====================
export const getAllPriceLevels = async (req, res) => {
  try {
    const { 
      companyId, 
      branchId, 
      search = "", 
      status,
      page = 1, 
      limit = 25,
      sortBy = 'priceLevelName',
      sortOrder = 'asc'
    } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    // Build query
    const query = {
      company: new mongoose.Types.ObjectId(companyId)
    };

    // Filter by branch if provided
    if (branchId) {
      query.branches = new mongoose.Types.ObjectId(branchId);
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { priceLevelName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [data, totalCount] = await Promise.all([
      PricelevelModel.find(query)
        .populate('company', 'companyName')
        .populate('branches', 'branchName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PricelevelModel.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      message: "Price levels retrieved successfully",
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null
      }
    });

  } catch (error) {
    console.error("Get all price levels error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== GET PRICE LEVEL BY ID ====================
export const getPriceLevelById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    const priceLevel = await PricelevelModel.findById(id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    return res.status(200).json({ 
      message: "Price level found", 
      data: priceLevel 
    });

  } catch (error) {
    console.error("Get price level by ID error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== UPDATE PRICE LEVEL ====================
export const updatePriceLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { priceLevelName, description, status, branches } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    // Find existing price level
    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    // Check if name is being changed and if it already exists
    if (priceLevelName && priceLevelName !== priceLevel.priceLevelName) {
      const existingPriceLevel = await PricelevelModel.findOne({
        _id: { $ne: id },
        company: priceLevel.company,
        priceLevelName: { $regex: new RegExp(`^${priceLevelName}$`, 'i') }
      });

      if (existingPriceLevel) {
        return res.status(409).json({ 
          message: "Price level with this name already exists" 
        });
      }
    }

    // Update fields
    if (priceLevelName) priceLevel.priceLevelName = priceLevelName.trim();
    if (description !== undefined) priceLevel.description = description?.trim();
    if (status) priceLevel.status = status;
    if (branches) {
      priceLevel.branches = branches.map(id => new mongoose.Types.ObjectId(id));
    }

    await priceLevel.save();

    // Populate and return
    const updatedPriceLevel = await PricelevelModel.findById(id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    return res.status(200).json({ 
      message: "Price level updated successfully", 
      data: updatedPriceLevel 
    });

  } catch (error) {
    console.error("Update price level error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== DELETE PRICE LEVEL ====================
export const deletePriceLevel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    // Check if can be deleted (using the schema method)
    const canDelete = await priceLevel.canBeDeleted();
    
    if (!canDelete.canDelete) {
      return res.status(400).json({ 
        message: canDelete.reason,
        canDelete: false 
      });
    }

    await PricelevelModel.findByIdAndDelete(id);

    return res.status(200).json({ 
      message: "Price level deleted successfully",
      data: { id }
    });

  } catch (error) {
    console.error("Delete price level error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== GET ACTIVE PRICE LEVELS ====================
export const getActivePriceLevels = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const priceLevels = await PricelevelModel.getActivePriceLevels(companyId);

    return res.status(200).json({ 
      message: "Active price levels retrieved successfully", 
      data: priceLevels 
    });

  } catch (error) {
    console.error("Get active price levels error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== GET PRICE LEVELS BY BRANCH ====================
export const getPriceLevelsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid branch ID" });
    }

    const priceLevels = await PricelevelModel.getPriceLevelsByBranch(branchId);

    return res.status(200).json({ 
      message: "Price levels retrieved successfully", 
      data: priceLevels 
    });

  } catch (error) {
    console.error("Get price levels by branch error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== GET UNALLOCATED PRICE LEVELS ====================
export const getUnallocatedPriceLevels = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const priceLevels = await PricelevelModel.getUnallocatedPriceLevels(companyId);

    return res.status(200).json({ 
      message: "Unallocated price levels retrieved successfully", 
      data: priceLevels 
    });

  } catch (error) {
    console.error("Get unallocated price levels error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== ALLOCATE TO BRANCHES ====================
export const allocateToBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: "Branch IDs are required" });
    }

    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    await priceLevel.allocateToBranches(branchIds);

    const updatedPriceLevel = await PricelevelModel.findById(id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    return res.status(200).json({ 
      message: "Branches allocated successfully", 
      data: updatedPriceLevel 
    });

  } catch (error) {
    console.error("Allocate to branches error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== REMOVE FROM BRANCHES ====================
export const removeFromBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: "Branch IDs are required" });
    }

    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    await priceLevel.removeFromBranches(branchIds);

    const updatedPriceLevel = await PricelevelModel.findById(id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    return res.status(200).json({ 
      message: "Branches removed successfully", 
      data: updatedPriceLevel 
    });

  } catch (error) {
    console.error("Remove from branches error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== UPDATE STATUS ====================
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (active/inactive)" });
    }

    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    await priceLevel.updateStatus(status);

    const updatedPriceLevel = await PricelevelModel.findById(id)
      .populate('company', 'companyName')
      .populate('branches', 'branchName');

    return res.status(200).json({ 
      message: "Status updated successfully", 
      data: updatedPriceLevel 
    });

  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ==================== CHECK IF CAN BE DELETED ====================
export const checkCanBeDeleted = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid price level ID" });
    }

    const priceLevel = await PricelevelModel.findById(id);
    
    if (!priceLevel) {
      return res.status(404).json({ message: "Price level not found" });
    }

    const result = await priceLevel.canBeDeleted();

    return res.status(200).json({ 
      message: "Check completed", 
      data: result 
    });

  } catch (error) {
    console.error("Check can be deleted error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};