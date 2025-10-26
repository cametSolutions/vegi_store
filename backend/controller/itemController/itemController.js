import ItemMasterModel from "../../model/masters/ItemMasterModel.js";

export const create = async (req, res) => {
  try {
    const item = await ItemMasterModel.create(req.body);
    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: { item },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[1]; // Gets 'itemName' or 'itemCode'

      // This message is sent to frontend
      return res.status(400).json({
        success: false,
        message: `An item with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const { companyId, page = 1, limit = 20, search = "" } = req.query;

    const query = { company: companyId };
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
      ];
    }

    const items = await ItemMasterModel.find(query)
      .populate("stock.branch", "branchName")
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ItemMasterModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { items, total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await ItemMasterModel.findById(req.params.id).populate(
      "stock.branch",
      "branchName"
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const item = await ItemMasterModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: { item },
    });
  } catch (error) {

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[1]; // Gets 'itemName' or 'itemCode'

      // This message is sent to frontend
      return res.status(400).json({
        success: false,
        message: `An item with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await ItemMasterModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateIndexes = async () => {
  try {
    // Drop existing indexes
    await ItemMasterModel.collection.dropIndex('company_1_itemName_1');
    await ItemMasterModel.collection.dropIndex('company_1_itemCode_1');
    
    console.log('Old indexes dropped');

    // Create new case-insensitive indexes
    await ItemMasterModel.collection.createIndex(
      { company: 1, itemName: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 }
      }
    );

    await ItemMasterModel.collection.createIndex(
      { company: 1, itemCode: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 }
      }
    );

    console.log('New case-insensitive indexes created');
  } catch (error) {
    console.error('Error updating indexes:', error);
  }
};


export const updateRate = async (req, res) => {
  try {

    const { itemId } = req.params;
    const { priceLevelId, rate } = req.body;

    // Validate inputs
    if (!priceLevelId || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Price level ID and rate are required",
      });
    }

    if (rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate cannot be negative",
      });
    }

    // Find the item
    const item = await ItemMasterModel.findById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if price level already exists in the item
    const existingPriceLevelIndex = item.priceLevels.findIndex(
      (pl) => pl.priceLevel.toString() === priceLevelId
    );

    if (existingPriceLevelIndex >= 0) {
      // Update existing price level
      item.priceLevels[existingPriceLevelIndex].rate = rate;
    } else {
      // Add new price level
      item.priceLevels.push({
        priceLevel: priceLevelId,
        rate: rate,
      });
    }

    await item.save();

    res.status(200).json({
      success: true,
      data: item,
      message: "Rate updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

