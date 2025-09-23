import PricelevelModel from "../../model/masters/PricelevelModel.js";
export const getallpricelevel = async (req, res) => {
    try {
        const result = await PricelevelModel.find({})
        return res.status(201).json({ message: "Pricelevel found", data: result })
    } catch (error) {
        console.log("error:", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}