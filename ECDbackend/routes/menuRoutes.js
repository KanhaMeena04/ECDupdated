const express = require("express");
const router = express.Router();
const { protect, restaurantOwner } = require("../middleware/authMiddleware");
const {
  addCategory,
  addFoodItem,
  getMenu,
  bulkUpdateProducts,
  toggleProductAvailability,
  bulkUpdatePrices,
  editCategory,
  deleteCategory,
  editProduct,
  deleteProduct,
  getSeasonalMenu,
} = require("../controllers/menuController");
const { upload } = require("../utils/upload");
router.get("/:restaurantId", getMenu);
router.post(
  "/category",
  protect,
  restaurantOwner,
  upload.single("image"),
  addCategory
);
router.post(
  "/item",
  protect,
  restaurantOwner,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "addOnImages", maxCount: 20 },
  ]),
  addFoodItem
);
router.put(
  "/category/:id",
  protect,
  restaurantOwner,
  upload.single("image"),
  editCategory
);
router.delete("/category/:id", protect, restaurantOwner, deleteCategory);
router.put(
  "/item/:id",
  protect,
  restaurantOwner,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "addOnImages", maxCount: 20 },
  ]),
  editProduct
);
router.delete("/item/:id", protect, restaurantOwner, deleteProduct);
router.put("/bulk/items", protect, restaurantOwner, bulkUpdateProducts);
router.put(
  "/item/:id/availability",
  protect,
  restaurantOwner,
  toggleProductAvailability
);
router.put("/bulk/prices", protect, restaurantOwner, bulkUpdatePrices);
router.get("/seasonal/:restaurantId", getSeasonalMenu);
module.exports = router;
