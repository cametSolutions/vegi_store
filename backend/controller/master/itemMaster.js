import ItemMasterModel from "../../model/masters/ItemMasterModel.js";
import PricelevelModel from "../../model/masters/PricelevelModel.js";
export const createItem = async (req, res) => {
    try {
        const { companyId, branchIds, unit, itemName, itemCode } = req.body;

        // 1. Validate required fields
        if (!companyId || !itemName || !itemCode || !unit) {
            return res.status(400).json({
                success: false,
                message: "companyId, itemName, itemCode, and unit are required."
            });
        }

        // 2. Check if item with same code already exists for this company
        const existingItem = await ItemMasterModel.findOne({
            companyId,
            $or: [{ itemCode }, { itemName }]
        });
        if (existingItem) {
            return res.status(409).json({
                success: false,
                message: "Item with this code already exists in the company."
            });
        }
console.log("copaiddd",companyId)
        const pricelevels = await PricelevelModel.find({ companyId })
console.log("pricelevels",pricelevels)
        const initialPriceLevels = {}
        pricelevels.forEach((pl) => {
            initialPriceLevels[pl.priceLevelName] = 0
        })


        // 3. Create new item
        const newItem = new ItemMasterModel({
            companyId,
            branchIds: branchIds || [], // default empty array
            unit,
            itemName,
            itemCode,
            priceLevels: initialPriceLevels
        });

        // 4. Save to database
        await newItem.save();

        // 5. Respond
        return res.status(201).json({
            success: true,
            message: "Item created successfully.",
            data: newItem,
        });

    } catch (error) {
        console.error("Error creating item:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const getallItems = async (req, res) => {
    try {
        const { companyId } = req.query
        const result = await ItemMasterModel.find({ companyId })

        if (result && result.length) {
            return res.status(201).json({ message: "items found", data: result })
        } else {
            return res.status(404).json({ message: "items not found ", data: result })
        }

    } catch (error) {
        console.log("eror", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}
