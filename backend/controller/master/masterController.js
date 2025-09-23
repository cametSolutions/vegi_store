import BranchModel from "../../model/masters/BranchModel.js"
import CompanyModel from "../../model/masters/CompanyModel.js"

export const createCompany = async (req, res) => {
    try {

        const { companyName, companyType, registrationNumber, incorporationDate, permanentAddress, residentialAddress, email, numEmployees, notificationEmail, mobile, landline, gstNumber, panNumber, website, industry } = req.body
    
        // 1️⃣ Validate required fields
        if (!companyName || !email) {
            console.log("noteset")
            return res.status(400).json({ message: "Company name and email are required" });
        }
        // 2️⃣ Check if company already exists
        const existingCompany = await CompanyModel.findOne({ companyName: companyName });
        if (existingCompany) {
            return res.status(409).json({ message: "Company already exists" });
        }

        // 3️⃣ Prepare the new company object
        const newCompany = new CompanyModel({
            companyName,
            companyType,
            registrationNumber,
            incorporationDate,
            permanentAddress,
            residentialAddress,
            email,
            notificationEmail,
            mobile,
            landline,
            gstNumber,
            panNumber,
            website,
            industry,
            // authorizedSignatory,
            numEmployees
        });

        // 4️⃣ Save to database
        const savedCompany = await newCompany.save();

        // 5️⃣ Return success response
        res.status(201).json({
            message: "Company created successfully",
            company: savedCompany
        });

    } catch (error) {
        console.log("error", error.message)
    }
}

export const createBranch = async (req, res) => {
    try {
        const { branchName, companyId, address, city, state, country, pincode, email, mobile, landline, status } = req.body
       
        if (!branchName || !email) {
            return res.status(400).json({ message: "Branch name and email are required" })
        }
        const existingBranch = await BranchModel.findOne({ branchName: branchName })
        if (existingBranch) {
            return res.status(409).json({ message: "Branch already exist" })
        }
        const newBranch = new BranchModel({
            branchName,
            companyId,
            address,
            city,
            state,
            country,
            pincode,
            email,
            mobile,
            landline,
            status
        })
        const savedBranch = await newBranch.save()
        res.status(201).json({ message: "Branch created successfully", branch: savedBranch })
    } catch (error) {
        console.log("eroor", error.message)
    }
}

