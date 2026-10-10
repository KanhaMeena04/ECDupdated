const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const {
  globalSearch,
  getSuggestions,
  getSearchLanding,
  clearSearchHistory,
} = require("../controllers/searchController");
const { getAllRestaurants } = require("../controllers/restaurantController");

router.get("/landing", optionalAuth, getSearchLanding);
router.get("/suggestions", getSuggestions);
router.get("/", optionalAuth, getAllRestaurants); // /api/search?q=... or ?query=...
router.delete("/history", protect, clearSearchHistory);
module.exports = router;
