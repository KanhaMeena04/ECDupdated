const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createCheckoutSession, createPaymentIntentForMobile } = require("../controllers/paymentController");

router.post("/create-payment-intent", protect, createPaymentIntentForMobile);
router.post("/create-checkout-session", protect, createCheckoutSession);

module.exports = router;
