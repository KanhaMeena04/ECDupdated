const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getRestaurantSettlements,
  getRestaurantSettlementBreakdown,
  updateSettlementStatus,
  processBatchPayout,
  updateRestaurantSettlementCycle
} = require('../controllers/settlementController');

router.get('/restaurants', protect, admin, getRestaurantSettlements);
router.get('/restaurants/:restaurantId/breakdown', protect, getRestaurantSettlementBreakdown);
router.patch('/:id/status', protect, admin, updateSettlementStatus);
router.post('/batch-payout', protect, admin, processBatchPayout);
router.put('/restaurants/:restaurantId/cycle', protect, admin, updateRestaurantSettlementCycle);

module.exports = router;
