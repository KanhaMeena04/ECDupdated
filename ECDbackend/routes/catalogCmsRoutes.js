const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAdminRestaurants,
  updateRestaurantMasterControl,
  addRestaurantOffer,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  reorderAdminCategories,
  getAdminProducts,
  createAdminProduct,
  updateProductPriceOverride,
  updateProductStatus,
  updateAdminProductFull,
  getCmsAuditLogs,
} = require("../controllers/catalogCmsController");

// Restaurant Master Control Routes
router.get("/restaurants", protect, admin, getAdminRestaurants);
router.put("/restaurants/:id/master-control", protect, admin, updateRestaurantMasterControl);
router.post("/restaurants/:id/offers", protect, admin, addRestaurantOffer);

// Category & Subcategory CMS Routes
router.get("/categories", protect, admin, getAdminCategories);
router.post("/categories", protect, admin, createAdminCategory);
router.put("/categories/reorder", protect, admin, reorderAdminCategories);
router.put("/categories/:id", protect, admin, updateAdminCategory);

// Product / Menu Master Control Routes
router.get("/products", protect, admin, getAdminProducts);
router.post("/products", protect, admin, createAdminProduct);
router.put("/products/:id/price-override", protect, admin, updateProductPriceOverride);
router.patch("/products/:id/status", protect, admin, updateProductStatus);
router.put("/products/:id", protect, admin, updateAdminProductFull);

// Audit Log Route
router.get("/audit-logs", protect, admin, getCmsAuditLogs);

module.exports = router;
