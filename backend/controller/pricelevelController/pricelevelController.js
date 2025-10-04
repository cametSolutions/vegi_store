import mongoose from "mongoose";
import PricelevelModel from "../../model/masters/PricelevelModel.js";

export const getallPriceLevel = async (req, res) => {
  const { companyId, branchId } = req.query;

  try {
    const result = await PricelevelModel.find({
      company: new mongoose.Types.ObjectId(companyId),
      branches: new mongoose.Types.ObjectId(branchId),
    });

    return res.status(200).json({ message: "Pricelevel found", data: result });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
