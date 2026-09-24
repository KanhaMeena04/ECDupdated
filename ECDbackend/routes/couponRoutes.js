const express = require('express');
const router = express.Router();
const { getActiveCoupons, validateCouponCode, getAllPromocodes } = require('../controllers/promocodeController');

// Public coupon endpoints
router.get('/active', getActiveCoupons);
router.get('/', getAllPromocodes);
router.post('/validate', validateCouponCode);

module.exports = router;
