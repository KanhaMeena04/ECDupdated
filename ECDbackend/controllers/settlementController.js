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

    const resolveName = (raw) => {
      if (!raw) return "";
      if (typeof raw === "string") return raw.trim();
      if (typeof raw === "object") {
        return raw.en || Object.values(raw).find(v => typeof v === "string" && v.trim()) || "";
      }
      return String(raw);
    };

    const formattedLedgers = ledgers.map(l => {
      const obj = l.toObject ? l.toObject() : { ...l };
      if (obj.restaurant && typeof obj.restaurant === 'object') {
        obj.restaurant.name = resolveName(obj.restaurant.name) || 'Restaurant Partner';
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      summary,
      ledgers: formattedLedgers,
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

// Sync completed orders without settlement ledgers
exports.syncOrdersToSettlements = async (req, res) => {
  try {
    const completedOrders = await Order.find({
      status: { $in: ['delivered', 'completed'] }
    }).populate('restaurant');

    let createdCount = 0;
    for (const order of completedOrders) {
      if (!order.restaurant) continue;

      let restaurantDoc = order.restaurant;
      if (typeof restaurantDoc === 'string' || !restaurantDoc._id) {
        restaurantDoc = await Restaurant.findById(order.restaurant);
      }
      if (!restaurantDoc) continue;

      const existing = await SettlementLedger.findOne({ order: order._id });
      if (!existing) {
        await SettlementLedger.createFromOrder(order, restaurantDoc);
        createdCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${createdCount} completed orders into settlement ledgers`,
      createdCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Rider Settlement Ledger lines with itemized earnings breakdown (Base, Distance, Peak, Rain, Bonus)
exports.getRiderSettlements = async (req, res) => {
  try {
    const { riderId, status, page = 1, limit = 50 } = req.query;
    const RiderEarningConfig = require('../models/RiderEarningConfig');
    const Rider = require('../models/Rider');

    const config = await RiderEarningConfig.getConfig();

    const query = { status: { $in: ['delivered', 'completed'] } };
    if (riderId) query.rider = riderId;

    const orders = await Order.find(query)
      .populate({
        path: 'rider',
        select: '_id user vehicle bankDetails upiId verificationStatus riderId',
        populate: { path: 'user', select: 'name mobile email userImage' }
      })
      .sort({ deliveredAt: -1, createdAt: -1 })
      .limit(parseInt(limit));

    let totalBasePay = 0;
    let totalDistancePay = 0;
    let totalSurgeBonus = 0;
    let totalRainBonus = 0;
    let totalNetEarnings = 0;

    const ledgers = orders.map((o) => {
      const dist = o.deliveryDistanceKm || 3;
      const basePay = config.baseEarning || 20;
      const extraKm = Math.max(0, dist - (config.baseDistanceKm || 2));
      const distancePay = extraKm * (config.perKmEarning || 8) || 15;
      const surgeBonus = config.isPeakBonusActive ? (config.peakBonus || 10) : 10;
      const rainBonus = config.isRainBonusActive ? (config.rainBonus || 10) : 10;
      const incentiveBonus = o.tip || 0;

      const grossEarnings = o.riderEarning || (basePay + distancePay + surgeBonus + rainBonus + incentiveBonus);
      const deductions = 0;
      const netEarning = Math.max(0, grossEarnings - deductions);

      totalBasePay += basePay;
      totalDistancePay += distancePay;
      totalSurgeBonus += surgeBonus;
      totalRainBonus += rainBonus;
      totalNetEarnings += netEarning;

      const rUser = o.rider?.user || {};
      const rBank = o.rider?.bankDetails || {};

      return {
        _id: o._id,
        orderId: o.orderNumber || `ORD-${o._id.toString().slice(-6).toUpperCase()}`,
        orderDate: o.deliveredAt || o.createdAt,
        riderId: o.rider?.riderId || (o.rider?._id ? `RID-${o.rider._id.toString().slice(-6).toUpperCase()}` : 'N/A'),
        riderName: rUser.name || o.riderName || 'Rider Partner',
        riderPhone: rUser.mobile || o.riderPhone || 'N/A',
        riderEmail: rUser.email || '',
        bankDetails: {
          accountNumber: rBank.accountNumber || '',
          ifsc: rBank.ifsc || rBank.ifscCode || '',
          bankName: rBank.bankName || '',
          upiId: o.rider?.upiId || rBank.upiId || ''
        },
        deliveryDistanceKm: dist,
        breakdown: {
          basePay,
          distancePay,
          surgeBonus,
          rainBonus,
          incentiveBonus,
          grossEarnings,
          deductions,
          netEarning
        },
        status: status || (o.paymentStatus === 'paid' ? 'PAID' : 'CALCULATED')
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalOrders: ledgers.length,
        totalBasePay,
        totalDistancePay,
        totalSurgeBonus,
        totalRainBonus,
        totalNetEarnings
      },
      ledgers,
      config: {
        baseEarning: config.baseEarning,
        perKmEarning: config.perKmEarning,
        peakBonus: config.peakBonus,
        rainBonus: config.rainBonus,
        incentiveTiers: config.incentiveTiers
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Restaurant App Earnings & Settlement Overview (Today, Week, Month, Order-wise breakdown)
exports.getRestaurantAppEarningsAndSettlement = async (req, res) => {
  try {
    let { restaurantId } = req.params;
    const userId = req.user?._id;

    let restaurant = null;
    if (restaurantId) {
      restaurant = await Restaurant.findById(restaurantId);
    } else if (userId) {
      restaurant = await Restaurant.findOne({ owner: userId });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    const rWallet = await RestaurantWallet.findOne({ restaurant: restaurant._id });
    const walletBalance = rWallet?.balance ?? restaurant.walletBalance ?? 0;

    const ledgers = await SettlementLedger.find({ restaurant: restaurant._id })
      .populate('order', 'orderNumber itemTotal totalAmount status createdAt paymentMethod')
      .sort({ createdAt: -1 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    let pendingSettlementAmount = 0;
    let pendingCount = 0;
    let processingSettlementAmount = 0;
    let processingCount = 0;
    let paidSettlementAmount = 0;
    let paidCount = 0;

    const orderWiseBreakdown = ledgers.map(l => {
      const createdAt = new Date(l.createdAt);
      const netPayable = l.netPayable || 0;

      totalEarnings += netPayable;
      if (createdAt >= startOfToday) todayEarnings += netPayable;
      if (createdAt >= startOfWeek) weekEarnings += netPayable;
      if (createdAt >= startOfMonth) monthEarnings += netPayable;

      if (['CALCULATED', 'REVIEW'].includes(l.status)) {
        pendingSettlementAmount += netPayable;
        pendingCount++;
      } else if (['APPROVED', 'PROCESSING'].includes(l.status)) {
        processingSettlementAmount += netPayable;
        processingCount++;
      } else if (['PAID', 'RECONCILED'].includes(l.status)) {
        paidSettlementAmount += netPayable;
        paidCount++;
      }

      return {
        settlementId: l.settlementId,
        orderId: l.order?.orderNumber || l.order?._id || 'N/A',
        createdAt: l.createdAt,
        grossSales: l.grossSales,
        commissionPercent: l.platformCommissionPercent || 20,
        commissionAmount: l.platformCommissionAmount,
        packagingFee: l.packagingFee || 0,
        couponShare: l.couponDiscountShare || 0,
        netPayable: l.netPayable,
        status: l.status
      };
    });

    return res.status(200).json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        settlementCycle: restaurant.settlementCycle || 'T+2'
      },
      earnings: {
        today: parseFloat(todayEarnings.toFixed(2)),
        week: parseFloat(weekEarnings.toFixed(2)),
        month: parseFloat(monthEarnings.toFixed(2)),
        total: parseFloat(totalEarnings.toFixed(2)),
        walletBalance: parseFloat(walletBalance.toFixed(2))
      },
      settlementsSummary: {
        pending: { amount: parseFloat(pendingSettlementAmount.toFixed(2)), count: pendingCount },
        processing: { amount: parseFloat(processingSettlementAmount.toFixed(2)), count: processingCount },
        paid: { amount: parseFloat(paidSettlementAmount.toFixed(2)), count: paidCount }
      },
      orderWiseBreakdown
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
