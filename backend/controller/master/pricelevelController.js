import PricelevelModel from "../../model/masters/PricelevelModel.js";
export const createPricelevel = async (req, res) => {
    try {
        const { priceLevelName, selected } = req.body
        if (!priceLevelName) {
            return res.status(404).json({ message: "pricelevel is required" })
        }
        const newPricelevel = new PricelevelModel({
            priceLevelName
        })
        await newPricelevel.save()
        // Fetch all price levels
        const allPricelevels = await PricelevelModel.find({});
        if (newPricelevel) {
            return res.status(201).json({ message: "pricelevel updated", data: allPricelevels })
        }
      
    } catch (error) {
        console.log("error:", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}