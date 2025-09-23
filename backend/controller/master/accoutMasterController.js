import AccountMasterModel from "../../model/masters/AccountMasterModel.js";
export const createAccountMaster = async (req, res) => {
    try {
        const { companyId, branchId, accountName, accountType, address, openingBalance, openingBalanceType, phoneNo, pricelevel } = req.body
    
        if (!companyId || !branchId) {
            return res.status(400).json({ message: "Companyid or branchid is missing" })
        }
        const existingAccountholder = await AccountMasterModel.findOne({ companyId, branchId, accountName })
        if (existingAccountholder) {
            return res.status(409).json({ message: "This account holder is already registered in the same branch" })
        }
        const newAccntholder = new AccountMasterModel({
            companyId,
            branchId,
            accountName,
            accountType,
            address,
            phoneNo,
            pricelevel,
            openingBalance,
            openingBalanceType
        })
        const savedholder = await newAccntholder.save()
        if (savedholder) {
            const newholderlist = await AccountMasterModel.find({}).populate({ path: "pricelevel", select: "_id priceLevelName" })
            res.status(201).json({
                message: "Account holder created succesfully",
                data: newholderlist
            })
        }

    } catch (error) {
        console.log("error:", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}