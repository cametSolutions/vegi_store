import mongoose from "mongoose";
import PricelevelModel from "../../model/masters/PricelevelModel.js";
import { sleep } from "../../../shared/utils/delay.js";

export const getallPriceLevel = async (req, res) => {
  const { companyId, branchId } = req.query;

  try {
    // throw new Error("not implememted")
    // await sleep(5000);
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
