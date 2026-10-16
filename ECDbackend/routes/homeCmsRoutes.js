const express = require("express");
const router = express.Router();
const { protect, admin, optionalAuth } = require("../middleware/authMiddleware");
const {
  getPublicHomeScreenSections,
  getAllHomeScreenSectionsAdmin,
  createHomeScreenSection,
  updateHomeScreenSection,
  toggleHomeScreenSection,
  reorderHomeScreenSections,
  deleteHomeScreenSection,
  getRecommendedDishes,
  getSpecialDishes,
} = require("../controllers/homeCmsController");

// Public User App endpoint
router.get("/cms-sections", getPublicHomeScreenSections);
router.get("/sections", getPublicHomeScreenSections);
router.get("/recommended-dishes", optionalAuth, getRecommendedDishes);
router.get("/special-dishes", optionalAuth, getSpecialDishes);

// Admin Control endpoints
router.get("/admin/home-sections", protect, admin, getAllHomeScreenSectionsAdmin);
router.post("/admin/home-sections", protect, admin, createHomeScreenSection);
router.put("/admin/home-sections/reorder", protect, admin, reorderHomeScreenSections);
router.put("/admin/home-sections/:id", protect, admin, updateHomeScreenSection);
router.patch("/admin/home-sections/:id/toggle", protect, admin, toggleHomeScreenSection);
router.delete("/admin/home-sections/:id", protect, admin, deleteHomeScreenSection);

module.exports = router;
