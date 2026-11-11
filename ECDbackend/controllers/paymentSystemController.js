
const {
  processCODDelivery,
  processOnlineDelivery,
  riderDepositCash,
  setRiderCashLimit,
  processWeeklyPayouts,
  calculateDeliveryCharges
} = require('../services/paymentService');
const RiderWallet = require('../models/RiderWallet');
const RestaurantWallet = require('../models/RestaurantWallet');
const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const Restaurant = require('../models/Restaurant');
exports.confirmCODCollection = async (req, res) => {
  try {
    const { orderId, amountCollected } = req.body;
    const riderId = req.user._id; // from auth middleware
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });
    const order = await Order.findById(orderId).populate('rider');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.rider || order.rider.user.toString() !== riderId.toString()) {
      const rider = await Rider.findOne({ user: riderId });
      if (!rider || order.rider._id.toString() !== rider._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not your order' });
      }
    }
    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({ success: false, message: 'This is not a COD order' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Order must be delivered first' });
    }
    const result = await processCODDelivery(orderId);
    if (result.riderFrozen) {
      return res.status(200).json({
        success: true,
        message: '⚠️ COD collected but your account is now FROZEN. Please deposit cash to activate your account.',
        data: result
      });
    }
    return res.status(200).json({
      success: true,
      message: 'COD collection confirmed',
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getRiderWallet = async (req, res) => {
  try {
    let rider = await Rider.findOne({
      $or: [
        { user: req.user._id },
        ...(req.user.mobile ? [{ mobile: req.user.mobile }, { phone: req.user.mobile }] : []),
        ...(req.user.phone ? [{ mobile: req.user.phone }, { phone: req.user.phone }] : [])
      ]
    });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    if (!rider.user || rider.user.toString() !== req.user._id.toString()) {
      rider.user = req.user._id;
      await rider.save().catch(() => {});
    }

    let wallet = await RiderWallet.findOne({ rider: rider._id });
    if (!wallet) wallet = await RiderWallet.create({ rider: rider._id });
    const recentTransactions = await PaymentTransaction.find({ rider: rider._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const riderObjectIds = [rider._id];
    if (req.user._id) riderObjectIds.push(req.user._id);
    const riderStringIds = [rider._id.toString(), req.user._id.toString(), ...(rider.riderId ? [String(rider.riderId)] : [])];
    const riderPhones = [rider.phone, rider.mobile, req.user.phone, req.user.mobile].filter(Boolean);

    const riderMatchFilter = {
      $or: [
        { rider: { $in: [...riderObjectIds, ...riderStringIds] } },
        { riderId: { $in: riderStringIds } },
        { driver: { $in: [...riderObjectIds, ...riderStringIds] } },
        { driverId: { $in: riderStringIds } },
        { 'assignedRider.riderId': { $in: riderStringIds } },
        { 'assignedRider.rider': { $in: [...riderObjectIds, ...riderStringIds] } },
        { 'assignedRider.id': { $in: riderStringIds } },
        { 'riderNotificationStatus.acceptedBy': { $in: [...riderObjectIds, ...riderStringIds] } },
        { cashCollectedBy: { $in: [...riderObjectIds, ...riderStringIds] } },
        ...(riderPhones.length > 0 ? [{ riderPhone: { $in: riderPhones } }] : [])
      ]
    };

    const statusMatchFilter = {
      $or: [
        { status: { $in: ['delivered', 'completed', 'Delivered', 'Completed', 'DELIVERED', 'COMPLETED'] } },
        { deliveryStatus: { $in: ['delivered', 'completed', 'Delivered', 'Completed', 'DELIVERED', 'COMPLETED'] } }
      ]
    };

    // Auto-sync if cashInHand is 0 but rider delivered COD orders
    if ((wallet.cashInHand || 0) === 0) {
      const codOrders = await Order.find({
        $and: [
          riderMatchFilter,
          statusMatchFilter,
          {
            $or: [
              { paymentMethod: { $in: ['cod', 'COD', 'cash', 'Cash', 'Cash on Delivery', 'cash on delivery'] } },
              { cashCollected: { $gt: 0 } }
            ]
          }
        ]
      });
      if (codOrders.length > 0) {
        let totalCodAmount = 0;
        for (const o of codOrders) {
          totalCodAmount += Number(o.cashCollected || o.totalAmount || 0);
        }
        if (totalCodAmount > 0) {
          wallet.cashInHand = totalCodAmount;
          await wallet.save().catch(() => {});
        }
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dateMatchFilter = {
      $or: [
        { deliveredAt: { $gte: startOfDay } },
        { updatedAt: { $gte: startOfDay } },
        { createdAt: { $gte: startOfDay } }
      ]
    };

    const [todayOrdersCount, totalOrdersCount] = await Promise.all([
      Order.countDocuments({
        $and: [riderMatchFilter, statusMatchFilter, dateMatchFilter]
      }).catch(() => 0),
      Order.countDocuments({
        $and: [riderMatchFilter, statusMatchFilter]
      }).catch(() => 0)
    ]);
    const finalOrdersCount = todayOrdersCount > 0 ? todayOrdersCount : totalOrdersCount;

    const cashInHand = Number((wallet.cashInHand || 0).toFixed(2));
    const availableBalance = Number((wallet.availableBalance || 0).toFixed(2));
    const totalEarnings = Number((wallet.totalEarnings || 0).toFixed(2));
    const amountToPay = Math.max(0, Number((cashInHand - availableBalance).toFixed(2)));

    return res.status(200).json({
      success: true,
      data: {
        balance: availableBalance,
        billable_hours: "0.0",
        today_orders: finalOrdersCount,
        orders_completed: finalOrdersCount,
        completedOrders: finalOrdersCount,
        totalDeliveries: totalOrdersCount,
        recent_requests: [],
        codBalance: cashInHand,
        codEarnings: availableBalance,
        amountToPay: amountToPay,
        cashInHand: cashInHand,
        availableBalance: availableBalance,
        wallet: {
          cashInHand,
          cashLimit: wallet.cashLimit || 2000,
          availableBalance,
          totalEarnings,
          isFrozen: wallet.isFrozen,
          frozenReason: wallet.frozenReason,
          frozenAt: wallet.frozenAt,
          lastPayoutAt: wallet.lastPayoutAt,
          lastDepositAt: wallet.lastDepositAt,
          codBalance: cashInHand,
          codEarnings: availableBalance,
          amountToPay: amountToPay,
        },
        warning: wallet.isFrozen
          ? `🚫 Account frozen! You have ₹${wallet.cashInHand} cash. Please deposit to admin to re-activate.`
          : wallet.cashInHand >= (wallet.cashLimit || 2000) * 0.8
          ? `⚠️ You have ₹${wallet.cashInHand}/${wallet.cashLimit || 2000} cash. Near limit!`
          : null,
        recentTransactions
      },
      wallet: {
        availableBalance,
        cashInHand,
        cashLimit: wallet.cashLimit || 2000,
        isFrozen: wallet.isFrozen,
        totalEarnings,
        codBalance: cashInHand,
        codEarnings: availableBalance,
        amountToPay: amountToPay,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getRiderWalletByAdmin = async (req, res) => {
  try {
    const { riderId } = req.params;
    let wallet = await RiderWallet.findOne({ rider: riderId }).populate('rider');
    if (!wallet) wallet = await RiderWallet.create({ rider: riderId });
    const transactions = await PaymentTransaction.find({ rider: riderId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('order', 'totalAmount paymentMethod status');
    return res.status(200).json({ success: true, data: { wallet, transactions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.riderDepositCash = async (req, res) => {
  try {
    const { riderId, amount } = req.body;
    if (!riderId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'riderId and positive amount required' });
    }
    const result = await riderDepositCash(riderId, parseFloat(amount), req.user._id);
    return res.status(200).json({
      success: true,
      message: result.unfrozen
        ? '✅ Cash deposited and rider account UNFROZEN'
        : `Cash deposited. Rider still has ₹${result.riderWallet.cashInHand} in hand (limit: ₹${result.riderWallet.cashLimit})`,
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.setRiderCashLimit = async (req, res) => {
  try {
    const { riderId, cashLimit } = req.body;
    if (!riderId || !cashLimit || cashLimit <= 0) {
      return res.status(400).json({ success: false, message: 'riderId and cashLimit required' });
    }
    const result = await setRiderCashLimit(riderId, parseFloat(cashLimit), req.user._id);
    return res.status(200).json({ success: true, message: 'Cash limit updated', data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getFrozenRiders = async (req, res) => {
  try {
    const frozenWallets = await RiderWallet.find({ isFrozen: true })
      .populate({ path: 'rider', populate: { path: 'user', select: 'firstName lastName email mobile' } });
    return res.status(200).json({
      success: true,
      count: frozenWallets.length,
      data: frozenWallets.map(w => ({
        riderId: w.rider._id,
        riderName: w.rider.user ? `${w.rider.user.firstName} ${w.rider.user.lastName}` : 'N/A',
        cashInHand: w.cashInHand,
        cashLimit: w.cashLimit,
        frozenAt: w.frozenAt,
        frozenReason: w.frozenReason,
        walletId: w._id
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getRestaurantWallet = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    let wallet = await RestaurantWallet.findOne({ restaurant: restaurant._id });
    if (!wallet) wallet = await RestaurantWallet.create({ restaurant: restaurant._id });
    const transactions = await PaymentTransaction.find({ restaurant: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('order', 'totalAmount paymentMethod createdAt');
    return res.status(200).json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          pendingAmount: wallet.pendingAmount,
          totalEarnings: wallet.totalEarnings,
          totalPaidOut: wallet.totalPaidOut,
          lastPayoutAt: wallet.lastPayoutAt,
          lastPayoutAmount: wallet.lastPayoutAmount,
          nextPayoutDate: wallet.nextPayoutDate,
        },
        transactions
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getRestaurantWalletByAdmin = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    let wallet = await RestaurantWallet.findOne({ restaurant: restaurantId });
    if (!wallet) wallet = await RestaurantWallet.create({ restaurant: restaurantId });
    const transactions = await PaymentTransaction.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('order', 'totalAmount paymentMethod createdAt status');
    return res.status(200).json({ success: true, data: { wallet, transactions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.getAdminSummary = async (req, res) => {
  try {
    const AdminCommissionWallet = require('../models/AdminCommissionWallet');
    const [
      totalCOD,
      totalOnline,
      totalCommission,
      totalPaidOut,
      frozenCount,
      restWalletStats,
      riderWalletStats,
      eligibleRestaurantsCount,
      eligibleRidersCount,
      adminWallet
    ] = await Promise.all([
      PaymentTransaction.aggregate([
        { $match: { type: 'cod_collected' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { type: { $in: ['online_payment', 'wallet_payment'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { type: 'restaurant_commission' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { type: { $in: ['restaurant_weekly_payout', 'rider_weekly_payout'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RiderWallet.countDocuments({ isFrozen: true }),
      RestaurantWallet.aggregate([
        {
          $group: {
            _id: null,
            pendingBalance: { $sum: '$balance' },
            totalPaidOut: { $sum: '$totalPaidOut' }
          }
        }
      ]),
      RiderWallet.aggregate([
        {
          $group: {
            _id: null,
            cashInHand: { $sum: '$cashInHand' },
            pendingBalance: { $sum: '$availableBalance' },
            totalPaidOut: { $sum: '$totalPayouts' }
          }
        }
      ]),
      RestaurantWallet.countDocuments({ balance: { $gt: 0 } }),
      RiderWallet.countDocuments({ availableBalance: { $gt: 0 } }),
      AdminCommissionWallet.getInstance()
    ]);

    const pendingRestaurantPayouts = Number((restWalletStats[0]?.pendingBalance || 0).toFixed(2));
    const pendingRiderPayouts = Number((riderWalletStats[0]?.pendingBalance || 0).toFixed(2));
    const riderCashInHand = Number((riderWalletStats[0]?.cashInHand || 0).toFixed(2));

    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) || 7));

    return res.status(200).json({
      success: true,
      data: {
        totalCODCollected: Number((totalCOD[0]?.total || 0).toFixed(2)),
        totalOnlinePayments: Number((totalOnline[0]?.total || 0).toFixed(2)),
        totalCommissionEarned: Number((totalCommission[0]?.total || 0).toFixed(2)),
        totalPaidOut: Number((totalPaidOut[0]?.total || 0).toFixed(2)),
        frozenRidersCount: frozenCount,
        riderCashInHand,
        pendingRestaurantPayouts,
        restaurantTotalPaidOut: Number((restWalletStats[0]?.totalPaidOut || 0).toFixed(2)),
        pendingRiderPayouts,
        riderTotalPaidOut: Number((riderWalletStats[0]?.totalPaidOut || 0).toFixed(2)),
        eligibleRestaurantsCount,
        eligibleRidersCount,
        totalEligiblePayout: Number((pendingRestaurantPayouts + pendingRiderPayouts).toFixed(2)),
        adminPendingCommission: Number((adminWallet?.balance || 0).toFixed(2)),
        nextScheduledPayoutDate: nextSunday.toISOString(),
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.triggerWeeklyPayout = async (req, res) => {
  try {
    const results = await processWeeklyPayouts(req.user?._id || null);
    const hasPayouts = results.totalRestaurantsPaid > 0 || results.totalRidersPaid > 0;
    const message = hasPayouts
      ? `Weekly payout complete (${results.batchId}): ${results.totalRestaurantsPaid} restaurant(s) (₹${results.totalRestaurantsAmount}) & ${results.totalRidersPaid} rider(s) (₹${results.totalRidersAmount}).`
      : 'No pending partner wallet balances (> ₹0) to disburse right now.';
    return res.status(200).json({
      success: true,
      message,
      data: results
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    let filter = {};
    if (type) {
      const types = String(type).split(',').map(t => t.trim()).filter(Boolean);
      filter = types.length > 1 ? { type: { $in: types } } : { type: types[0] };
    }
    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('order', 'orderNumber totalAmount paymentMethod status')
        .populate({
          path: 'rider',
          select: 'name fullName riderId user',
          populate: { path: 'user', select: 'name phone' }
        })
        .populate('restaurant', 'name'),
      PaymentTransaction.countDocuments(filter)
    ]);
    return res.status(200).json({
      success: true,
      data: { transactions, total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ─── GET ALL RESTAURANT WALLETS ──────────────────────────────
exports.getAllRestaurantWallets = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true })
      .select('name email phoneNumber')
      .lean();
    
    const restaurantWallets = await Promise.all(
      restaurants.map(async (restaurant) => {
        const wallet = await RestaurantWallet.findOne({ restaurant: restaurant._id }).lean();
        return {
          _id: restaurant._id,
          name: restaurant.name,
          email: restaurant.email,
          phoneNumber: restaurant.phoneNumber,
          wallet: wallet || { balance: 0, totalEarnings: 0 }
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: restaurantWallets
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL RIDER WALLETS ──────────────────────────────
exports.getAllRiderWallets = async (req, res) => {
  try {
    const riders = await Rider.find({ isActive: true })
      .populate('user', 'firstName lastName phoneNumber email')
      .select('user totalDeliveries averageRating')
      .lean();
    
    const riderWallets = await Promise.all(
      riders.map(async (rider) => {
        const wallet = await RiderWallet.findOne({ rider: rider._id }).lean();
        return {
          _id: rider._id,
          name: rider.user?.firstName + ' ' + (rider.user?.lastName || ''),
          phoneNumber: rider.user?.phoneNumber,
          email: rider.user?.email,
          totalDeliveries: rider.totalDeliveries || 0,
          averageRating: rider.averageRating || 0,
          wallet: wallet || { balance: 0, totalLifetimeEarnings: 0 }
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: riderWallets
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.calculateDeliveryFee = async (req, res) => {
  try {
    const {
      distanceKm,
      distance,
      userLocation,
      restaurantLocation,
      restaurantId,
      lat,
      lng,
      latitude,
      longitude,
      orderType,
      isSelfPickup
    } = req.body || {};

    const isPickup = orderType === 'self_pickup' || orderType === 'pickup' || orderType === 'takeaway' || isSelfPickup === true;
    if (isPickup) {
      return res.status(200).json({
        success: true,
        deliveryFee: 0,
        deliveryCharge: 0,
        fee: 0,
        distanceKm: 0,
        isSelfPickup: true,
        data: { totalDeliveryFee: 0, baseDeliveryFee: 0, surcharge: 0 }
      });
    }

    let dist = parseFloat(distanceKm || distance) || 0;

    // Check if coordinates provided via restaurantId & user lat/lng
    const userLat = parseFloat(lat ?? latitude ?? userLocation?.latitude ?? userLocation?.lat);
    const userLng = parseFloat(lng ?? longitude ?? userLocation?.longitude ?? userLocation?.lng);

    if (!dist && restaurantId && !isNaN(userLat) && !isNaN(userLng)) {
      try {
        const restaurant = await Restaurant.findById(restaurantId).select('location baseDeliveryFee perKmCharge maxDeliveryFee adminOverride');
        if (restaurant && restaurant.location?.coordinates && restaurant.location.coordinates.length === 2) {
          const [rLon, rLat] = restaurant.location.coordinates;
          const R = 6371;
          const dLat = (userLat - rLat) * Math.PI / 180;
          const dLon = (userLng - rLon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(rLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          dist = Math.round(R * c * 100) / 100;
        }
      } catch (_) {}
    } else if (!dist && userLocation && restaurantLocation) {
      const lat1 = userLocation.latitude || userLocation.lat;
      const lon1 = userLocation.longitude || userLocation.lng;
      const lat2 = restaurantLocation.latitude || restaurantLocation.lat;
      const lon2 = restaurantLocation.longitude || restaurantLocation.lng;
      if (lat1 && lon1 && lat2 && lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        dist = Math.round(R * c * 100) / 100;
      }
    }

    // Dynamic Delivery Fee from Central Admin Setting
    let finalFee = 40;
    try {
      const AdminSetting = require('../models/AdminSetting');
      const adminSetting = await AdminSetting.getSettings();
      if (adminSetting?.deliveryFeeConfig?.enabled === false) {
        finalFee = 0;
      } else {
        const { calculateSlabDeliveryFee } = require('../services/priceCalculator');
        const slabResult = calculateSlabDeliveryFee(dist, adminSetting.deliveryFeeConfig);
        finalFee = slabResult.fee;
      }
    } catch (_) {
      const charges = calculateDeliveryCharges(dist);
      finalFee = charges.totalDeliveryFee || 40;
    }

    // First User / First Order Free Delivery check
    const reqUserId = req.user?._id || req.body?.userId;
    if (finalFee > 0 && reqUserId && mongoose.Types.ObjectId.isValid(reqUserId)) {
      try {
        const AdminSetting = require('../models/AdminSetting');
        const adminSetting = await AdminSetting.getSettings();
        if (adminSetting?.deliveryFeeConfig?.firstOrderFreeDelivery !== false) {
          const Order = require('../models/Order');
          const orderCount = await Order.countDocuments({
            user: reqUserId,
            status: { $nin: ['cancelled', 'failed'] }
          });
          if (orderCount === 0) {
            finalFee = 0;
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      deliveryCharge: finalFee,
      deliveryFee: finalFee,
      fee: finalFee,
      distanceKm: dist,
      isSelfPickup: false,
      data: {
        totalDeliveryFee: finalFee,
        deliveryFee: finalFee,
        distanceKm: dist
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};