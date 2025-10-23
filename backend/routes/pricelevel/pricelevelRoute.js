import express from "express";
import {
  createPriceLevel,
  getAllPriceLevels,
  getPriceLevelById,
  updatePriceLevel,
  deletePriceLevel,
  getActivePriceLevels,
  getPriceLevelsByBranch,
  getUnallocatedPriceLevels,
  allocateToBranches,
  removeFromBranches,
  updateStatus,
  checkCanBeDeleted
} from "../../controller/pricelevelController/pricelevelController.js";

const router = express.Router();

// ==================== IMPORTANT: SPECIFIC ROUTES FIRST ====================
// These must come before generic routes like /:id to avoid conflicts

// Create new price level
router.post("/createpricelevel", createPriceLevel);

// Get all price levels with pagination, search, and filters
router.get("/getallpricelevel", getAllPriceLevels);

// Get active price levels for a company
router.get("/company/:companyId/active", getActivePriceLevels);

// Get unallocated price levels for a company
router.get("/company/:companyId/unallocated", getUnallocatedPriceLevels);

// Get price levels by branch
router.get("/branch/:branchId", getPriceLevelsByBranch);

// ==================== ACTION ROUTES (SPECIFIC PATHS) ====================
// Allocate price level to branches
router.post("/:id/allocate", allocateToBranches);

// Remove price level from branches
router.post("/:id/remove", removeFromBranches);

// Update status
router.patch("/:id/status", updateStatus);

// Check if price level can be deleted
router.get("/:id/can-delete", checkCanBeDeleted);

// ==================== GENERIC CRUD ROUTES (LAST) ====================
// Get price level by ID
router.get("/:id", getPriceLevelById);

// Update price level
router.put("/:id", updatePriceLevel);

// Delete price level
router.delete("/:id", deletePriceLevel);

export default router;

// ==================== AVAILABLE ENDPOINTS ====================
/*
POST   /api/pricelevel/createpricelevel
       Body: { priceLevelName, description?, status?, company, branches? }

GET    /api/pricelevel/getallpricelevel
       Query: ?companyId=xxx&page=1&limit=25&search=xxx&status=active&sortBy=priceLevelName&sortOrder=asc

GET    /api/pricelevel/company/:companyId/active
       Returns only active price levels for a company

GET    /api/pricelevel/company/:companyId/unallocated
       Returns price levels not assigned to any branch

GET    /api/pricelevel/branch/:branchId
       Returns price levels assigned to a specific branch

POST   /api/pricelevel/:id/allocate
       Body: { branchIds: ["id1", "id2"] }

POST   /api/pricelevel/:id/remove
       Body: { branchIds: ["id1", "id2"] }

PATCH  /api/pricelevel/:id/status
       Body: { status: "active" | "inactive" }

GET    /api/pricelevel/:id/can-delete
       Checks if price level can be safely deleted

GET    /api/pricelevel/:id
       Get single price level details

PUT    /api/pricelevel/:id
       Body: { priceLevelName?, description?, status?, branches? }

DELETE /api/pricelevel/:id
       Deletes price level (with safety checks)
*/