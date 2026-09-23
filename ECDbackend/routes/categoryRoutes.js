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

// Public routes
router.get("/tree", getCategoriesTree);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.get("/:id/subcategories", getSubcategoriesByParent);

// Admin management routes
router.get("/admin/list", protect, admin, getAdminCategories);
router.post("/admin/create", protect, admin, createCategory);
router.put("/admin/reorder", protect, admin, reorderCategories);
router.put("/admin/:id", protect, admin, updateCategory);
router.patch("/admin/:id/status", protect, admin, patchCategoryStatus);
router.delete("/admin/:id", protect, admin, deleteCategory);

module.exports = router;
