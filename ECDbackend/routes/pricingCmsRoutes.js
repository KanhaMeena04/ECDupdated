const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getPricingConfig,
  updateDeliveryFeeConfig,
  updateSurgeConfig,
  updateCommissionConfig,
  updateFeeConfig,
  previewPricingCalculation,
} = require("../controllers/pricingCmsController");

router.get("/config", protect, admin, getPricingConfig);
router.get("/admin/config", protect, admin, getPricingConfig);
router.get("/admin/settings", protect, admin, getPricingConfig);
router.put("/delivery-config", protect, admin, updateDeliveryFeeConfig);
router.put("/surge-config", protect, admin, updateSurgeConfig);
router.put("/commission-config", protect, admin, updateCommissionConfig);
router.put("/fee-config", protect, admin, updateFeeConfig);
router.post("/preview", protect, admin, previewPricingCalculation);

module.exports = router;
