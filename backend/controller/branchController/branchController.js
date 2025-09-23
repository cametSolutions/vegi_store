import BranchModel from "../../model/masters/BranchModel.js";
export const getallBranches = async (req, res) => {
    try {
const {companyId}=req.query
console.log("iddd",companyId)
        const allbranches = await BranchModel.find({companyId})
        return res.status(201).json({ message: "branches found", data: allbranches })
    } catch (error) {
        console.log("error:", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}