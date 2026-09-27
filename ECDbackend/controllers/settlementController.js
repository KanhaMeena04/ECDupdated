const SettlementLedger = require('../models/SettlementLedger');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

// Get all restaurant settlement ledgers with aggregated totals & order breakdown
exports.getRestaurantSettlements = async (req, res) => {
  try {
    const { restaurantId, status, cycle, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (restaurantId) query.restaurant = restaurantId;
    if (status) query.status = status;
    if (cycle) query.settlementCycle = cycle;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ledgers, total] = await Promise.all([
      SettlementLedger.find(query)
        .populate('restaurant', 'name email contactNumber owner bankDetails settlementCycle')
        .populate('order', 'orderNumber totalAmount paymentMethod status createdAt orderType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SettlementLedger.countDocuments(query)
    ]);

    // Summary calculations
    const summaryAgg = await SettlementLedger.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossSales: { $sum: '$grossSales' },
          totalCommission: { $sum: '$platformCommissionAmount' },
          totalPackaging: { $sum: '$packagingFee' },
          totalRefundDeductions: { $sum: '$refundDeduction' },
          totalCouponShare: { $sum: '$couponDiscountShare' },
          totalNetPayable: { $sum: '$netPayable' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = summaryAgg[0] || {
      totalGrossSales: 0,
      totalCommission: 0,
      totalPackaging: 0,
      totalRefundDeductions: 0,
      totalCouponShare: 0,
      totalNetPayable: 0,
      count: 0
    };

    return res.status(200).json({
      success: true,
      summary,
      ledgers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get order-wise settlement breakdown for a specific restaurant or settlement period
exports.getRestaurantSettlementBreakdown = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, period } = req.query;

    const query = { restaurant: restaurantId };
    if (status) query.status = status;

    const ledgers = await SettlementLedger.find(query)
      .populate('order', 'orderNumber totalAmount paymentMethod items status createdAt orderType deliveryOtp customerArrived')
      .sort({ createdAt: -1 });

    const totalNetPayable = ledgers.reduce((sum, l) => sum + (l.netPayable || 0), 0);
    const totalGrossSales = ledgers.reduce((sum, l) => sum + (l.grossSales || 0), 0);
    const totalCommission = ledgers.reduce((sum, l) => sum + (l.platformCommissionAmount || 0), 0);

    return res.status(200).json({
      success: true,
      restaurantId,
      totalOrders: ledgers.length,
      totalGrossSales,
      totalCommission,
      totalNetPayable,
      breakdown: ledgers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Settlement Lifecycle status (CALCULATED -> REVIEW -> APPROVED -> PROCESSING -> PAID -> RECONCILED)
exports.updateSettlementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentReference, notes, disputeReason } = req.body;

    const validStatuses = ['CALCULATED', 'REVIEW', 'APPROVED', 'PROCESSING', 'PAID', 'RECONCILED', 'PAYMENT_FAILED', 'RETRY'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid settlement status' });
    }

    const ledger = await SettlementLedger.findById(id);
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    const oldStatus = ledger.status;
    ledger.status = status;
    if (notes) ledger.notes = notes;
    if (paymentReference) ledger.paymentReference = paymentReference;
    if (disputeReason) ledger.disputeReason = disputeReason;

    if (status === 'PAID') {
      ledger.settledAt = new Date();
      ledger.settledBy = req.user._id;
    }

    await ledger.save();

    await AuditLog.log({
      entity: 'Settlement',
      entityId: ledger._id,
      action: 'status_update',
      userId: req.user._id,
      userRole: req.user.role || 'admin',
      changes: { field: 'status', oldValue: oldStatus, newValue: status },
      reason: notes || `Settlement status updated to ${status}`,
      metadata: { paymentReference, restaurantId: ledger.restaurant }
    });

    return res.status(200).json({
      success: true,
      message: `Settlement status updated to ${status}`,
      ledger
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Process Batch Payout for settlements
exports.processBatchPayout = async (req, res) => {
  try {
    const { settlementIds, paymentReference, settlementMethod = 'bank_transfer', notes } = req.body;
    if (!Array.isArray(settlementIds) || settlementIds.length === 0) {
      return res.status(400).json({ success: false, message: 'settlementIds array is required' });
    }

    const batchId = 'BATCH-' + Date.now();

    const result = await SettlementLedger.updateMany(
      { _id: { $in: settlementIds } },
      {
        $set: {
          status: 'PAID',
          settlementBatchId: batchId,
          paymentReference: paymentReference || `UTR-${Date.now()}`,
          settlementMethod,
          settledAt: new Date(),
          settledBy: req.user._id,
          notes: notes || 'Bulk payout processed via admin'
        }
      }
    );

    await AuditLog.log({
      entity: 'Settlement',
      action: 'batch_payout',
      userId: req.user._id,
      userRole: req.user.role || 'admin',
      reason: `Batch payout processed for ${result.modifiedCount} settlements`,
      metadata: { batchId, settlementIds, paymentReference }
    });

    return res.status(200).json({
      success: true,
      message: `Batch payout processed successfully for ${result.modifiedCount} settlements`,
      batchId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update restaurant settlement cycle (T+1/T+2/T+3/Weekly/Custom)
exports.updateRestaurantSettlementCycle = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { settlementCycle } = req.body;

    const validCycles = ['T+1', 'T+2', 'T+3', 'Weekly', 'Custom'];
    if (!validCycles.includes(settlementCycle)) {
      return res.status(400).json({ success: false, message: 'Invalid settlement cycle' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const oldCycle = restaurant.settlementCycle || 'T+2';
    restaurant.settlementCycle = settlementCycle;
    await restaurant.save();

    await AuditLog.log({
      entity: 'Restaurant',
      entityId: restaurant._id,
      action: 'settlement_cycle_update',
      userId: req.user._id,
      userRole: 'admin',
      changes: { field: 'settlementCycle', oldValue: oldCycle, newValue: settlementCycle },
      reason: `Updated settlement cycle to ${settlementCycle}`
    });

    return res.status(200).json({
      success: true,
      message: `Settlement cycle updated to ${settlementCycle}`,
      restaurant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
