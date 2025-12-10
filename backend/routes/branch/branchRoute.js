import express from "express";
import {
  createBranch,
  getallBranches,
  listBranches,
  searchBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../../controller/branchController/branchController.js";

const router = express.Router();

// Create branch
router.post("/create", createBranch);

// Read operations
router.get("/list", listBranches);           // Paginated list with search
router.get("/searchBranches", searchBranches); // Quick search
router.get("/all", getallBranches);          // Get all branches (with optional companyId filter)
router.get("/:id", getBranchById);           // Get single branch by ID

// Update branch
router.put("/update/:id", updateBranch);

// Delete branch
router.delete("/delete/:id", deleteBranch);

export default router;