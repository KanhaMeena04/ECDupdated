const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getCategoriesTree,
  getCategories,
  getCategoryById,
  getSubcategoriesByParent,
  getAdminCategories,
  createCategory,
  updateCategory,
  patchCategoryStatus,
  reorderCategories,
  deleteCategory,
} = require("../controllers/categoryController");

// Public & Universal Category routes
router.get("/tree", getCategoriesTree);
router.get("/", getAdminCategories);
router.get("/list", getCategories);
router.get("/:id", getCategoryById);
router.get("/:id/subcategories", getSubcategoriesByParent);

// Direct CRUD routes (used by Admin Panel)
router.post("/", createCategory);
router.put("/reorder", reorderCategories);
router.put("/:id", updateCategory);
router.patch("/:id/status", patchCategoryStatus);
router.delete("/:id", deleteCategory);

// Admin management routes aliases
router.get("/admin/list", protect, admin, getAdminCategories);
router.post("/admin/create", protect, admin, createCategory);
router.put("/admin/reorder", protect, admin, reorderCategories);
router.put("/admin/:id", protect, admin, updateCategory);
router.patch("/admin/:id/status", protect, admin, patchCategoryStatus);
router.delete("/admin/:id", protect, admin, deleteCategory);

module.exports = router;
