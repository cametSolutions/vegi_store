import UserMOdel from "../../model/auth/AuthModel.js";
export const createUsers = async (req, res) => {
    try {

        const { userName, email, password, aadharNumber, mobile, address, companyName, branchName } = req.body
        if (!userName || !email) {
            return res.status(400).json({ message: "name and email are required" })
        }
        const existingUser = await UserMOdel.findOne({
            name: userName
        })
        if (existingUser) {
            return res.status(409).json({ message: "user already exist" })
        }
        const newUser = new UserMOdel({
            name: userName, email, password, aadharNumber: Number(aadharNumber), mobile, address
        })
        if (companyName && branchName) {
            newUser.access = [
                {
                    company: companyName,
                    branches: branchName
                }]
        }
        await newUser.save()
        res.status(201).json({
            message: "user created successfully"
        })
    } catch (error) {
        console.log("error", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}