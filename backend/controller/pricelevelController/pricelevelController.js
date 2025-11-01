import mongoose from "mongoose";
import PriceLevelModel from "../../model/masters/PricelevelModel.js";
import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
import {SalesModel,PurchaseModel} from "../../model/TransactionModel.js";
import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import { isMasterReferenced } from "../../helpers/MasterHelpers/masterHelper.js";

export const getallPriceLevel = async (req, res) => {
  const { companyId, branchId } = req.query;

  try {
    const query = {
      company: new mongoose.Types.ObjectId(companyId),
    };

    if (branchId) {
      query.branches = new mongoose.Types.ObjectId(branchId);
    }

    const result = await PriceLevelModel.find(query);

    return res.status(200).json({ message: "Price level(s) found", data: result });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Create Price Level
export const create = async (req, res) => {
  try {
    const payload = req.body;
    const priceLevel = await PriceLevelModel.create(payload);

    res.status(201).json({ data: priceLevel });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[1]; // Gets 'itemName' or 'itemCode'

      // This message is sent to frontend
      return res.status(400).json({
        success: false,
        message: `An item with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update Price Level
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await PriceLevelModel.findByIdAndUpdate(id, req.body, {
      new: true,
    })
      .populate("branches")
      .populate("company");
    res.json({ data: updated });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[1]; // Gets 'itemName' or 'itemCode'

      // This message is sent to frontend
      return res.status(400).json({
        success: false,
        message: `An item with this ${field} already exists for this company`,
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete Price Level

export const deletePriceLevel = async (req, res) => {
  try {
    const { id } = req.params;

    // Collections and fields to check for priceLevel references
    const referencesToCheck = [
      { model: AccountMasterModel, field: "priceLevel" },
      { model: SalesModel, field: "priceLevel" },
      { model: PurchaseModel, field: "priceLevel" },
      { model: ItemMasterModel, field: "priceLevels.priceLevel" },
      // Add any other relevant models
    ];

    const inUse = await isMasterReferenced(referencesToCheck, id);
    if (inUse) {
      return res.status(400).json({
        message: "PriceLevel is used in accounting or transactions and cannot be deleted.",
      });
    }

    await PriceLevelModel.findByIdAndDelete(id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

