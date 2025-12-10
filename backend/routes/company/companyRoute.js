import express from "express";
import {
  createCompany,
  getallCompanies,
  listCompanies,
  searchCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../../controller/companyController/companyController.js";

const router = express.Router();

// Your existing routes
router.post("/create", createCompany);
router.get("/getall", getallCompanies);

// New routes for frontend integration
router.get("/list", listCompanies);
router.get("/searchCompanies", searchCompanies);
router.get("/:id", getCompanyById);
router.put("/update/:id", updateCompany);
router.delete("/delete/:id", deleteCompany);

export default router;