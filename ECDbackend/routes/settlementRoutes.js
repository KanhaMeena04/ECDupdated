const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getRestaurantSettlements,
  getRestaurantSettlementBreakdown,
  updateSettlementStatus,
  processBatchPayout,
  updateRestaurantSettlementCycle,
  syncOrdersToSettlements,
  getRiderSettlements,
  getRestaurantAppEarningsAndSettlement
} = require('../controllers/settlementController');

const {
  getRestaurantWithdrawals,
  createRestaurantWithdrawal,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');

// Restaurant App Earnings & Settlement Breakdown Endpoints
router.get('/restaurant-app/overview', protect, getRestaurantAppEarningsAndSettlement);
router.get('/restaurant-app/:restaurantId/overview', protect, getRestaurantAppEarningsAndSettlement);

// Restaurant Payout Requests Endpoints
router.get('/withdrawals', protect, admin, getRestaurantWithdrawals);
router.post('/withdraw', protect, createRestaurantWithdrawal);
router.put('/withdrawals/:id/approve', protect, admin, approveWithdrawal);
router.put('/withdrawals/:id/reject', protect, admin, rejectWithdrawal);

// Settlement Ledger Endpoints
router.get('/restaurants', protect, admin, getRestaurantSettlements);
router.get('/restaurants/:restaurantId/breakdown', protect, getRestaurantSettlementBreakdown);
router.post('/batch-payout', protect, admin, processBatchPayout);
router.put('/restaurants/:restaurantId/cycle', protect, admin, updateRestaurantSettlementCycle);
router.post('/sync-orders', protect, admin, syncOrdersToSettlements);
router.get('/riders', protect, admin, getRiderSettlements);
router.patch('/:id/status', protect, admin, updateSettlementStatus);

module.exports = router;
