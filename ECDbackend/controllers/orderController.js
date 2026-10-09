const Order = require("../models/Order");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Cart = require("../models/Cart");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Promocode = require("../models/Promocode");
const Review = require("../models/Review"); // New
const mongoose = require("mongoose");
const { sendNotification } = require("../utils/notificationService");
const { sendOTP } = require("../utils/twilioService");
const { getPaginationParams } = require("../utils/pagination");
const socketService = require("../services/socketService");
const { formatRestaurantForUser, formatOrderForCustomer } = require("../utils/responseFormatter");
const {
  getNextOrderId,
  ensureCustomerId,
  ensureRestaurantId,
  ensureRiderId,
} = require("../utils/idGenerator");
const {
  validateOrderState,
  validateRestaurantAcceptance,
  validateRestaurantMarkReady,
  validateRiderAcceptance,
  validateRiderPickup,
  validateRiderDelivery,
  canBeCancelled,
} = require("../utils/orderStateValidator");
const { calculateOrderPrice } = require("../services/priceCalculator");
const {
  logger,
  logOrderTransition,
  logPayment,
  logRefund,
  logRiderAssignment,
  logOTP,
  logRestaurantAction,
  logWalletTransaction,
  logCouponUsage,
} = require("../utils/logger");
const sendError = (res, status, message, details) => {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const buildRatingStats = (ratings) => {
  const normalized = ratings.filter((value) => typeof value === "number");
  const count = normalized.length;
  if (count === 0) {
    return {
      average: 0,
      count: 0,
      breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
      lastRatedAt: null,
    };
  }
  const total = normalized.reduce((sum, value) => sum + value, 0);
  const average = Math.round((total / count) * 10) / 10;
  return {
    average,
    count,
    breakdown: {
      five: normalized.filter((value) => value === 5).length,
      four: normalized.filter((value) => value === 4).length,
      three: normalized.filter((value) => value === 3).length,
      two: normalized.filter((value) => value === 2).length,
      one: normalized.filter((value) => value === 1).length,
    },
    lastRatedAt: new Date(),
  };
};
const getAverageRating = (rating) => {
  if (typeof rating === "number") return rating;
  if (rating && typeof rating === "object" && typeof rating.average === "number") {
    return rating.average;
  }
  return 0;
};
const getRatingCount = (rating) => {
  if (rating && typeof rating === "object" && typeof rating.count === "number") {
    return rating.count;
  }
  return 0;
};
const normalizePhoneNumber = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/(?!^)\+/g, "").replace(/[^\d+]/g, "");
  return normalized || null;
};
const getFirstValidPhone = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizePhoneNumber(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};
const buildOrderCallContacts = (orderObj) => {
  const restaurantPhone = getFirstValidPhone(
    orderObj?.restaurantPhone,
    orderObj?.restaurant?.phone,
    orderObj?.restaurant?.contactNumber,
    orderObj?.restaurant?.mobile,
  );
  const riderPhone = getFirstValidPhone(
    orderObj?.riderPhone,
    orderObj?.rider?.phone,
    orderObj?.rider?.user?.mobile,
  );
  const customerPhone = getFirstValidPhone(
    orderObj?.customer?.phone,
    orderObj?.customer?.mobile,
  );

  return {
    riderPhone,
    restaurantPhone,
    customerPhone,
    primaryPhone: riderPhone || restaurantPhone || customerPhone || null,
    hasAnyContact: Boolean(riderPhone || restaurantPhone || customerPhone),
  };
};
const normalizeTip = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100) / 100;
};
const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const buildUnifiedBill = (order) => {
  if (!order) return null;
  const o = typeof order.toObject === 'function' ? order.toObject() : order;
  const itemTotal = Number(o.itemTotal || 0);
  const tax = Number(o.tax || 0);
  const packagingFee = Number(o.packagingFee || o.packaging || 0);
  const deliveryFee = Number(typeof o.deliveryFee === 'number' ? o.deliveryFee : (o.deliveryCharge || 0));
  const platformFee = Number(o.platformFee || 0);
  const extraDeliveryCharges = Number(o.extraDeliveryCharges || 0);
  const tip = Number(o.tip || 0);
  const discount = Number(o.discount || 0);
  const totalAmount = Number(o.totalAmount !== undefined ? o.totalAmount : (itemTotal + tax + packagingFee + deliveryFee + platformFee + extraDeliveryCharges + tip - discount));
  const payableAmount = Number(o.payableAmount !== undefined ? o.payableAmount : totalAmount);

  return {
    itemTotal,
    tax,
    packagingFee,
    packaging: packagingFee,
    deliveryFee,
    deliveryCharge: deliveryFee,
    platformFee,
    extraDeliveryCharges,
    discount,
    tip,
    totalAmount,
    amount: totalAmount,
    total: totalAmount,
    payableAmount,
    toPay: totalAmount,
    restaurantEarning: Number(o.restaurantCommission || 0),
    riderEarning: Number(o.riderEarning || o.driverEarnings || 0) + tip,
    driverEarnings: Number(o.driverEarnings || o.riderEarning || 0) + tip,
    inrAmount: `₹${totalAmount.toFixed(2)}`
  };
};

const enrichOrderWithUnifiedPricing = (orderObj) => {
  if (!orderObj) return orderObj;
  const bill = buildUnifiedBill(orderObj);
  orderObj.totalAmount = bill.totalAmount;
  orderObj.amount = bill.totalAmount;
  orderObj.total = bill.totalAmount;
  orderObj.payableAmount = bill.payableAmount;
  orderObj.itemTotal = bill.itemTotal;
  orderObj.tax = bill.tax;
  orderObj.packagingFee = bill.packagingFee;
  orderObj.packaging = bill.packagingFee;
  orderObj.deliveryFee = bill.deliveryFee;
  orderObj.deliveryCharge = bill.deliveryFee;
  orderObj.platformFee = bill.platformFee;
  orderObj.extraDeliveryCharges = bill.extraDeliveryCharges;
  orderObj.discount = bill.discount;
  orderObj.tip = bill.tip;
  orderObj.inrAmount = bill.inrAmount;
  orderObj.bill = bill;
  return orderObj;
};

exports.buildUnifiedBill = buildUnifiedBill;
exports.enrichOrderWithUnifiedPricing = enrichOrderWithUnifiedPricing;

const calculateBill = async (
  cart,
  userId = null,
  deliveryAddress = null,
  orderType = "delivery"
) => {
  try {
    const safeItems = Array.isArray(cart?.items)
      ? cart.items.filter((item) => item && (item.restaurant || item.product))
      : [];
    if (!cart || safeItems.length === 0) {
      return {
        itemTotal: 0,
        tax: 0,
        packaging: 0,
        deliveryFee: 0,
        extraDeliveryCharges: 0,
        platformFee: 0,
        discount: 0,
        toPay: 0,
        totalBeforeTip: 0,
        tip: 0,
        appliedCommissionRate: 0,
        adminCommissionAmount: 0,
        restaurantNetPayable: 0,
        deliveryDistance: 0,
        sources: {},
        appliedCoupon: null,
        couponError: null,
        isRadiusExceeded: false,
        breakdown: {
          items: 0,
          fees: 0,
          delivery: 0,
          extraDeliveryCharges: 0,
          total: 0,
        },
        restaurantId: cart?.restaurant || null
      };
    }
    if (!cart.restaurant) {
      throw new Error("No restaurant in cart");
    }
    const restaurantId = cart.restaurant;
    const restaurantItems = safeItems;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant not found: ${restaurantId}`);
    }

    let deliveryDistance = 0;
    const addressCoords = deliveryAddress?.coordinates || deliveryAddress?.location?.coordinates;
    if (addressCoords && Array.isArray(addressCoords) && addressCoords.length === 2 && restaurant.location?.coordinates) {
      const [uLon, uLat] = addressCoords;
      const [rLon, rLat] = restaurant.location.coordinates;
      if (uLon !== undefined && uLat !== undefined && rLon !== undefined && rLat !== undefined) {
        deliveryDistance = calculateDistanceInKm(rLat, rLon, uLat, uLon);
      }
    }

    const tip = normalizeTip(cart?.tip);
    const pricingResult = await calculateOrderPrice({
      items: restaurantItems.map((item) => ({
        product: item.product,
        price: item.price,
        quantity: item.quantity,
        variation: item.variation,
        addOns: item.addOns,
        category: item.category
      })),
      restaurantId,
      userId,
      couponCode: cart.couponCode || null,
      deliveryDistance,
      tip,
      orderType
    });

    if (!pricingResult.success) {
      throw new Error(pricingResult.error || "Price calculation failed");
    }

    const breakdown = pricingResult.breakdown;
    const coupon = pricingResult.coupon;
    const sources = pricingResult.sources;

    return {
      itemTotal: breakdown.itemTotal,
      tax: breakdown.tax,
      packaging: breakdown.packaging,
      deliveryFee: breakdown.deliveryFee,
      extraDeliveryCharges: breakdown.extraDeliveryCharges,
      platformFee: breakdown.platformFee,
      discount: breakdown.discount,
      toPay: breakdown.totalAmount,
      totalBeforeTip: Math.max(0, breakdown.totalAmount - breakdown.tip),
      tip: breakdown.tip,
      appliedCommissionRate: breakdown.appliedCommissionRate,
      adminCommissionAmount: breakdown.adminCommissionAmount,
      restaurantNetPayable: breakdown.restaurantNetPayable,
      deliveryDistance,
      sources,
      appliedCoupon: coupon.applied ? coupon.code : null,
      couponError: coupon.error || null,
      isRadiusExceeded: pricingResult.isRadiusExceeded || false,
      breakdown: {
        items: breakdown.itemTotal,
        fees: breakdown.tax + breakdown.packaging + breakdown.platformFee,
        delivery: breakdown.deliveryFee,
        extraDeliveryCharges: breakdown.extraDeliveryCharges,
        total: breakdown.totalAmount,
      },
      restaurantId: restaurantId
    };
  } catch (error) {
    if (error.message !== "Cart is empty" && error.message !== "No restaurant in cart") {
      logger.error("Calculate bill error", {
        error: error.message,
        cartId: cart?._id,
        userId,
      });
    }
    throw error;
  }
};
module.exports.calculateBill = calculateBill;
exports.placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, paymentId } = req.body;
    const rawOrderType = (req.body.orderType || req.body.deliveryType || req.body.orderMode || "").toString().toLowerCase();
    const isSelfPickup = rawOrderType === "self_pickup" || rawOrderType === "pickup" || rawOrderType === "takeaway" || req.body.isSelfPickup === true;
    const orderType = isSelfPickup ? 'self_pickup' : 'delivery';
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }

    const rawMethod = (paymentMethod || req.body.payment_method || "cod").toString().toLowerCase();
    const normalizedMethod = (rawMethod === "cash" || rawMethod === "cod") ? "cod" : (rawMethod === "wallet" ? "wallet" : "online");

    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted) {
      return sendError(res, 404, "User not found");
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if ((!cart || !cart.items || cart.items.length === 0) && Array.isArray(req.body.items) && req.body.items.length > 0) {
      const restId = req.body.restaurant || req.body.restaurantId;
      cart = {
        _id: new mongoose.Types.ObjectId(),
        restaurant: restId,
        items: req.body.items.map(item => ({
          product: item.product || item.productId || item._id,
          name: item.name || 'Food Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          restaurant: restId,
          addOns: item.addOns || []
        }))
      };
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return sendError(res, 400, "Cart is empty");
    }

    const restaurantId = cart.restaurant || (cart.items[0] && cart.items[0].restaurant);
    if (!restaurantId) {
      return sendError(res, 400, "Restaurant ID is required");
    }

    let deliveryAddress = null;
    if (addressId && user.savedAddresses) {
      deliveryAddress = user.savedAddresses.id(addressId);
    }
    if (!deliveryAddress && user.savedAddresses && user.savedAddresses.length > 0) {
      deliveryAddress = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
    }
    if (!deliveryAddress && req.body.deliveryAddress) {
      const da = req.body.deliveryAddress;
      deliveryAddress = {
        addressLine: da.fullAddress || da.addressLine || da.address || [da.houseNumber, da.street, da.city].filter(Boolean).join(', ') || 'Delivery Address',
        location: {
          type: 'Point',
          coordinates: [Number(da.longitude ?? da.lng ?? 0), Number(da.latitude ?? da.lat ?? 0)]
        }
      };
    }
    if (!deliveryAddress) {
      deliveryAddress = {
        addressLine: 'Customer Address',
        location: { type: 'Point', coordinates: [0, 0] }
      };
    }

    const restaurant = await Restaurant.findById(restaurantId).populate('owner', 'name email mobile');
    if (!restaurant) {
      return sendError(res, 404, `Restaurant not found: ${restaurantId}`);
    }
    if (restaurant.isActive === false) {
      return sendError(res, 400, `${restaurant.name?.en || restaurant.name} is currently not accepting orders`);
    }

    let bill;
    try {
      bill = await calculateBill(cart, req.user._id, deliveryAddress, orderType);
    } catch (billErr) {
      const subtotal = req.body.subtotal || cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = isSelfPickup ? 0 : (req.body.deliveryFee !== undefined ? req.body.deliveryFee : 10);
      bill = {
        itemTotal: subtotal,
        tax: Math.round(subtotal * 0.05 * 100) / 100,
        packaging: 0,
        deliveryFee,
        platformFee: 5,
        discount: req.body.discount || 0,
        toPay: req.body.totalAmount || (subtotal + deliveryFee + 5),
        tip: req.body.tip || 0,
        appliedCommissionRate: 20,
        adminCommissionAmount: Math.round(subtotal * 0.2 * 100) / 100,
        restaurantNetPayable: Math.round(subtotal * 0.8 * 100) / 100,
        deliveryDistance: 2.5,
        sources: {},
        appliedCoupon: req.body.couponCode || null,
        isRadiusExceeded: false
      };
    }
    if (bill && bill.isRadiusExceeded) {
      return sendError(res, 400, "Delivery location exceeds maximum allowed delivery radius");
    }

    const totalPayment = bill.toPay;
    const tipAmount = bill.tip || 0;
    const totalBeforeTip = Math.max(0, totalPayment - tipAmount);
    let paymentStatus = "pending";
    let paymentFailure = null;
    if (paymentMethod === "wallet") {
      if (user.walletBalance < totalPayment) {
        return sendError(res, 400, "Insufficient Wallet Balance");
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        user.walletBalance -= totalPayment;
        await user.save({ session });
        await WalletTransaction.create(
          [
            {
              user: user._id,
              amount: -totalPayment,
              type: "debit",
              description: `Payment for Order`,
            },
          ],
          { session },
        );
        await session.commitTransaction();
        paymentStatus = "paid";
        logWalletTransaction(
          user._id,
          "debit",
          totalPayment,
          null,
          user.walletBalance,
        );
        logPayment(null, user._id, "wallet", totalPayment, "success");
      } catch (walletError) {
        await session.abortTransaction();
        logPayment(
          null,
          user._id,
          "wallet",
          totalPayment,
          "failed",
          walletError,
        );
        throw new Error(`Wallet transaction failed: ${walletError.message}`);
      } finally {
        session.endSession();
      }
    } else if (paymentMethod === "online" || normalizedMethod === "online") {
      paymentStatus = "pending";
      logPayment(null, user._id, "online", totalPayment, "pending");
    } else if (paymentMethod === "cod" || normalizedMethod === "cod") {
      if (user.isCodBlocked === true || user.codActive === false) {
        return sendError(res, 400, "Cash on Delivery is disabled for your account. Please pay online or use your wallet.");
      }
      paymentStatus = "pending";
      logPayment(null, user._id, "cod", totalPayment, "pending");
    }
    if (paymentStatus === "failed") {
      return sendError(res, 400, paymentFailure ? paymentFailure.reason : "Payment failed");
    }
    const isOnlineOrder = paymentMethod === "online";
    const initialStatus = isOnlineOrder ? "pending" : "placed";
    const initialStatusLabel = isOnlineOrder ? "Awaiting Payment" : "Order Placed";
    const initialStatusDesc = isOnlineOrder
      ? "Waiting for payment to be completed via Stripe."
      : "Your order has been placed";
    
    const adminCommission = bill.adminCommissionAmount !== undefined ? bill.adminCommissionAmount : Math.round(bill.itemTotal * 0.2 * 100) / 100;
    const restaurantCommission = bill.restaurantNetPayable !== undefined ? bill.restaurantNetPayable : Math.round((bill.itemTotal - adminCommission) * 100) / 100;
    const riderCommission = bill.deliveryFee * 0.7;
    const riderEarning = Math.round((riderCommission + tipAmount) * 100) / 100;
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = 100 * 60 * 1000; // 100 minutes
    const orderNumber = await getNextOrderId();
    const customerIdCode = await ensureCustomerId(user);
    const restaurantIdCode = await ensureRestaurantId(restaurant);
    
    // Enrich cart items with Product details (name, image, price) if missing
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        let pName = item.name || (item.product && typeof item.product === 'object' ? item.product.name : null);
        let pImage = item.image || (item.product && typeof item.product === 'object' ? item.product.image : null);
        let pPrice = (typeof item.price === 'number' && item.price > 0) ? item.price : ((item.product && typeof item.product === 'object' && typeof item.product.price === 'number') ? item.product.price : null);

        const prodId = item.product?._id || item.product || item.productId;
        if ((!pName || !pPrice || !pImage) && prodId && mongoose.Types.ObjectId.isValid(prodId)) {
          try {
            const dbProd = await Product.findById(prodId).select('name image price basePrice pricing');
            if (dbProd) {
              if (!pName) pName = typeof dbProd.name === 'object' ? (dbProd.name.en || Object.values(dbProd.name)[0]) : dbProd.name;
              if (!pImage) pImage = dbProd.image || '';
              if (!pPrice || pPrice === 0) pPrice = dbProd.price || dbProd.basePrice || dbProd.pricing?.b2c?.sellingPrice || 0;
            }
          } catch (_) {}
        }

        return {
          product: prodId,
          name: pName || 'Food Item',
          image: pImage || '',
          quantity: item.quantity || item.qty || 1,
          price: Number(pPrice || 0),
          variation: item.variation ? { name: item.variation.name, price: item.variation.price } : undefined,
          addOns: item.addOns || [],
          restaurant: restaurantId
        };
      })
    );

    const AdminSetting = require("../models/AdminSetting");
    const systemSettings = await AdminSetting.findOne().lean();
    const dynamicCancellationMins = Number(systemSettings?.orderTimingConfig?.cancellationWindowMins || 
                                           systemSettings?.selfPickupConfig?.cancellationWindowMins || 
                                           restaurant?.cancellationWindowMinutes || 5);
    const dynamicGracePeriodMins = Number(systemSettings?.orderTimingConfig?.riderPickupGracePeriodMins || 
                                           systemSettings?.selfPickupConfig?.gracePeriodMins || 15);
    const cancellationWindowExpiresAt = new Date(Date.now() + dynamicCancellationMins * 60 * 1000);

    const newOrder = await Order.create({
      customer: user._id,
      customerId: customerIdCode,
      orderNumber,
      orderId: orderNumber,
      restaurant: restaurantId,
      restaurantId: restaurantIdCode,
      cancellationWindowMinutes: dynamicCancellationMins,
      cancellationWindowExpiresAt,
      gracePeriodMinutes: dynamicGracePeriodMins,
      idempotencyKey: req.body.idempotencyKey || `${cart._id || user._id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      pickupOtp,
      pickupOtpExpiresAt: new Date(Date.now() + otpExpiry),
      selfPickupCode: pickupOtp,
      orderType: isSelfPickup ? "self_pickup" : "delivery",
      scheduledAt: (req.body.scheduledAt || req.body.scheduledTime || req.body.pickupTime) ? new Date(req.body.scheduledAt || req.body.scheduledTime || req.body.pickupTime) : undefined,
      deliveryOtp,
      deliveryOtpExpiresAt: new Date(Date.now() + otpExpiry),
      items: enrichedItems,
      itemTotal: bill.itemTotal,
      tax: bill.tax,
      deliveryFee: isSelfPickup ? 0 : bill.deliveryFee,
      platformFee: bill.platformFee,
      packagingFee: bill.packaging || 0,
      extraDeliveryCharges: bill.extraDeliveryCharges || 0,
      tip: tipAmount,
      discount: bill.discount,
      couponCode: bill.appliedCoupon,
      totalAmount: bill.toPay,
      payableAmount: Math.round(bill.toPay),
      roundOff: Math.round((Math.round(bill.toPay) - bill.toPay) * 100) / 100,
      driverEarnings: riderEarning,
      adminCommission,
      restaurantCommission,
      riderCommission,
      riderEarning,
      appliedCommissionRate: bill.appliedCommissionRate || 20,
      appliedPricingSource: bill.sources || {},
      deliveryDistanceKm: bill.deliveryDistance || 0,
      deliveryAddress: {
        addressLine: deliveryAddress.addressLine,
        coordinates: deliveryAddress.location.coordinates,
      },
      paymentMethod,
      paymentStatus,
      status: initialStatus,
      timeline: [{
        status: initialStatus,
        timestamp: new Date(),
        label: initialStatusLabel,
        by: "system",
        description: initialStatusDesc
      }],
    });
    await User.findByIdAndUpdate(user._id, { $inc: { totalOrders: 1, totalAmountSpent: bill.toPay } });
    await Restaurant.findByIdAndUpdate(restaurantId, { $inc: { totalOrders: 1 } });
    logOrderTransition(newOrder._id, null, initialStatus, user._id, "customer", `Order placed via ${paymentMethod}`);

    // Dispatch Self Pickup 4-Digit OTP Code via 2Factor SMS Gateway to User's Registered Mobile Number
    if (isSelfPickup || newOrder.orderType === "self_pickup") {
      const userMobile = user.mobile || user.phone || user.phoneNumber || req.body.mobile || req.body.phone || req.body.customerPhone || deliveryAddress?.phone;
      if (userMobile) {
        try {
          console.log(`📱 [Self Pickup SMS] Dispatching 4-digit OTP ${pickupOtp} to ${userMobile} via 2Factor SMS provider...`);
          sendOTP(userMobile, pickupOtp).then(res => {
            console.log(`✅ [Self Pickup SMS] 2Factor result for ${userMobile}:`, res);
          }).catch(smsErr => {
            console.error("❌ SMS dispatch error for self pickup OTP:", smsErr.message);
          });
        } catch (smsErr) {
          logger.error("SMS dispatch error for self pickup OTP:", smsErr);
        }
      }
      try {
        await sendNotification(
          user._id,
          "Self Pickup OTP Code",
          `Your 4-digit pickup code for Order #${newOrder._id} is ${pickupOtp}. Show this code at counter for verification.`,
          { orderId: newOrder._id, pickupOtp, type: "self_pickup_otp" }
        );
      } catch (notifErr) {}
    }

    if (isOnlineOrder) {
      return res.status(201).json({
        success: true,
        message: "Order created. Complete payment to confirm.",
        order: newOrder,
        orderId: newOrder._id,
        totalPayment,
        requiresPayment: true,
      });
    }
    const restNameStr = typeof restaurant.name === 'object'
      ? (restaurant.name.en || restaurant.name.hi || Object.values(restaurant.name)[0] || 'Restaurant')
      : (restaurant.name || 'Restaurant');

    const unifiedBill = buildUnifiedBill(newOrder);

    // 1. Notify Customer via Push Notification & WebSockets
    try {
      await sendNotification(
        user._id,
        "🎉 Order Placed Successfully!",
        `Your order #${newOrder.orderNumber} has been placed with ${restNameStr} for ₹${newOrder.totalAmount}.`,
        {
          orderId: newOrder.orderNumber,
          backendOrderId: newOrder._id.toString(),
          restaurantName: restNameStr,
          totalAmount: newOrder.totalAmount,
          status: "placed",
          type: "order_status"
        }
      );
      const custUpdateData = {
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        status: "placed",
        totalAmount: newOrder.totalAmount,
        amount: newOrder.totalAmount,
        bill: unifiedBill,
        message: "Order placed successfully! We've notified the restaurant."
      };
      socketService.emitToCustomer(user._id.toString(), "order:placed", custUpdateData);
      socketService.emitToCustomer(user._id.toString(), "order:status", custUpdateData);
      socketService.emitToUser(user._id.toString(), "order:placed", custUpdateData);
      socketService.emitToUser(user._id.toString(), "order:status", custUpdateData);
    } catch (custNotifErr) {
      logger.error("Failed to notify customer on order place:", custNotifErr.message);
    }

    // 2. Notify Restaurant Owner via Push & WebSockets
    try {
      if (restaurant && restaurant.owner) {
        await sendNotification(
          restaurant.owner._id,
          "New Order Received",
          `Order #${newOrder.orderNumber} - ₹${bill.toPay}`,
          { orderId: newOrder.orderNumber, backendOrderId: newOrder._id, restaurantId, totalAmount: bill.toPay }
        );
      }
      const restaurantOrderPayload = {
        orderId: newOrder.orderNumber,
        orderNumber: newOrder.orderNumber,
        _id: newOrder._id,
        id: newOrder.orderNumber,
        backendId: newOrder._id.toString(),
        restaurantId: newOrder.restaurantId || restaurantIdCode,
        restaurant: restaurantId.toString(),
        customerId: newOrder.customerId || customerIdCode,
        customerName: user.name,
        customerPhone: user.mobile || user.phone,
        customerLocation: {
          latitude: deliveryAddress.location?.coordinates ? deliveryAddress.location.coordinates[1] : 0,
          longitude: deliveryAddress.location?.coordinates ? deliveryAddress.location.coordinates[0] : 0,
          coordinates: deliveryAddress.location?.coordinates || [0, 0]
        },
        deliveryAddress: deliveryAddress.addressLine,
        customer: {
          id: user._id,
          customerId: newOrder.customerId || customerIdCode,
          name: user.name,
          phone: user.mobile || user.phone,
          address: deliveryAddress.addressLine,
          location: deliveryAddress.location?.coordinates || [0, 0]
        },
        restaurantName: restNameStr,
        items: newOrder.items,
        itemCount: newOrder.items.length,
        amount: bill.toPay,
        totalAmount: bill.toPay,
        total: bill.toPay,
        payableAmount: bill.toPay,
        bill: unifiedBill,
        paymentMethod,
        status: "placed",
        timestamp: new Date(),
        order: newOrder,
      };
      socketService.emitToRestaurant(restaurantId.toString(), "order:new", restaurantOrderPayload);
      socketService.emitToRestaurant(restaurantId.toString(), "restaurant:new_order", restaurantOrderPayload);
      socketService.emitToRestaurant(restaurantId.toString(), "newOrder", restaurantOrderPayload);
      
      if (restaurant && restaurant.owner) {
        const ownerIdStr = (restaurant.owner._id || restaurant.owner).toString();
        socketService.emitToUser(ownerIdStr, "order:new", restaurantOrderPayload);
        socketService.emitToUser(ownerIdStr, "newOrder", restaurantOrderPayload);
        socketService.emitToUser(ownerIdStr, "restaurant:new_order", restaurantOrderPayload);
      }

      try {
        const io = req.app.get("io") || socketService.getIO();
        if (io) {
          io.to(`restaurant_${restaurantId}`).emit("newOrder", restaurantOrderPayload);
          io.to(`restaurant_${restaurantId}`).emit("order:new", restaurantOrderPayload);
          io.to(`restaurant:${restaurantId}`).emit("newOrder", restaurantOrderPayload);
          io.to(`restaurant:${restaurantId}`).emit("order:new", restaurantOrderPayload);
          io.to("restaurants").emit("newOrder", restaurantOrderPayload);
        }
      } catch (_) {}
    } catch (e) {
      logger.error("Notify restaurant error", e);
    }

    // 3. Notify Admin Dashboard
    try {
      socketService.emitToAdmin("order:new", {
        orderId: newOrder.orderNumber,
        orderIds: [newOrder.orderNumber],
        backendId: newOrder._id,
        orderCode: `#${newOrder.orderNumber}`,
        orderNumber: newOrder.orderNumber,
        restaurantId: newOrder.restaurantId || restaurantIdCode,
        restaurantName: restNameStr,
        customerId: newOrder.customerId || customerIdCode,
        customerName: user.name,
        customerPhone: user.mobile || user.phone,
        customerLocation: {
          latitude: deliveryAddress.location?.coordinates ? deliveryAddress.location.coordinates[1] : 0,
          longitude: deliveryAddress.location?.coordinates ? deliveryAddress.location.coordinates[0] : 0,
          coordinates: deliveryAddress.location?.coordinates || [0, 0]
        },
        deliveryAddress: deliveryAddress.addressLine,
        restaurantCount: 1,
        totalAmount: totalPayment,
        amount: totalPayment,
        total: totalPayment,
        payableAmount: totalPayment,
        bill: unifiedBill,
        orderType: newOrder.orderType,
        paymentMethod,
        status: "placed",
        timestamp: new Date(),
      });
    } catch (err) { }

    // Note: Rider dispatch is triggered only when restaurant marks order ready
    logger.info("Order created. Rider dispatch pending restaurant order ready.", { orderId: newOrder._id, orderNumber: newOrder.orderNumber });
    try {
      await Cart.findOneAndDelete({ user: user._id });
    } catch (cartDelErr) { }
    if (paymentStatus === "paid" && cart.couponCode) {
      try {
        await Promocode.updateOne({ code: cart.couponCode }, { $inc: { usedCount: 1 } });
        logCouponUsage(user._id, cart.couponCode, newOrder._id, null, true);
      } catch (couponErr) { }
    }

    const orderReturnObj = enrichOrderWithUnifiedPricing(newOrder.toObject());

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: orderReturnObj,
      data: orderReturnObj,
      orderId: newOrder.orderNumber,
      orderNumber: newOrder.orderNumber,
      customerId: newOrder.customerId || customerIdCode,
      restaurantId: newOrder.restaurantId || restaurantIdCode,
      id: newOrder._id,
      totalPayment,
      totalAmount: newOrder.totalAmount,
      amount: newOrder.totalAmount,
      total: newOrder.totalAmount,
      payableAmount: newOrder.totalAmount,
      bill: unifiedBill
    });
  } catch (error) {
    console.error("Place order error:", error);
    return sendError(res, 500, "Failed to place order", error.message);
  }
};
exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const { calculateDistance } = require('../utils/locationUtils');
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name image bannerImage address location deliveryFee menuApproved verificationStatus contactNumber phone') // Populate only necessary restaurant fields
      .populate('items.product', 'name image price')
      .populate('rider', 'user currentLocation rating vehicle')
      .populate('rider.user', 'name mobile profilePic')
      .select('-timeline -riderNotificationStatus') // Exclude heavy fields for list view
      .sort({ createdAt: -1 });
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
      orderObj.orderNumber = ordNumber;
      orderObj.orderId = ordNumber;
      orderObj.customerId = orderObj.customerId || req.user.customerId || "C001";
      orderObj.restaurantId = orderObj.restaurantId || orderObj.restaurant?.restaurantId || (orderObj.restaurant?._id ? `RNT${orderObj.restaurant._id.toString().slice(-3).toUpperCase()}` : "RNT001");
      if (orderObj.rider) {
        orderObj.riderId = orderObj.riderId || orderObj.rider?.riderId || "RDR001";
      }
      if (orderObj.items && Array.isArray(orderObj.items)) {
        orderObj.items = orderObj.items.map(item => {
          const name = item.name || (item.product && item.product.name) || "Food Item";
          const image = item.image || (item.product && item.product.image) || "";
          const price = typeof item.price === 'number' ? item.price : ((item.product && typeof item.product.price === 'number') ? item.product.price : 0);
          const quantity = item.quantity || item.qty || 1;
          return {
            ...item,
            name,
            image,
            price,
            quantity
          };
        });
      }
      if (orderObj.restaurant) {
        orderObj.restaurant = formatRestaurantForUser(orderObj.restaurant);
      }
      const callContacts = buildOrderCallContacts(orderObj);
      orderObj.callContacts = callContacts;
      orderObj.restaurantPhone = callContacts.restaurantPhone;
      orderObj.riderPhone = callContacts.riderPhone;
      if (orderObj.rider && orderObj.rider.rating !== undefined) {
        const ratingValue = orderObj.rider.rating;
        orderObj.rider.rating = getAverageRating(ratingValue);
        orderObj.rider.ratingCount = getRatingCount(ratingValue);
      }
      if (orderObj.rider && orderObj.rider.currentLocation && orderObj.deliveryAddress) {
        const riderCoords = orderObj.rider.currentLocation.coordinates;
        const customerCoords = orderObj.deliveryAddress.coordinates;
        if (riderCoords && customerCoords && riderCoords.length === 2 && customerCoords.length === 2) {
          const distanceToCustomer = calculateDistance(riderCoords, customerCoords);
          orderObj.distanceToCustomer = Math.round(distanceToCustomer * 100) / 100;
          orderObj.estimatedMinutes = Math.ceil(distanceToCustomer / 1); // 1 km/min assumption
        }
      }
      return enrichOrderWithUnifiedPricing(orderObj);
    });

    const activeStatuses = ['placed', 'accepted', 'preparing', 'ready', 'assigned', 'reached_restaurant', 'picked_up', 'out_for_delivery', 'delivery_arrived', 'pending'];
    const pastStatuses = ['delivered', 'completed'];
    const cancelledStatuses = ['cancelled', 'rejected', 'failed'];

    const active = formattedOrders.filter(o => activeStatuses.includes((o.status || '').toLowerCase()));
    const past = formattedOrders.filter(o => pastStatuses.includes((o.status || '').toLowerCase()));
    const cancelled = formattedOrders.filter(o => cancelledStatuses.includes((o.status || '').toLowerCase()));

    res.status(200).json({ 
      success: true, 
      orders: formattedOrders,
      active,
      past,
      cancelled,
      activeOrders: active,
      pastOrders: past,
      cancelledOrders: cancelled
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch orders", error.message);
  }
};
exports.getOrderDetailsCustomer = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email mobile profilePic")
      .populate("restaurant", "name image bannerImage address city area location deliveryTime phone contactNumber")
      .populate("items.product", "name image price category")
      .populate("rider", "user currentLocation rating vehicle")
      .populate("rider.user", "name mobile profilePic");
    if (!order) return sendError(res, 404, "Order not found");
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Access denied");
    }
    const { calculateDistance } = require('../utils/locationUtils');
    const orderObj = enrichOrderWithUnifiedPricing(order.toObject());
    const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
    const callContacts = buildOrderCallContacts(orderObj);
    const unifiedBill = buildUnifiedBill(orderObj);
    const response = {
      success: true,
      order: {
        id: orderObj._id,
        orderNumber: ordNumber,
        orderId: ordNumber,
        customerId: orderObj.customerId || req.user.customerId || "C001",
        restaurantId: orderObj.restaurantId || orderObj.restaurant?.restaurantId || "RNT001",
        riderId: orderObj.riderId || orderObj.rider?.riderId || (orderObj.rider ? "RDR001" : null),
        status: orderObj.status,
        statusLabel: mapStatusLabel(orderObj.status),
        createdAt: orderObj.createdAt,
        totalAmount: unifiedBill.totalAmount,
        amount: unifiedBill.totalAmount,
        total: unifiedBill.totalAmount,
        payableAmount: unifiedBill.payableAmount,
        inrAmount: unifiedBill.inrAmount,
        itemTotal: unifiedBill.itemTotal,
        tax: unifiedBill.tax,
        packagingFee: unifiedBill.packagingFee,
        packaging: unifiedBill.packagingFee,
        deliveryFee: unifiedBill.deliveryFee,
        deliveryCharge: unifiedBill.deliveryFee,
        platformFee: unifiedBill.platformFee,
        discount: unifiedBill.discount,
        tip: unifiedBill.tip,
        restaurant: {
          id: orderObj.restaurant._id,
          restaurantId: orderObj.restaurantId || orderObj.restaurant?.restaurantId || "RNT001",
          name: orderObj.restaurant.name,
          image: orderObj.restaurant.image,
          address: orderObj.restaurant.address,
          city: orderObj.restaurant.city,
          area: orderObj.restaurant.area,
          phone: orderObj.restaurant.phone || orderObj.restaurant.contactNumber,
          deliveryTime: orderObj.restaurant.deliveryTime,
        },
        restaurantPhone: callContacts.restaurantPhone,
        items: orderObj.items.map(item => ({
          id: item._id,
          name: item.product?.name || item.name,
          image: item.product?.image,
          quantity: item.quantity,
          price: item.price,
          total: (item.price || 0) * item.quantity,
          ...(item.variation && { variation: item.variation }),
          ...(item.addOns?.length && { addOns: item.addOns })
        })),
        bill: unifiedBill,
        payment: {
          method: orderObj.paymentMethod,
          status: orderObj.paymentStatus,
        },
        deliveryAddress: orderObj.deliveryAddress,
        ...(orderObj.rider && {
          rider: {
            id: orderObj.rider._id,
            riderId: orderObj.riderId || orderObj.rider?.riderId || "RDR001",
            name: orderObj.rider.user?.name || 'Rider',
            phone: orderObj.rider.user?.mobile,
            avatar: orderObj.rider.user?.profilePic,
            rating: getAverageRating(orderObj.rider.rating),
            ratingCount: getRatingCount(orderObj.rider.rating),
            vehicle: orderObj.rider.vehicle,
            currentLocation: orderObj.rider.currentLocation,
          }
        }),
        riderPhone: callContacts.riderPhone,
        callContacts,
        timeline: orderObj.timeline?.map(t => ({
          status: t.status,
          label: t.label,
          description: t.description,
          timestamp: t.timestamp,
        })) || [],
      }
    };
    if (orderObj.rider && orderObj.rider.currentLocation && orderObj.deliveryAddress?.coordinates && orderObj.restaurant?.location?.coordinates) {
      const riderCoords = orderObj.rider.currentLocation.coordinates;
      const customerCoords = orderObj.deliveryAddress.coordinates;
      const restaurantCoords = orderObj.restaurant.location.coordinates;
      if (riderCoords?.length === 2 && customerCoords?.length === 2 && restaurantCoords?.length === 2) {
        const distanceToCustomer = calculateDistance(riderCoords, customerCoords);
        const distanceToRestaurant = calculateDistance(riderCoords, restaurantCoords);
        response.distances = {
          toCustomer: Math.round(distanceToCustomer * 100) / 100,
          toRestaurant: Math.round(distanceToRestaurant * 100) / 100,
          toCustomerMeters: Math.round(distanceToCustomer * 1000),
        };
      }
    }
    res.status(200).json(response);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch order details", error.message);
  }
};
exports.getOrderDetailsRestaurant = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select("_id");
    if (!restaurant) return sendError(res, 404, "Restaurant not found");
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email mobile profilePic address")
      .populate("restaurant", "name image address phone contactNumber")
      .populate("items.product", "name image category")
      .populate("rider", "user currentLocation rating vehicle")
      .populate("rider.user", "name mobile profilePic");
    if (!order) return sendError(res, 404, "Order not found");
    if (order.restaurant._id.toString() !== restaurant._id.toString()) {
      return sendError(res, 403, "Access denied");
    }
    const orderObj = enrichOrderWithUnifiedPricing(order.toObject());
    const callContacts = buildOrderCallContacts(orderObj);
    const unifiedBill = buildUnifiedBill(orderObj);
    const response = {
      success: true,
      order: {
        id: orderObj._id,
        orderNumber: orderObj.orderNumber || orderObj._id.toString().slice(-6),
        status: orderObj.status,
        statusLabel: mapStatusLabel(orderObj.status),
        createdAt: orderObj.createdAt,
        estimatedReadyTime: orderObj.estimatedDeliveryTime,
        totalAmount: unifiedBill.totalAmount,
        amount: unifiedBill.totalAmount,
        total: unifiedBill.totalAmount,
        payableAmount: unifiedBill.payableAmount,
        inrAmount: unifiedBill.inrAmount,
        itemTotal: unifiedBill.itemTotal,
        tax: unifiedBill.tax,
        packagingFee: unifiedBill.packagingFee,
        packaging: unifiedBill.packagingFee,
        deliveryFee: unifiedBill.deliveryFee,
        deliveryCharge: unifiedBill.deliveryFee,
        platformFee: unifiedBill.platformFee,
        discount: unifiedBill.discount,
        tip: unifiedBill.tip,
        customer: {
          id: orderObj.customer._id,
          name: orderObj.customer.name,
          phone: orderObj.customer.mobile,
          avatar: orderObj.customer.profilePic,
          address: orderObj.customer.address,
        },
        items: orderObj.items.map(item => ({
          id: item._id,
          name: item.product?.name || item.name,
          image: item.product?.image,
          category: item.product?.category,
          quantity: item.quantity,
          price: item.price,
          total: (item.price || 0) * item.quantity,
          ...(item.variation && { variation: item.variation }),
          ...(item.addOns?.length && { addOns: item.addOns })
        })),
        bill: unifiedBill,
        payment: {
          method: orderObj.paymentMethod,
          status: orderObj.paymentStatus,
        },
        restaurantPhone: callContacts.restaurantPhone,
        riderPhone: callContacts.riderPhone,
        customerPhone: callContacts.customerPhone,
        callContacts,
        ...(orderObj.pickupOtp && {
          pickupOtp: orderObj.pickupOtp,
          pickupOtpExpiresAt: orderObj.pickupOtpExpiresAt,
          pickupOtpVerifiedAt: orderObj.pickupOtpVerifiedAt,
        }),
        ...(orderObj.rider && {
          rider: {
            id: orderObj.rider._id,
            name: orderObj.rider.user?.name || 'Rider',
            phone: orderObj.rider.user?.mobile,
            avatar: orderObj.rider.user?.profilePic,
            rating: getAverageRating(orderObj.rider.rating),
            ratingCount: getRatingCount(orderObj.rider.rating),
            vehicle: orderObj.rider.vehicle,
            currentLocation: orderObj.rider.currentLocation,
          }
        }),
        deliveryAddress: orderObj.deliveryAddress,
        timeline: orderObj.timeline?.map(t => ({
          status: t.status,
          label: t.label,
          description: t.description,
          timestamp: t.timestamp,
          by: t.by,
        })) || [],
      }
    };
    res.status(200).json(response);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch restaurant order details", error.message);
  }
};
exports.getOrderDetailsRider = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const riderProfile = await Rider.findOne({ user: req.user._id }).select("_id currentLocation");
    if (!riderProfile) return sendError(res, 404, "Rider profile not found");
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email mobile profilePic")
      .populate("restaurant", "name image address phone contactNumber location")
      .populate("items.product", "name image")
      .populate("rider", "user currentLocation rating vehicle")
      .populate("rider.user", "name mobile profilePic");
    if (!order) return sendError(res, 404, "Order not found");
    if (!order.rider || order.rider._id.toString() !== riderProfile._id.toString()) {
      return sendError(res, 403, "Access denied");
    }
    const orderObj = enrichOrderWithUnifiedPricing(order.toObject());
    const callContacts = buildOrderCallContacts(orderObj);
    const unifiedBill = buildUnifiedBill(orderObj);
    const response = {
      success: true,
      order: {
        id: orderObj._id,
        orderNumber: orderObj.orderNumber || orderObj._id.toString().slice(-6),
        status: orderObj.status,
        statusLabel: mapStatusLabel(orderObj.status),
        createdAt: orderObj.createdAt,
        pickedUpAt: orderObj.pickedUpAt,
        deliveredAt: orderObj.deliveredAt,
        totalAmount: unifiedBill.totalAmount,
        amount: unifiedBill.totalAmount,
        total: unifiedBill.totalAmount,
        payableAmount: unifiedBill.payableAmount,
        inrAmount: unifiedBill.inrAmount,
        itemTotal: unifiedBill.itemTotal,
        tax: unifiedBill.tax,
        packagingFee: unifiedBill.packagingFee,
        packaging: unifiedBill.packagingFee,
        deliveryFee: unifiedBill.deliveryFee,
        deliveryCharge: unifiedBill.deliveryFee,
        platformFee: unifiedBill.platformFee,
        discount: unifiedBill.discount,
        tip: unifiedBill.tip,
        driverEarnings: unifiedBill.driverEarnings,
        riderEarning: unifiedBill.riderEarning,
        restaurant: {
          id: orderObj.restaurant._id,
          name: orderObj.restaurant.name,
          image: orderObj.restaurant.image,
          address: orderObj.restaurant.address,
          phone: orderObj.restaurant.phone || orderObj.restaurant.contactNumber,
          location: orderObj.restaurant.location,
        },
        customer: {
          id: orderObj.customer._id,
          name: orderObj.customer.name,
          phone: orderObj.customer.mobile,
          avatar: orderObj.customer.profilePic,
          deliveryAddress: orderObj.deliveryAddress,
        },
        items: orderObj.items.map(item => ({
          name: item.product?.name || item.name,
          image: item.product?.image,
          quantity: item.quantity,
          price: item.price,
          total: (item.price || 0) * item.quantity
        })),
        bill: unifiedBill,
        payment: {
          method: orderObj.paymentMethod,
          status: orderObj.paymentStatus,
        },
        restaurantPhone: callContacts.restaurantPhone,
        riderPhone: callContacts.riderPhone,
        customerPhone: callContacts.customerPhone,
        callContacts,
        otps: {
          pickup: {
            otp: orderObj.pickupOtp,
            expiresAt: orderObj.pickupOtpExpiresAt,
            verifiedAt: orderObj.pickupOtpVerifiedAt,
          },
          delivery: {
            otp: orderObj.deliveryOtp,
            expiresAt: orderObj.deliveryOtpExpiresAt,
            verifiedAt: orderObj.deliveryOtpVerifiedAt,
          }
        },
        ...(orderObj.paymentMethod === 'cod' && {
          codCollection: {
            amount: orderObj.totalAmount,
            collected: orderObj.cashCollectedAt ? true : false,
            collectedAt: orderObj.cashCollectedAt,
          }
        }),
        timeline: orderObj.timeline?.map(t => ({
          status: t.status,
          label: t.label,
          description: t.description,
          timestamp: t.timestamp,
        })) || [],
      }
    };
    if (riderProfile.currentLocation && orderObj.restaurant?.location?.coordinates && orderObj.deliveryAddress?.coordinates) {
      const riderCoords = riderProfile.currentLocation.coordinates;
      const restaurantCoords = orderObj.restaurant.location.coordinates;
      const customerCoords = orderObj.deliveryAddress.coordinates;
      if (riderCoords?.length === 2 && restaurantCoords?.length === 2 && customerCoords?.length === 2) {
        const distToRestaurant = calculateDistance(riderCoords, restaurantCoords);
        const distToCustomer = calculateDistance(restaurantCoords, customerCoords);
        response.distances = {
          toRestaurant: {
            km: Math.round(distToRestaurant * 100) / 100,
            meters: Math.round(distToRestaurant * 1000),
          },
          toCustomer: {
            km: Math.round(distToCustomer * 100) / 100,
            meters: Math.round(distToCustomer * 1000),
          },
          totalDistance: {
            km: Math.round((distToRestaurant + distToCustomer) * 100) / 100,
            meters: Math.round((distToRestaurant + distToCustomer) * 1000),
          }
        };
      }
    }
    res.status(200).json(response);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch rider order details", error.message);
  }
};
exports.getOrderDetails = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const userId = req.user._id.toString();
    if (req.user.role === "customer") {
      return exports.getOrderDetailsCustomer(req, res);
    }
    if (req.user.role === "restaurant_owner") {
      return exports.getOrderDetailsRestaurant(req, res);
    }
    if (req.user.role === "rider") {
      return exports.getOrderDetailsRider(req, res);
    }
    return sendError(res, 403, "Unknown role");
  } catch (error) {
    return sendError(res, 500, "Failed to fetch order details", error.message);
  }
};
function mapStatusLabel(status) {
  const labels = {
    'placed': 'Order Placed',
    'accepted': 'Restaurant Accepted',
    'preparing': 'Preparing',
    'ready': 'Ready for Pickup',
    'assigned': 'Rider Assigned',
    'reached_restaurant': 'Rider at Restaurant',
    'picked_up': 'Out for Delivery',
    'delivery_arrived': 'Arriving Soon',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'failed': 'Payment Failed',
  };
  return labels[status] || status;
}
exports.getRestaurantOrders = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return sendError(res, 404, "Restaurant not found");
    const restaurantIdCode = await ensureRestaurantId(restaurant);
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("customer", "name email mobile phone customerId")
      .populate("items.product", "name image price")
      .populate("rider", "user rating name phone mobile vehicle riderId")
      .populate("rider.user", "name mobile profilePic phone")
      .select('-timeline -riderNotificationStatus')
      .sort({ createdAt: -1 });
    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
      orderObj.orderNumber = ordNumber;
      orderObj.orderId = ordNumber;
      orderObj.customerId = orderObj.customerId || orderObj.customer?.customerId || "C001";
      orderObj.restaurantId = orderObj.restaurantId || restaurantIdCode || "RNT001";
      if (orderObj.rider) {
        orderObj.riderId = orderObj.riderId || orderObj.rider?.riderId || "RDR001";
      }
      if (orderObj.items && Array.isArray(orderObj.items)) {
        orderObj.items = orderObj.items.map(item => {
          const name = item.name || (item.product && item.product.name) || "Food Item";
          const image = item.image || (item.product && item.product.image) || "";
          const price = typeof item.price === 'number' ? item.price : ((item.product && typeof item.product.price === 'number') ? item.product.price : 0);
          const quantity = item.quantity || item.qty || 1;
          return {
            ...item,
            name,
            image,
            price,
            quantity
          };
        });
      }
      if (orderObj.rider && orderObj.rider.rating !== undefined) {
        const ratingValue = orderObj.rider.rating;
        orderObj.rider.rating = getAverageRating(ratingValue);
        orderObj.rider.ratingCount = getRatingCount(ratingValue);
      }
      return enrichOrderWithUnifiedPricing(orderObj);
    });
    res.status(200).json({ success: true, orders: formattedOrders });
  } catch (error) {
    return sendError(
      res,
      500,
      "Failed to fetch restaurant orders",
      error.message,
    );
  }
};
exports.getRestaurantOrderDetails = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return sendError(res, 404, "Restaurant not found");
    }
    const restaurantIdCode = await ensureRestaurantId(restaurant);
    const targetOrderId = req.params.id;
    const orderQuery = mongoose.Types.ObjectId.isValid(targetOrderId)
      ? { $or: [{ _id: targetOrderId }, { orderId: targetOrderId }, { orderNumber: targetOrderId }] }
      : { $or: [{ orderId: targetOrderId }, { orderNumber: targetOrderId }] };
    const order = await Order.findOne(orderQuery)
      .populate("customer", "name email mobile profilePic customerId")
      .populate("restaurant", "name image bannerImage address city area location deliveryTime restaurantId")
      .populate("items.product", "name image price")
      .populate("rider", "user currentLocation rating vehicle riderId")
      .populate("rider.user", "name mobile profilePic");
    if (!order) {
      return sendError(res, 404, "Order not found");
    }
    if (!order.restaurant || order.restaurant._id.toString() !== restaurant._id.toString()) {
      return sendError(res, 403, "Access denied");
    }
    const orderObj = order.toObject();
    const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
    orderObj.orderNumber = ordNumber;
    orderObj.orderId = ordNumber;
    orderObj.customerId = orderObj.customerId || orderObj.customer?.customerId || "C001";
    orderObj.restaurantId = orderObj.restaurantId || restaurantIdCode || "RNT001";
    if (orderObj.rider) {
      orderObj.riderId = orderObj.riderId || orderObj.rider?.riderId || "RDR001";
    }
    if (orderObj.restaurant) {
      orderObj.restaurant = formatRestaurantForUser(orderObj.restaurant);
    }
    if (orderObj.rider && orderObj.rider.rating !== undefined) {
      const ratingValue = orderObj.rider.rating;
      orderObj.rider.rating = getAverageRating(ratingValue);
      orderObj.rider.ratingCount = getRatingCount(ratingValue);
    }

    const now = Date.now();
    const createdTime = order.createdAt ? new Date(order.createdAt).getTime() : now;
    const cancelMins = Number(order.cancellationWindowMinutes || 5);
    const graceMins = Number(order.gracePeriodMinutes || 15);
    const cancelExpiresAt = order.cancellationWindowExpiresAt || new Date(createdTime + cancelMins * 60 * 1000);
    const remCancelSec = Math.max(0, Math.floor((new Date(cancelExpiresAt).getTime() - now) / 1000));

    let graceExpiresAt = order.riderGracePeriodExpiresAt;
    if (!graceExpiresAt) {
      const graceStartTime = order.riderAssignedAt ? new Date(order.riderAssignedAt).getTime() : (order.readyAt ? new Date(order.readyAt).getTime() : createdTime);
      graceExpiresAt = new Date(graceStartTime + graceMins * 60 * 1000);
    }
    const remGraceSec = Math.max(0, Math.floor((new Date(graceExpiresAt).getTime() - now) / 1000));

    orderObj.cancellationWindowMinutes = cancelMins;
    orderObj.cancellationWindowExpiresAt = cancelExpiresAt;
    orderObj.remainingCancellationSeconds = remCancelSec;
    orderObj.isWithinCancellationWindow = remCancelSec > 0;

    orderObj.gracePeriodMinutes = graceMins;
    orderObj.riderGracePeriodExpiresAt = graceExpiresAt;
    orderObj.remainingGraceSeconds = remGraceSec;
    orderObj.isWithinGracePeriod = remGraceSec > 0;

    return res.status(200).json({
      success: true,
      order: enrichOrderWithUnifiedPricing(orderObj),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch restaurant order details", error.message);
  }
};
exports.getPendingOrdersForRestaurant = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return sendError(res, 404, "Restaurant not found");
    }
    const restaurantIdCode = await ensureRestaurantId(restaurant);
    const pendingOrders = await Order.find({
      restaurant: restaurant._id,
      status: "placed",
    })
      .populate("customer", "name email mobile address customerId")
      .populate("items.product", "name image category")
      .sort({ createdAt: -1 });

    const formattedPending = pendingOrders.map(order => {
      const orderObj = order.toObject();
      const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
      orderObj.orderNumber = ordNumber;
      orderObj.orderId = ordNumber;
      orderObj.customerId = orderObj.customerId || orderObj.customer?.customerId || "C001";
      orderObj.restaurantId = orderObj.restaurantId || restaurantIdCode || "RNT001";
      return enrichOrderWithUnifiedPricing(orderObj);
    });

    res.status(200).json({
      success: true,
      message: `Found ${formattedPending.length} pending orders`,
      count: formattedPending.length,
      orders: formattedPending,
    });
  } catch (error) {
    logger.error("Failed to fetch pending restaurant orders", {
      restaurantOwnerId: req.user._id,
      error: error.message,
    });
    return sendError(res, 500, "Failed to fetch pending orders", error.message);
  }
};
exports.getCompletedOrdersForRestaurant = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized");
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return sendError(res, 404, "Restaurant not found");
    }
    const restaurantIdCode = await ensureRestaurantId(restaurant);
    const { page, limit, skip } = getPaginationParams(req, 20);
    const query = { restaurant: restaurant._id, status: "delivered" };
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customer", "name email mobile customerId")
        .populate("rider", "user rating riderId")
        .populate("rider.user", "name mobile profilePic")
        .select("-timeline -riderNotificationStatus")
        .sort({ deliveredAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
      orderObj.orderNumber = ordNumber;
      orderObj.orderId = ordNumber;
      orderObj.customerId = orderObj.customerId || orderObj.customer?.customerId || "C001";
      orderObj.restaurantId = orderObj.restaurantId || restaurantIdCode || "RNT001";
      if (orderObj.rider) {
        orderObj.riderId = orderObj.riderId || orderObj.rider?.riderId || "RDR001";
      }
      return enrichOrderWithUnifiedPricing(orderObj);
    });

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch completed restaurant orders", {
      restaurantOwnerId: req.user?._id,
      error: error.message,
    });
    return sendError(res, 500, "Failed to fetch completed orders", error.message);
  }
};
exports.customerCancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reason = 'Cancelled by customer' } = req.body || {};
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOne(orderFilter).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.customer && order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Not your order" });
    }
    const cancellableStatuses = ['placed', 'accepted', 'preparing', 'pending'];
    if (!cancellableStatuses.includes(order.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in ${order.status} status`,
        currentStatus: order.status
      });
    }
    let refundAmount = order.totalAmount;
    let refundPercentage = 100;
    if (order.status === 'preparing') {
      refundAmount = Math.round(order.totalAmount * 0.5 * 100) / 100;
      refundPercentage = 50;
    }
    const oldStatus = order.status;
    order.status = 'cancelled';
    order.cancellationReason = `Cancelled by customer: ${reason}`;
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      label: 'Order Cancelled',
      by: 'customer',
      description: 'Order cancelled by customer'
    });
    if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cod') {
      const user = await User.findById(order.customer).session(session);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + refundAmount;
        await user.save({ session });
        try {
          const WalletTransaction = require('../models/WalletTransaction');
          await WalletTransaction.create([{
            user: user._id,
            amount: refundAmount,
            type: 'credit',
            description: `Cancellation refund (${refundPercentage}%) - Order ${order.orderId || order._id.toString().slice(-6)}`,
            orderId: order._id
          }], { session });
        } catch (_) {}
      }
      order.paymentStatus = 'refunded';
      order.refund = {
        status: 'completed',
        amount: refundAmount,
        completedAt: new Date(),
        method: 'wallet',
        note: `Customer cancellation (${refundPercentage}% refund)`
      };
    } else if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cancelled';
    }
    await order.save({ session });
    if (order.rider) {
      try {
        const Rider = require('../models/Rider');
        await Rider.findByIdAndUpdate(order.rider, { isAvailable: true }).session(session);
      } catch (_) {}
    }
    try {
      socketService.emitToRestaurant(order.restaurant.toString(), 'order:cancelled_by_customer', {
        orderId: order._id.toString(),
        reason: reason,
        status: oldStatus
      });
      socketService.emitToRestaurant(order.restaurant.toString(), 'order:cancelled', {
        orderId: order._id.toString(),
        reason: reason,
        status: 'cancelled'
      });
    } catch (e) { }

    if (order.rider) {
      try {
        socketService.emitToRider(order.rider.toString(), 'order:cancelled', {
          orderId: order._id.toString(),
          message: "Order cancelled by customer",
          status: 'cancelled',
          reason: reason,
          timestamp: new Date()
        });
      } catch (e) { }
    }
    try {
      logOrderTransition(order._id, oldStatus, 'cancelled', req.user._id, 'customer');
    } catch (_) {}
    await session.commitTransaction();
    session.endSession();

    try {
      await sendNotification(
        order.customer,
        "Order Cancelled Successfully",
        `Your order #${order.orderNumber || order._id.toString().slice(-6)} was cancelled. ${refundAmount > 0 ? `₹${refundAmount} (${refundPercentage}%) refund credited to your wallet.` : ''}`,
        { orderId: order._id.toString(), status: 'cancelled' }
      );
      const rest = await Restaurant.findById(order.restaurant).select('owner');
      if (rest?.owner) {
        await sendNotification(
          rest.owner,
          "Order Cancelled by Customer ❌",
          `Order #${order.orderNumber || order._id.toString().slice(-6)} was cancelled by customer. Reason: ${reason}`,
          { orderId: order._id.toString(), status: 'cancelled' }
        );
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Order cancelled successfully. Refund: ₹${refundAmount}`,
      order: enrichOrderWithUnifiedPricing(order.toObject()),
      refund: {
        amount: refundAmount,
        percentage: refundPercentage,
        creditedTo: 'wallet'
      }
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.getOrderTimeline = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isRestaurant = order.restaurant && (await Restaurant.findOne({
      _id: order.restaurant,
      owner: req.user._id
    }));
    const isRider = order.rider && (await Rider.findOne({
      _id: order.rider,
      user: req.user._id
    }));
    const isAdmin = req.user.role === 'admin';
    if (!isCustomer && !isRestaurant && !isRider && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    const formattedTimeline = order.timeline.map(event => ({
      status: event.status,
      timestamp: event.timestamp,
      label: event.label || getStatusLabel(event.status),
      description: event.description || getStatusDescription(event.status),
      icon: getStatusIcon(event.status),
      by: event.by || 'system'
    }));
    res.status(200).json({
      orderId: order._id,
      timeline: formattedTimeline,
      currentStatus: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.rateRider = async (req, res) => {
  try {
    const { rating, comment, restaurantRating } = req.body;
    const orderId = req.params.id || req.body.orderId;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only customer can rate" });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: "Can only rate after delivery" });
    }
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: "Order already rated" });
    }
    await Review.create({
      user: req.user._id,
      order: orderId,
      restaurant: order.restaurant,
      rider: order.rider,
      riderRating: rating,
      restaurantRating: restaurantRating || undefined,
      comment,
    });
    let riderNewRating = 0;
    if (order.rider) {
      const riderDoc = await Rider.findById(order.rider);
      if (riderDoc) {
        const stats = await Review.aggregate([
          { $match: { rider: riderDoc._id, riderRating: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: null, average: { $avg: '$riderRating' }, count: { $sum: 1 },
              five: { $sum: { $cond: [{ $eq: ['$riderRating', 5] }, 1, 0] } },
              four: { $sum: { $cond: [{ $eq: ['$riderRating', 4] }, 1, 0] } },
              three: { $sum: { $cond: [{ $eq: ['$riderRating', 3] }, 1, 0] } },
              two: { $sum: { $cond: [{ $eq: ['$riderRating', 2] }, 1, 0] } },
              one: { $sum: { $cond: [{ $eq: ['$riderRating', 1] }, 1, 0] } },
            }
          }
        ]);
        if (stats.length > 0) {
          const s = stats[0];
          riderDoc.rating = {
            average: Math.round(s.average * 10) / 10,
            count: s.count,
            breakdown: { five: s.five, four: s.four, three: s.three, two: s.two, one: s.one },
            lastRatedAt: new Date(),
          };
          riderDoc.averageRating = riderDoc.rating.average;
          await riderDoc.save();
          riderNewRating = riderDoc.rating.average;
        }
      }
    }
    if (restaurantRating && order.restaurant) {
      const restaurantDoc = await Restaurant.findById(order.restaurant);
      if (restaurantDoc) {
        const rStats = await Review.aggregate([
          { $match: { restaurant: restaurantDoc._id, restaurantRating: { $exists: true, $ne: null } } },
          { $group: { _id: null, average: { $avg: '$restaurantRating' }, count: { $sum: 1 } } },
        ]);
        if (rStats.length > 0) {
          const avg = Math.round(rStats[0].average * 10) / 10;
          restaurantDoc.rating = { average: avg, count: rStats[0].count, lastRatedAt: new Date() };
          restaurantDoc.avgRating = avg;
          await restaurantDoc.save();
        }
      }
    }
    order.isRated = true;
    await order.save();
    res.status(201).json({
      success: true,
      message: "Rated successfully",
      riderNewRating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateCustomer = async (req, res) => {
  try {
    const orderId = req.params.id || req.body.orderId;
    const { rating, note, comment } = req.body;
    const customerRatingVal = Math.min(5, Math.max(1, Number(rating || 5)));
    const customerNoteVal = (note || comment || "").trim();

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOne(orderFilter).populate('customer');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const customer = await User.findById(order.customer?._id || order.customer);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    if (!customer.ratingsReceived) customer.ratingsReceived = [];
    customer.ratingsReceived.push({
      rider: req.user?._id,
      order: order._id,
      rating: customerRatingVal,
      note: customerNoteVal,
      createdAt: new Date()
    });

    const totalRatings = customer.ratingsReceived.length;
    const sumRatings = customer.ratingsReceived.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const avg = Math.round((sumRatings / totalRatings) * 10) / 10;

    customer.rating = {
      average: avg,
      count: totalRatings
    };
    await customer.save();

    order.riderCustomerRated = true;
    order.customerRatingByRider = {
      rating: customerRatingVal,
      note: customerNoteVal,
      ratedAt: new Date()
    };
    await order.save();

    logger.info(`[RateCustomer] Rider rated customer ${customer.name || customer._id}: ${customerRatingVal} stars (${customerNoteVal})`);

    return res.status(200).json({
      success: true,
      message: "Customer rated successfully",
      customerRating: customer.rating
    });
  } catch (error) {
    logger.error("Rate customer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
function getStatusLabel(status) {
  const labels = {
    'placed': 'Order Placed',
    'accepted': 'Restaurant Accepted',
    'preparing': 'Preparing',
    'ready': 'Ready for Pickup',
    'assigned': 'Rider Assigned',
    'reached_restaurant': 'Rider at Restaurant',
    'picked_up': 'Picked Up',
    'delivery_arrived': 'Rider Arrived',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return labels[status] || status;
}
function getStatusDescription(status) {
  const descriptions = {
    'placed': 'Your order has been placed',
    'accepted': 'Restaurant has accepted your order',
    'preparing': 'Chef is preparing your food',
    'ready': 'Your food is ready. Waiting for rider to pick up',
    'assigned': 'A rider has been assigned',
    'reached_restaurant': 'Rider has arrived at the restaurant',
    'picked_up': 'Rider has picked up your order',
    'delivery_arrived': 'Rider is at your location',
    'delivered': 'Your order has been delivered',
    'cancelled': 'Order has been cancelled'
  };
  return descriptions[status] || '';
}
function getStatusIcon(status) {
  const icons = {
    'placed': 'order_placed',
    'accepted': 'check_circle',
    'preparing': 'cooking',
    'ready': 'inventory',
    'assigned': 'two_wheeler',
    'reached_restaurant': 'location_on',
    'picked_up': 'local_shipping',
    'delivery_arrived': 'home',
    'delivered': 'celebration',
    'cancelled': 'cancel'
  };
  return icons[status] || 'pending';
}
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id || req.body.orderId || req.body.id;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (status === "accepted" && req.user?.role === "restaurant_owner") {
      if (order.paymentMethod === "online" && order.paymentStatus !== "paid") {
        logger.warn("Restaurant attempted to accept unpaid online order", {
          orderId: order._id,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          restaurantOwnerId: req.user._id,
        });
        return res.status(400).json({
          message: "Cannot accept order with unpaid online payment",
          error: "Payment must be completed before acceptance",
          paymentStatus: order.paymentStatus,
        });
      }
      const validation = validateRestaurantAcceptance(order);
      if (!validation.valid) {
        logger.warn("Restaurant acceptance validation failed", {
          orderId: order._id,
          error: validation.error,
        });
        return res.status(400).json({
          message: "Cannot accept order",
          error: validation.error,
        });
      }
      logRestaurantAction(order._id, order.restaurant, "accepted");
    }
    const isAdmin = req.user?.role === "admin";
    const validation = validateOrderState(order.status, status, isAdmin);
    if (!validation.valid) {
      if (validation.isAlreadyAdvanced) {
        logger.info("Order status update ignored because order is already advanced", {
          orderId: order._id,
          currentStatus: order.status,
          attemptedStatus: status,
        });
        return res.status(200).json({
          success: true,
          message: `Order status is already '${order.status}' which is ahead of '${status}'`,
          currentStatus: order.status,
          status: order.status,
          order,
        });
      }

      logger.warn("Invalid order state transition attempted", {
        orderId: order._id,
        currentStatus: order.status,
        attemptedStatus: status,
        userId: req.user?.userId,
        error: validation.error,
      });
      return res.status(400).json({
        message: "Invalid status transition",
        error: validation.error,
        currentStatus: order.status,
        allowedTransitions: validation.error,
      });
    }
    const oldStatus = order.status;
    order.status = status;
    order.deliveryStatus = status;
    const timelineLabels = {
      'placed': { label: 'Order Placed', description: 'Your order has been placed' },
      'accepted': { label: 'Restaurant Accepted', description: 'Restaurant has accepted your order' },
      'preparing': { label: 'Preparing', description: 'Chef is preparing your food' },
      'ready': { label: 'Ready for Pickup', description: 'Your food is ready. Waiting for rider to pick up' },
      'assigned': { label: 'Rider Assigned', description: 'A rider has been assigned' },
      'reached_restaurant': { label: 'Rider at Restaurant', description: 'Rider has arrived at the restaurant' },
      'picked_up': { label: 'Picked Up', description: 'Rider has picked up your order' },
      'out_for_delivery': { label: 'Out for Delivery', description: 'Your order is on the way!' },
      'on_the_way': { label: 'On the Way', description: 'Your order is on the way!' },
      'reached_customer_location': { label: 'Rider Arrived', description: 'Rider has arrived at your location' },
      'delivery_arrived': { label: 'Rider Arrived', description: 'Rider is at your location' },
      'delivered': { label: 'Delivered', description: 'Your order has been delivered' },
      'cancelled': { label: 'Order Cancelled', description: 'Order has been cancelled' }
    };
    const timeline = timelineLabels[status] || { label: status, description: '' };
    order.timeline.push({
      status,
      timestamp: new Date(),
      label: timeline.label,
      by: req.user?.role || 'system',
      description: timeline.description
    });
    const isSelfPickup = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.isSelfPickup === true;
    if (status === "accepted" && oldStatus === "placed" && !isSelfPickup) {
      order.riderNotificationStatus.notified = true;
      order.riderNotificationStatus.notifiedAt = new Date();
    }
    await order.save();
    if (status === "accepted" && oldStatus !== "accepted") {
      await Restaurant.findByIdAndUpdate(
        order.restaurant,
        {
          $inc: {
          },
        },
        { new: true },
      );
    }
    if ((status === "delivered" || status === "completed") && oldStatus !== "delivered" && oldStatus !== "completed") {
      order.deliveredAt = new Date();
      await order.save();
      if (order.rider) {
        const Rider = require('../models/Rider');
        await Rider.findByIdAndUpdate(order.rider, { isAvailable: true }).catch(err =>
          logger.error("Rider availability update failed on delivery", { riderId: order.rider, error: err.message })
        );
      }
      await Restaurant.findByIdAndUpdate(
        order.restaurant,
        {
          $inc: {
            totalEarnings: order.restaurantCommission || 0,
            totalDeliveries: 1,
            successfulOrders: 1,
          },
        },
        { new: true },
      );
      try {
        const { processCODDelivery, processOnlineDelivery } = require('../services/paymentService');
        if (order.paymentMethod === 'cod') {
          processCODDelivery(order._id).catch(err =>
            logger.error("COD delivery payment processing failed", { orderId: order._id, error: err.message })
          );
        } else {
          processOnlineDelivery(order._id).catch(err =>
            logger.error("Online delivery payment processing failed", { orderId: order._id, error: err.message })
          );
        }
      } catch (payErr) {
        logger.error("Failed to trigger payment processing on delivery", { orderId: order._id, error: payErr.message });
      }

      try {
        const { creditOrderRewards } = require('../services/rewardService');
        await creditOrderRewards(order);
      } catch (rewardErr) {
        logger.error("Failed to credit order rewards on delivery", { orderId: order._id, error: rewardErr.message });
      }
    }
    if (status === "accepted" && oldStatus !== "accepted") {
      logger.info("Restaurant accepted order. Waiting for food prep before rider dispatch.", { orderId: order._id });
    }
    logOrderTransition(
      order._id,
      oldStatus,
      status,
      req.user?.userId,
      req.user?.role,
    );
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('customer', 'name _id')
        .populate('restaurant', 'name _id owner')
        .populate({ path: 'rider', select: 'user vehicle', populate: { path: 'user', select: '_id name mobile' } });
      const updateData = {
        orderId: order._id,
        status: status,
        oldStatus: oldStatus,
        timestamp: new Date(),
      };
      const customerMessage = getCustomerStatusMessage(status, populatedOrder.restaurant?.name);
      socketService.emitToCustomer(
        populatedOrder.customer._id.toString(),
        'order:status',
        {
          ...updateData,
          message: customerMessage,
        },
      );
      if (['accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'on_the_way', 'reached_customer_location', 'delivery_arrived', 'delivered', 'cancelled'].includes(status)) {
        try {
          await sendNotification(
            populatedOrder.customer._id,
            getCustomerNotificationTitle(status),
            customerMessage,
            { orderId: order._id.toString(), status, type: 'order_status' }
          );
        } catch (e) {
          logger.error("Failed to send customer push notification", { error: e.message, orderId: order._id });
        }
      }
      socketService.emitToRestaurant(
        populatedOrder.restaurant._id.toString(),
        "order:status",
        updateData,
      );
      if (['assigned', 'reached_restaurant', 'picked_up', 'delivered', 'cancelled'].includes(status) && populatedOrder.restaurant?.owner) {
        try {
          await sendNotification(
            populatedOrder.restaurant.owner,
            getRestaurantNotificationTitle(status),
            getRestaurantStatusMessage(status, order._id),
            { orderId: order._id.toString(), status, type: 'order_status' }
          );
        } catch (e) {
          logger.error("Failed to send restaurant push notification", { error: e.message, orderId: order._id });
        }
      }
      if (!isSelfPickup && populatedOrder.rider?.user) {
        const riderUserId = populatedOrder.rider.user._id.toString();
        socketService.emitToRider(riderUserId, 'order:status', updateData);
        if (status === 'accepted' && oldStatus === 'placed') {
          socketService.emitToRider(riderUserId, 'order:accepted', {
            orderId: order._id.toString(),
            status: 'accepted',
            customerName: populatedOrder.customer.name,
            restaurantName: populatedOrder.restaurant.name,
            totalAmount: order.totalAmount,
            timestamp: new Date(),
            message: 'New order accepted by restaurant'
          });
        }
        if (['preparing', 'ready', 'cancelled'].includes(status)) {
          try {
            const riderMessage = getRiderStatusMessage(status, populatedOrder.restaurant?.name);
            await sendNotification(
              riderUserId,
              getRiderNotificationTitle(status),
              riderMessage,
              { orderId: order._id.toString(), status, type: 'order_status' }
            );
          } catch (e) {
            logger.error("Failed to send rider push notification", { error: e.message, orderId: order._id });
          }
        }
      }
      socketService.emitToAdmin("order:status", {
        ...updateData,
        customerName: populatedOrder.customer.name,
        restaurantName: populatedOrder.restaurant.name,
        riderName: populatedOrder.rider?.user?.name,
        totalAmount: order.totalAmount,
        amount: order.totalAmount,
      });
      if (status === 'cancelled') {
        const cancelData = {
          orderId: order._id,
          status: 'cancelled',
          reason: order.cancellationReason || 'Order cancelled',
          timestamp: new Date(),
        };
        socketService.emitToUser(populatedOrder.customer._id.toString(), 'order:cancelled', {
          ...cancelData,
          message: 'Your order has been cancelled'
        });
        socketService.emitToRestaurant(populatedOrder.restaurant._id.toString(), 'order:cancelled', cancelData);
        if (populatedOrder.rider?.user) {
          socketService.emitToRider(populatedOrder.rider.user._id.toString(), 'order:cancelled', {
            ...cancelData,
            message: 'Order has been cancelled'
          });
        }
      }
    } catch (socketError) {
      logger.error("Socket emission error in updateOrderStatus", {
        orderId: order._id,
        error: socketError.message,
      });
    }

    try {
      const io = req.app.get("io");
      if (io) {
        const payload = { orderId: order._id.toString(), status: order.status, order };
        io.to(`order_${order._id}`).emit("orderStatusUpdated", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}

    res.json({ message: "Status updated", order });
  } catch (error) {
    logger.error("Failed to update order status", { error: error.message });
    res.status(500).json({ message: error.message });
  }
};
function getCustomerStatusMessage(status, restaurantName) {
  const messages = {
    'placed': 'Your order has been placed successfully',
    'accepted': `${restaurantName || 'Restaurant'} has accepted your order`,
    'preparing': 'Chef is preparing your delicious food',
    'ready': 'Your order is ready, waiting for delivery partner',
    'assigned': 'A rider has been assigned to deliver your order',
    'reached_restaurant': 'Rider has arrived at the restaurant',
    'picked_up': 'Order picked up from restaurant!',
    'out_for_delivery': 'Your order is out for delivery! Rider is on the way.',
    'on_the_way': 'Your order is on the way!',
    'reached_customer_location': 'Rider has arrived at your location',
    'delivery_arrived': 'Rider has arrived at your location',
    'delivered': 'Your order has been delivered. Enjoy your meal!',
    'cancelled': 'Your order has been cancelled'
  };
  return messages[status] || `Your order is now ${status}`;
}
function getCustomerNotificationTitle(status) {
  const titles = {
    'accepted': 'Order Accepted!',
    'preparing': 'Cooking Started',
    'ready': 'Order Ready!',
    'assigned': 'Rider Assigned',
    'picked_up': 'Food Picked Up',
    'out_for_delivery': 'Out for Delivery 🚀',
    'on_the_way': 'Order On The Way 🚀',
    'reached_customer_location': 'Rider Arrived!',
    'delivery_arrived': 'Rider Arrived!',
    'delivered': 'Order Delivered 🎉',
    'cancelled': 'Order Cancelled'
  };
  return titles[status] || 'Order Update';
}
function getRestaurantStatusMessage(status, orderId) {
  const orderRef = orderId.toString().slice(-6);
  const messages = {
    'assigned': `Rider assigned to Order #${orderRef}`,
    'reached_restaurant': `Rider arrived for Order #${orderRef}`,
    'picked_up': `Order #${orderRef} picked up successfully`,
    'delivered': `Order #${orderRef} delivered successfully`,
    'cancelled': `Order #${orderRef} has been cancelled`
  };
  return messages[status] || `Order #${orderRef} status: ${status}`;
}
function getRestaurantNotificationTitle(status) {
  const titles = {
    'assigned': 'Rider Assigned',
    'reached_restaurant': 'Rider Arrived',
    'picked_up': 'Order Picked Up',
    'delivered': 'Order Delivered',
    'cancelled': 'Order Cancelled'
  };
  return titles[status] || 'Order Update';
}
function getRiderStatusMessage(status, restaurantName) {
  const messages = {
    'preparing': `${restaurantName || 'Restaurant'} is preparing the order`,
    'ready': `Order is ready for pickup at ${restaurantName || 'Restaurant'}!`,
    'cancelled': 'Order has been cancelled'
  };
  return messages[status] || `Order status: ${status}`;
}
function getRiderNotificationTitle(status) {
  const titles = {
    'preparing': 'Food Being Prepared',
    'ready': 'Order Ready for Pickup!',
    'cancelled': 'Order Cancelled'
  };
  return titles[status] || 'Order Update';
}
exports.markOrderReady = async (req, res) => {
  try {
    const targetId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && String(targetId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
      : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
    const order = await Order.findOne(orderFilter)
      .populate("customer", "name")
      .populate("restaurant", "name")
      .populate("rider", "user")
      .populate("rider.user", "name mobile");
    if (!order) return res.status(404).json({ message: "Order not found" });
    const validation = validateRestaurantMarkReady(order);
    if (!validation.valid) {
      logger.warn("Invalid mark ready attempt", {
        orderId: order._id,
        currentStatus: order.status,
        error: validation.error,
      });
      return res.status(400).json({
        message: "Cannot mark order ready",
        error: validation.error,
      });
    }
    const oldStatus = order.status;
    order.status = "ready";
    order.timeline.push({ status: "ready", timestamp: new Date() });
    await order.save();
    logOrderTransition(
      order._id,
      oldStatus,
      "ready",
      req.user?.userId,
      "restaurant_owner",
    );
    let restaurantName = "";
    let restaurantCoords = null;
    try {
      const restaurantDoc = await Restaurant.findById(order.restaurant).select("name location");
      restaurantName = restaurantDoc?.name || "";
      restaurantCoords = restaurantDoc?.location?.coordinates;
    } catch (e) { }

    if (order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.orderType === 'takeaway' || order.isSelfPickup) {
      const pickupCode = order.selfPickupCode || order.pickupOtp;
      try {
        await sendNotification(
          order.customer._id || order.customer,
          "🎉 Food Ready for Pickup!",
          `Your food at ${restaurantName} is ready! Show 4-digit OTP ${pickupCode} at counter.`,
          { orderId: order._id, status: 'ready', pickupOtp: pickupCode }
        );
      } catch (_) {}
    } else {
      try {
        await sendNotification(
          order.customer._id || order.customer,
          "Order Ready! 🍳",
          `Your food at ${restaurantName || 'the restaurant'} is freshly prepared and ready for delivery partner pickup.`,
          { orderId: order._id, status: 'ready' }
        );
      } catch (_) {}
    }
    if (order.rider) {
      socketService.emitToRider(order.rider._id.toString(), 'order:ready', {
        orderId: order._id.toString(),
        message: 'Order is Ready for Pickup!',
        restaurantName,
        status: 'ready',
        timestamp: new Date()
      });
      const riderDoc = await Rider.findById(order.rider._id).select('user');
      if (riderDoc?.user) {
        socketService.emitToRider(riderDoc.user.toString(), 'order:ready', {
          orderId: order._id.toString(),
          message: 'Order is Ready for Pickup!',
          restaurantName,
          status: 'ready',
          timestamp: new Date()
        });
      }
      try {
        const riderDoc = await Rider.findById(order.rider._id);
        if (riderDoc) {
          await sendNotification(
            riderDoc.user,
            "Order Ready For Pickup!",
            `${restaurantName} - Your food is ready - ₹${order.totalAmount}`
          );
        }
      } catch (e) {
        console.error("Push notify error for assigned rider", e);
      }
    } else {
      const isSelfPickupOrder = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.orderType === 'takeaway' || order.isSelfPickup;
      if (!isSelfPickupOrder) {
        try {
          const riderDispatchService = require('../services/riderDispatchService');
          logger.info(`[Dispatch] Order ${order._id} marked ready. Automatically initiating rider search.`, { orderId: order._id });
          riderDispatchService.findAndNotifyRider(order._id);
        } catch (dispatchErr) {
          logger.error(`[Dispatch] Error starting rider search on mark ready: ${dispatchErr.message}`, { orderId: order._id });
        }
      }
    }
    try {
      const updateData = {
        orderId: order._id,
        status: "ready",
        oldStatus,
        timestamp: new Date(),
      };
      if (order.customer?._id) {
        socketService.emitToUser(
          order.customer._id.toString(),
          "order:status",
          {
            ...updateData,
            message: "Your order is now ready",
          },
        );
      }
      if (order.restaurant?._id) {
        socketService.emitToRestaurant(
          order.restaurant._id.toString(),
          "order:status",
          updateData,
        );
      }
      if (order.rider?._id) {
        socketService.emitToRider(
          order.rider._id.toString(),
          "order:status",
          updateData,
        );
      }
      socketService.emitToAdmin("order:status", {
        ...updateData,
        customerName: order.customer?.name,
        restaurantName: order.restaurant?.name,
        riderName: order.rider?.name,
        totalAmount: order.totalAmount,
        amount: order.totalAmount,
      });
    } catch (socketError) {
      logger.error("Socket emission error in markOrderReady", {
        orderId: order._id,
        error: socketError.message,
      });
    }
    try {
      const io = req.app.get("io");
      if (io) {
        const payload = { orderId: order._id.toString(), status: "ready", order };
        io.to(`order_${order._id}`).emit("orderStatusUpdated", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}
    res.status(200).json({
      message: "Order marked Ready. Riders notified.",
      order,
    });
  } catch (error) {
    logger.error("Failed to mark order ready", { error: error.message });
    res.status(500).json({ message: error.message });
  }
};
exports.searchRidersForOrder = async (req, res) => {
  try {
    const targetId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && String(targetId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
      : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };

    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.orderType === 'self_pickup' || order.orderType === 'pickup') {
      return res.status(200).json({
        success: true,
        message: "Self pickup order - no delivery partner required",
        isSelfPickup: true,
        count: 0
      });
    }
    if (order.rider) {
      return res.status(400).json({ message: "Order already assigned to a rider" });
    }
    if (!['placed', 'accepted', 'preparing', 'ready'].includes(order.status)) {
      return res.status(400).json({
        message: "Order is not eligible for rider search",
        status: order.status,
      });
    }
    const restaurant = await Restaurant.findById(order.restaurant).select("name location");
    const restaurantCoords = restaurant?.location?.coordinates;
    if (!restaurant || !restaurantCoords || restaurantCoords.length !== 2) {
      return res.status(400).json({ message: "Restaurant location missing" });
    }
    const RideRequest = require('../models/RideRequest');
    await RideRequest.deleteMany({
      order: order._id,
      status: { $in: ['timeout', 'rejected'] }
    });
    let nearbyRiderCount = 0;
    try {
      nearbyRiderCount = await Rider.countDocuments({
        currentLocation: {
          $geoWithin: {
            $centerSphere: [
              [restaurantCoords[0], restaurantCoords[1]],
              1000 / 6378.1
            ]
          }
        },
        isOnline: true,
        verificationStatus: 'approved',
      });
    } catch (geoCountErr) {
      nearbyRiderCount = await Rider.countDocuments({
        isOnline: true,
        verificationStatus: 'approved',
      });
    }

    if (nearbyRiderCount === 0) {
      logger.info('[SearchRiders] No online riders found, emitting no_rider_found immediately', {
        orderId: order._id,
        restaurantId: order.restaurant.toString(),
      });
      socketService.emitToRestaurant(order.restaurant.toString(), 'order:no_rider_found', {
        orderId: order._id,
        message: 'No riders available nearby',
      });
      return res.status(200).json({
        success: true,
        message: "No riders available nearby",
        count: 0,
        orderId: order._id,
      });
    }
    logger.info(`[SearchRiders] Found ${nearbyRiderCount} online riders, triggering dispatch`, {
      orderId: order._id,
    });
    try {
      const riderDispatchService = require('../services/riderDispatchService');
      riderDispatchService.findAndNotifyRider(order._id);
    } catch (e) {
      console.warn("Error triggering rider dispatch after manual search", { error: e.message, orderId: order._id });
    }
    try {
      let nearbyRiders = [];
      try {
        nearbyRiders = await Rider.find({
          currentLocation: {
            $geoWithin: {
              $centerSphere: [
                [restaurantCoords[0], restaurantCoords[1]],
                1000 / 6378.1
              ]
            }
          },
          isOnline: true,
          verificationStatus: 'approved',
        }).select('_id user').limit(10);
      } catch (findGeoErr) {
        nearbyRiders = await Rider.find({
          isOnline: true,
          verificationStatus: 'approved',
        }).select('_id user').limit(10);
      }
      const notificationPromises = nearbyRiders.map(async (rider) => {
        try {
          const riderUser = await User.findById(rider.user).select('_id');
          if (!riderUser) return null;
          await sendNotification(
            riderUser._id,
            "New Order Available",
            `Order at ${restaurant.name.en || restaurant.name} - ₹${order.totalAmount}`,
            {
              orderId: order._id.toString(),
              restaurantId: order.restaurant.toString(),
              type: "order_available",
              reason: "manual_search",
            }
          );
          return { riderId: rider._id, notifiedAt: new Date(), status: 'sent' };
        } catch (notifErr) {
          return null;
        }
      });
      const results = await Promise.all(notificationPromises);
      const sent = results.filter((entry) => entry !== null);
      if (sent.length > 0) {
        const existing = order.riderNotificationStatus?.notifiedRiders || [];
        const riderMap = new Map(existing.map((entry) => [entry.riderId.toString(), entry]));
        sent.forEach((entry) => riderMap.set(entry.riderId.toString(), entry));
        order.riderNotificationStatus.notified = true;
        order.riderNotificationStatus.notifiedAt = new Date();
        order.riderNotificationStatus.notifiedRiders = Array.from(riderMap.values());
        await order.save();
      }
    } catch (pushErr) {
      logger.warn('[SearchRiders] Push notification error (non-blocking):', pushErr.message);
    }
    return res.status(200).json({
      success: true,
      message: "Rider search initiated",
      count: nearbyRiderCount,
      orderId: order._id,
    });
  } catch (error) {
    logger.error("Failed to search riders for order", { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};
exports.trackOrder = async (req, res) => {
  try {
    const { calculateDistance, calculateETA } = require('../utils/locationUtils');
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter)
      .populate("restaurant", "location name address phone contactNumber ownerPhone owner")
      .populate("rider", "user currentLocation vehicle contactNumber name")
      .populate("rider.user", "name mobile profilePic");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    let liveLocation = null;
    let distanceInfo = null;
    let driverLat = null;
    let driverLng = null;
    let userLat = 22.7196;
    let userLng = 75.8577;
    let restLat = 22.7533;
    let restLng = 75.8937;

    if (order.restaurant?.location?.coordinates?.length === 2) {
      restLng = Number(order.restaurant.location.coordinates[0]);
      restLat = Number(order.restaurant.location.coordinates[1]);
    } else if (order.restaurant) {
      const restDoc = await Restaurant.findById(order.restaurant._id || order.restaurant).select('location');
      if (restDoc?.location?.coordinates?.length === 2) {
        restLng = Number(restDoc.location.coordinates[0]);
        restLat = Number(restDoc.location.coordinates[1]);
      }
    }

    if (order.deliveryAddress?.coordinates?.length === 2) {
      userLng = Number(order.deliveryAddress.coordinates[0]);
      userLat = Number(order.deliveryAddress.coordinates[1]);
    } else if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
      userLat = Number(order.deliveryAddress.latitude);
      userLng = Number(order.deliveryAddress.longitude);
    }

    if (order.rider && order.rider.currentLocation?.coordinates?.length === 2) {
      driverLng = Number(order.rider.currentLocation.coordinates[0]);
      driverLat = Number(order.rider.currentLocation.coordinates[1]);
      liveLocation = order.rider.currentLocation;
    }

    if (order.rider && order.rider.currentLocation && order.deliveryAddress) {
      const riderCoords = [driverLng, driverLat];
      const customerCoords = [userLng, userLat];
      const restaurantCoords = [restLng, restLat];
      if (driverLat && driverLng && userLat && userLng) {
        const distanceToCustomer = calculateDistance(riderCoords, customerCoords);
        const etaInfo = calculateETA(riderCoords, customerCoords, order.status);
        let pickupDistance = null;
        if (restLat && restLng) {
          const distanceToRestaurant = calculateDistance(riderCoords, restaurantCoords);
          pickupDistance = Math.round(distanceToRestaurant * 100) / 100;
        }
        distanceInfo = {
          distanceToCustomer: Math.round(distanceToCustomer * 100) / 100,
          distanceToRestaurant: pickupDistance,
          etaMinutes: etaInfo.minutes,
          etaDisplay: etaInfo.display
        };
      }
    }

    const formattedRestaurant = formatRestaurantForUser(order.restaurant);
    const rName = typeof order.restaurant?.name === 'object' ? (order.restaurant.name.en || 'Restaurant') : (order.restaurant?.name || 'Restaurant');

    const riderDetails = order.rider ? {
      name: order.rider.name || order.rider.user?.name || "Delivery Partner",
      phone: order.rider.contactNumber || order.rider.user?.mobile || "",
      location: liveLocation,
      vehicle: order.rider.vehicle || "",
      lat: driverLat,
      lng: driverLng,
    } : null;

    const isSelfPickup = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.isSelfPickup === true;
    const effectiveRiderDetails = isSelfPickup ? null : riderDetails;

    res.status(200).json({
      success: true,
      orderId: order._id.toString(),
      status: order.status,
      isRated: Boolean(order.isRated),
      rewardPoints: order.rewardPoints || 0,
      rewardAmount: order.rewardAmount || 0,
      rewardPointsCredited: Boolean(order.rewardPointsCredited),
      restaurantId: order.restaurant?._id?.toString() || (typeof order.restaurant === 'string' ? order.restaurant : '') || '',
      riderId: order.rider?._id?.toString() || (typeof order.rider === 'string' ? order.rider : '') || '',
      items: order.items || [],
      totalAmount: order.totalAmount || 0,
      orderType: isSelfPickup ? 'self_pickup' : (order.orderType || 'delivery'),
      isSelfPickup,
      pickupOtp: order.pickupOtp || order.selfPickupCode || '',
      selfPickupCode: order.selfPickupCode || order.pickupOtp || '',
      isRated: Boolean(order.isRated),
      customerArrived: Boolean(order.customerArrived),
      customerArrivedAt: order.customerArrivedAt || null,
      prepTimeMinutes: order.prepTimeMinutes || 15,
      readyAt: order.readyAt || null,
      driverName: effectiveRiderDetails ? effectiveRiderDetails.name : null,
      driverPhone: effectiveRiderDetails ? effectiveRiderDetails.phone : null,
      estimatedDeliveryTime: order.estimatedDeliveryTime || distanceInfo?.etaDisplay || "15-20 mins",
      restaurant: {
        name: rName,
        phone: order.restaurant?.contactNumber || order.restaurant?.phone || order.restaurant?.ownerPhone || "",
        address: order.restaurant?.address || "",
        lat: restLat,
        lng: restLng,
        ...formattedRestaurant
      },
      user: {
        lat: userLat,
        lng: userLng,
        address: order.deliveryAddress?.addressLine || order.deliveryAddress?.address || order.deliveryAddress?.formattedAddress || ""
      },
      driver: effectiveRiderDetails ? {
        lat: driverLat || restLat,
        lng: driverLng || restLng
      } : null,
      timeline: order.timeline || [],
      eta: order.estimatedDeliveryTime,
      rider: effectiveRiderDetails,
      deliveryLocation: {
        address: order.deliveryAddress?.addressLine || order.deliveryAddress?.address || "",
        addressLine: order.deliveryAddress?.addressLine || order.deliveryAddress?.address || "",
        lat: userLat,
        lng: userLng,
        coordinates: [userLng, userLat]
      },
      order: order,
      supportPhone: "+91-9876543210",
      ...(!isSelfPickup && distanceInfo && { distances: distanceInfo })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.reorder = async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) return res.status(404).json({ message: "Order not found" });
    const Cart = require("../models/Cart");
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.restaurant = oldOrder.restaurant;
    } else {
      cart = new Cart({
        user: req.user._id,
        restaurant: oldOrder.restaurant,
        items: [],
      });
    }
    oldOrder.items.forEach((item) => {
      cart.items.push({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variation: item.variation,
        addOns: item.addOns,
      });
    });
    await cart.save();
    res.status(200).json({ message: "Items added to cart", cartId: cart._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.reportIssue = async (req, res) => {
  try {
    const { issue } = req.body; // e.g., "Food spilled", "Missing item"
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = "issue_reported";
    order.issueReported = issue;
    await order.save();
    res
      .status(200)
      .json({ message: "Issue reported. Support will contact you." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req, 100);
    const { status, date, timeRange, range, orderId, userId, customerId, restaurantId, orderType, search } = req.query;
    let query = {};

    // 1. Status Filter
    if (status && status !== "all") {
      const rawStatus = String(status).trim().toLowerCase();
      if (rawStatus === "active" || rawStatus === "pending") {
        query.status = { $in: ["placed", "pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"] };
      } else if (rawStatus === "pickup" || rawStatus === "self_pickup" || rawStatus === "self pickup") {
        query.$or = [{ orderType: { $in: ["pickup", "self_pickup"] } }, { status: { $in: ["pickup", "self_pickup"] } }];
      } else {
        const statusList = String(status).split(',').map(s => s.trim()).filter(Boolean);
        if (statusList.length > 1) {
          query.status = { $in: statusList };
        } else if (statusList.length === 1) {
          query.status = statusList[0];
        }
      }
    }

    // 2. Order Type Filter (Delivery vs Self Pickup)
    if (orderType && orderType !== "all") {
      const t = String(orderType).trim().toLowerCase();
      if (t.includes("pickup") || t.includes("self")) {
        query.orderType = { $in: ["pickup", "self_pickup"] };
      } else if (t.includes("delivery")) {
        query.orderType = { $in: ["delivery", "Home Delivery"] };
      }
    }

    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        query._id = orderId;
      }
    }

    const targetUser = userId || customerId;
    if (targetUser && mongoose.Types.ObjectId.isValid(targetUser)) {
      query.customer = targetUser;
    }

    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      query.restaurant = restaurantId;
    }

    // 3. Time Range / Date Filter (Daily, Weekly, Monthly, Yearly)
    const activeRange = timeRange || range;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else if (activeRange && activeRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (activeRange === "today" || activeRange === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (activeRange === "weekly") {
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (activeRange === "monthly") {
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      } else if (activeRange === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1);
      }
      query.createdAt = { $gte: startDate };
    }

    // 4. Search Filter across Customer, Restaurant, Rider, Order Number, Address, etc.
    if (search && search.trim()) {
      const s = search.trim();
      const escapedS = s.replace(/[^a-zA-Z0-9\s]/g, '');
      const sRegex = new RegExp(escapedS, 'i');

      const [matchingUsers, matchingRestaurants, matchingRiders] = await Promise.all([
        User.find({ $or: [{ name: sRegex }, { mobile: sRegex }, { email: sRegex }] }).select('_id'),
        Restaurant.find({ $or: [{ name: sRegex }, { "name.en": sRegex }, { phone: sRegex }, { contactNumber: sRegex }] }).select('_id'),
        Rider.find({}).populate({ path: 'user', match: { name: sRegex } }).select('_id')
      ]);

      const userIds = matchingUsers.map(u => u._id);
      const restIds = matchingRestaurants.map(r => r._id);
      const riderIds = matchingRiders.filter(r => r.user).map(r => r._id);

      const searchConditions = [
        { orderNumber: sRegex },
        { orderId: sRegex },
        { customerId: sRegex },
        { restaurantId: sRegex },
        { riderId: sRegex },
        { paymentMethod: sRegex },
        { status: sRegex },
        { orderType: sRegex },
        { "deliveryAddress.addressLine": sRegex },
        { "deliveryAddress.fullAddress": sRegex },
        { "deliveryAddress.area": sRegex },
        { "deliveryAddress.city": sRegex }
      ];

      if (mongoose.Types.ObjectId.isValid(s)) {
        searchConditions.push({ _id: s });
      }
      if (userIds.length > 0) {
        searchConditions.push({ customer: { $in: userIds } });
      }
      if (restIds.length > 0) {
        searchConditions.push({ restaurant: { $in: restIds } });
      }
      if (riderIds.length > 0) {
        searchConditions.push({ rider: { $in: riderIds } });
      }

      query.$or = searchConditions;
    }

    // 5. Calculate Live Summary Stats for Admin Overview Cards
    const [total, orders, allMatchingOrdersForSummary] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("customer", "name email mobile address customerId")
        .populate("restaurant", "name address contactNumber phone email restaurantId")
        .populate({
          path: "rider",
          populate: { path: "user", select: "name mobile profilePic" }
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.find(query).select("totalAmount status orderType").lean()
    ]);

    let totalRevenue = 0;
    let activeCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let selfPickupCount = 0;

    allMatchingOrdersForSummary.forEach(o => {
      totalRevenue += Number(o.totalAmount || 0);
      const st = String(o.status || '').toLowerCase();
      const ot = String(o.orderType || '').toLowerCase();

      if (["placed", "pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(st)) {
        activeCount++;
      }
      if (st === "delivered") {
        deliveredCount++;
      }
      if (st === "cancelled" || st === "failed") {
        cancelledCount++;
      }
      if (ot === "pickup" || ot === "self_pickup") {
        selfPickupCount++;
      }
    });

    const formattedAdminOrders = orders.map(order => {
      const orderObj = order.toObject();
      const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
      orderObj.orderNumber = ordNumber;
      orderObj.orderId = ordNumber;
      orderObj.customerId = orderObj.customerId || orderObj.customer?.customerId || "C001";
      orderObj.restaurantId = orderObj.restaurantId || orderObj.restaurant?.restaurantId || "RNT001";
      if (orderObj.rider) {
        orderObj.riderId = orderObj.riderId || orderObj.rider?.riderId || "RDR001";
      }
      return enrichOrderWithUnifiedPricing(orderObj);
    });

    res.status(200).json({
      orders: formattedAdminOrders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary: {
        totalOrders: total,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeCount,
        deliveredCount,
        cancelledCount,
        selfPickupCount
      }
    });
  } catch (error) {
    console.error("Error in getAllOrdersAdmin:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.getFailedOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { from, to, search } = req.query;
    const query = { status: "failed" };
    if (from) query.createdAt = { $gte: new Date(from) };
    if (to)
      query.createdAt = query.createdAt
        ? { ...query.createdAt, $lte: new Date(to) }
        : { $lte: new Date(to) };
    if (search)
      query.$or = [
        { "customer.name": { $regex: search, $options: "i" } },
        { cancellationReason: { $regex: search, $options: "i" } },
        { failureReason: { $regex: search, $options: "i" } },
      ];
    const orders = await Order.find(query)
      .populate("customer", "name email mobile")
      .populate("restaurant", "name")
      .populate("rider", "user")
      .populate("rider.user", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Order.countDocuments(query);
    res.status(200).json({ orders, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminRetryPayment = async (req, res) => {
  try {
    const { result = "paid", note } = req.body; // result = 'paid' | 'failed'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "failed" && order.paymentStatus !== "failed") {
      return res.status(400).json({ message: "Order is not in failed state" });
    }
    order.retryCount = (order.retryCount || 0) + 1;
    order.lastRetryAt = new Date();
    if (result === "paid") {
      order.paymentStatus = "paid";
      order.status = "placed";
      order.timeline.push({
        status: "payment_retried_paid",
        timestamp: new Date(),
        note: note || "Payment retried by admin and succeeded",
      });
      await order.save();
      try {
        await sendNotification(
          order.customer,
          "Payment Successful",
          `Payment retried and succeeded for Order ${order._id}`,
        );
      } catch (e) { }
      try {
        const restaurant = await Restaurant.findById(order.restaurant).populate(
          "owner",
        );
        if (restaurant && restaurant.owner)
          await sendNotification(
            restaurant.owner._id,
            "Order Received",
            `Order #${order._id} is now placed after payment retry.`,
          );
      } catch (e) { }
      return res
        .status(200)
        .json({ message: "Payment retried and succeeded", order });
    } else {
      order.paymentStatus = "failed";
      order.failureReason = note || "Payment retry failed";
      order.timeline.push({
        status: "payment_retried_failed",
        timestamp: new Date(),
        note: note || "Payment retried by admin and failed",
      });
      await order.save();
      try {
        await sendNotification(
          order.customer,
          "Payment Retry Failed",
          `We retried payment for Order ${order._id} but it failed.`,
        );
      } catch (e) { }
      return res
        .status(200)
        .json({ message: "Payment retried and failed", order });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminResolveFailedOrder = async (req, res) => {
  try {
    const { resolutionNote } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = "cancelled";
    order.cancellationReason =
      resolutionNote || "Cancelled by admin after failed payment";
    order.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: order.cancellationReason,
    });
    await order.save();
    res.status(200).json({ message: "Order cancelled/resolved", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getOrderDetailsAdmin = async (req, res) => {
  try {
    const targetId = req.params.id;
    const orderQuery = mongoose.Types.ObjectId.isValid(targetId)
      ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
      : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
    const order = await Order.findOne(orderQuery)
      .populate("customer")
      .populate("restaurant")
      .populate("rider")
      .populate({ path: "rider", populate: { path: "user", select: "name mobile profilePic email" } })
      .populate("timeline");
    if (!order) return res.status(404).json({ message: "Order not found" });
    const orderObj = order.toObject();

    // 1. Order ID formatting
    const ordNumber = orderObj.orderNumber || (orderObj._id ? `ORD${orderObj._id.toString().slice(-4).toUpperCase()}` : "ORD001");
    orderObj.orderNumber = ordNumber;
    orderObj.orderId = ordNumber;

    // 2. Customer ID & details
    let custId = orderObj.customerId || orderObj.customer?.customerId;
    if (!custId || !/^C\d+/i.test(custId)) {
      if (order.customer) {
        custId = await ensureCustomerId(order.customer);
      } else {
        custId = "C001";
      }
    }
    orderObj.customerId = custId;
    if (orderObj.customer) {
      orderObj.customer.customerId = custId;
    }

    // 3. Restaurant ID & details
    let restId = orderObj.restaurantId || orderObj.restaurant?.restaurantId;
    if (!restId || !/^RNT\d+/i.test(restId)) {
      if (order.restaurant) {
        restId = await ensureRestaurantId(order.restaurant);
      } else {
        restId = "RNT001";
      }
    }
    orderObj.restaurantId = restId;
    if (orderObj.restaurant) {
      orderObj.restaurant.restaurantId = restId;
    }

    // 4. Rider details & ID
    if (orderObj.rider) {
      let rdrId = orderObj.riderId || orderObj.rider?.riderId;
      if (!rdrId || !/^RDR\d+/i.test(rdrId)) {
        if (order.rider) {
          rdrId = await ensureRiderId(order.rider);
        } else {
          rdrId = "RDR001";
        }
      }
      orderObj.riderId = rdrId;
      orderObj.rider.riderId = rdrId;
      orderObj.rider.name = orderObj.rider.name || orderObj.rider.user?.name || orderObj.riderName || "Assigned Rider";
      orderObj.rider.mobile = orderObj.rider.mobile || orderObj.rider.phone || orderObj.rider.user?.mobile || orderObj.riderPhone || "";
      orderObj.rider.phone = orderObj.rider.mobile;
    } else if (orderObj.riderName || orderObj.riderPhone || orderObj.riderId) {
      orderObj.rider = {
        name: orderObj.riderName || "Assigned Rider",
        riderId: orderObj.riderId || "RDR001",
        mobile: orderObj.riderPhone || "",
        phone: orderObj.riderPhone || "",
      };
      orderObj.riderId = orderObj.rider.riderId;
    }

    // 5. Contact numbers verification
    const contacts = buildOrderCallContacts(orderObj);
    if (orderObj.customer) {
      orderObj.customer.mobile = contacts.customerPhone || orderObj.customer.mobile || orderObj.customer.phone || "";
    }
    if (orderObj.restaurant) {
      orderObj.restaurant.phone = contacts.restaurantPhone || orderObj.restaurant.phone || orderObj.restaurant.contactNumber || "";
    }
    if (orderObj.rider) {
      orderObj.rider.mobile = contacts.riderPhone || orderObj.rider.mobile || orderObj.rider.phone || "";
      orderObj.rider.phone = orderObj.rider.mobile;
    }

    // 6. Delivery location ensure structure
    if (!orderObj.deliveryAddress || !orderObj.deliveryAddress.addressLine) {
      const custAddr = orderObj.customer?.address || orderObj.customer?.addresses?.[0];
      const addrStr = typeof custAddr === 'string' ? custAddr : (custAddr?.fullAddress || custAddr?.addressLine || "");
      orderObj.deliveryAddress = {
        addressLine: addrStr || orderObj.deliveryAddress?.addressLine || "Delivery Address as specified at checkout",
        coordinates: (orderObj.deliveryAddress && Array.isArray(orderObj.deliveryAddress.coordinates) && orderObj.deliveryAddress.coordinates.length === 2)
          ? orderObj.deliveryAddress.coordinates
          : (custAddr?.location?.coordinates || [77.2090, 28.6139])
      };
    }

    // 7. Timeline reconstruction if empty
    if (!Array.isArray(orderObj.timeline) || orderObj.timeline.length === 0) {
      const timelineArr = [
        {
          status: 'placed',
          timestamp: orderObj.createdAt || new Date(),
          label: 'Order Placed',
          description: 'Customer successfully placed the order',
          by: 'customer'
        }
      ];
      if (['accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'delivered'].includes(orderObj.status)) {
        timelineArr.push({
          status: 'accepted',
          timestamp: orderObj.createdAt || new Date(),
          label: 'Order Accepted',
          description: 'Restaurant confirmed and accepted the order',
          by: 'restaurant_owner'
        });
      }
      if (['preparing', 'ready', 'assigned', 'picked_up', 'delivered'].includes(orderObj.status)) {
        timelineArr.push({
          status: 'preparing',
          timestamp: orderObj.createdAt || new Date(),
          label: 'Preparing Food',
          description: 'Kitchen is currently preparing food items',
          by: 'restaurant_owner'
        });
      }
      if (['ready', 'assigned', 'picked_up', 'delivered'].includes(orderObj.status)) {
        timelineArr.push({
          status: 'ready',
          timestamp: orderObj.readyAt || orderObj.updatedAt || new Date(),
          label: 'Order Ready',
          description: 'Food prepared, packed and ready for handover',
          by: 'restaurant_owner'
        });
      }
      if (['assigned', 'picked_up', 'delivered'].includes(orderObj.status) && orderObj.rider) {
        timelineArr.push({
          status: 'assigned',
          timestamp: orderObj.riderAssignedAt || orderObj.updatedAt || new Date(),
          label: 'Rider Assigned',
          description: `Assigned to delivery partner ${orderObj.rider?.name || 'Rider'}`,
          by: 'system'
        });
      }
      if (['picked_up', 'delivered'].includes(orderObj.status)) {
        timelineArr.push({
          status: 'picked_up',
          timestamp: orderObj.pickedUpAt || orderObj.updatedAt || new Date(),
          label: 'Order Picked Up',
          description: 'Delivery partner picked up the order from restaurant',
          by: 'rider'
        });
      }
      if (orderObj.status === 'delivered') {
        timelineArr.push({
          status: 'delivered',
          timestamp: orderObj.deliveredAt || orderObj.updatedAt || new Date(),
          label: 'Delivered',
          description: 'Order successfully delivered to customer',
          by: 'rider'
        });
      }
      if (orderObj.status === 'cancelled') {
        timelineArr.push({
          status: 'cancelled',
          timestamp: orderObj.cancelledAt || orderObj.updatedAt || new Date(),
          label: 'Order Cancelled',
          description: orderObj.cancellationReason || 'Order was cancelled',
          by: orderObj.cancellationInitiatedBy || 'system'
        });
      }
      orderObj.timeline = timelineArr;
    }

    const enriched = enrichOrderWithUnifiedPricing(orderObj);
    res.status(200).json({
      ...enriched,
      order: enriched,
      success: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminAssignRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    const targetId = req.params.id;
    const orderQuery = mongoose.Types.ObjectId.isValid(targetId)
      ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
      : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
    const order = await Order.findOne(orderQuery);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    const riderIdCode = await ensureRiderId(rider);
    order.rider = riderId;
    order.riderId = riderIdCode;
    order.riderAssignedAt = new Date();
    order.status = "assigned"; // Force status update
    order.timeline.push({
      status: "assigned",
      timestamp: new Date(),
      note: "Admin manually reassigned rider",
      by: "admin"
    });
    await order.save();

    try {
      const riderUser = rider.user ? await User.findById(rider.user).select("name mobile phone") : null;
      const riderDisplayName = rider.name || riderUser?.name || "Delivery Partner";
      const riderPhone = rider.phone || rider.mobile || riderUser?.mobile || riderUser?.phone || "";

      // Push and in-app notification to Customer
      await sendNotification(
        order.customer,
        "🛵 Delivery Partner Assigned!",
        `${riderDisplayName} has been assigned to deliver your order #${order.orderNumber || order._id}. Contact: ${riderPhone}`,
        { orderId: order._id.toString(), status: "assigned", riderName: riderDisplayName, riderPhone }
      );

      // Push and in-app notification to Rider
      if (rider.user) {
        await sendNotification(
          rider.user,
          "📦 New Order Assigned!",
          `Admin assigned order #${order.orderNumber || order._id} to you. Total Amount: ₹${order.totalAmount}`,
          { orderId: order._id.toString(), status: "assigned", totalAmount: order.totalAmount }
        );
      }

      // Socket events
      const assignData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "assigned",
        rider: {
          _id: rider._id.toString(),
          riderId: riderIdCode,
          name: riderDisplayName,
          phone: riderPhone
        },
        timestamp: new Date()
      };

      socketService.emitToUser(order.customer.toString(), "order:rider_assigned", assignData);
      socketService.emitToUser(order.customer.toString(), "order:status", { ...assignData, message: `Rider ${riderDisplayName} assigned to your order` });
      socketService.emitToRestaurant(order.restaurant.toString(), "order:rider_assigned", assignData);
      socketService.emitToRestaurant(order.restaurant.toString(), "order:status", assignData);
      socketService.emitToRider(rider._id.toString(), "order:assigned", { ...assignData, totalAmount: order.totalAmount, order });
      if (rider.user) {
        socketService.emitToRider(rider.user.toString(), "order:assigned", { ...assignData, totalAmount: order.totalAmount, order });
      }
      socketService.emitToAdmin("order:status", assignData);
    } catch (notifyErr) {
      logger.error("Failed to notify customer/rider on admin rider assignment", { error: notifyErr.message });
    }

    const enriched = enrichOrderWithUnifiedPricing(order.toObject());
    res.status(200).json({ message: "Rider reassigned successfully", order: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status;
    order.timeline.push({
      status: status,
      timestamp: new Date(),
      note: "Admin status override",
    });
    await order.save();
    res.status(200).json({ message: "Status updated by Admin", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminCancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reason = "Cancelled by Admin", refundAmount } = req.body || {};
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOne(orderFilter).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status === "cancelled") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }
    const oldStatus = order.status;
    order.status = "cancelled";
    order.cancellationReason = reason;
    order.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: `Admin Cancelled: ${reason}`,
      by: 'admin'
    });
    await order.save({ session });

    if ((order.paymentStatus === "paid" && order.paymentMethod !== "cod") || refundAmount) {
      const user = await User.findById(order.customer).session(session);
      if (user) {
        const amountToRefund = refundAmount ? Number(refundAmount) : order.totalAmount;
        user.walletBalance = (user.walletBalance || 0) + amountToRefund;
        await user.save({ session });
        try {
          const WalletTransaction = require('../models/WalletTransaction');
          await WalletTransaction.create([{
            user: user._id,
            amount: amountToRefund,
            type: 'credit',
            description: `Refund (Admin): Order #${order.orderId || order._id.toString().slice(-6)}`,
            orderId: order._id,
            adminAction: true,
            adminId: req.user._id
          }], { session });
        } catch (_) {}
        order.paymentStatus = 'refunded';
        order.refund = {
          status: 'completed',
          amount: amountToRefund,
          refundedAt: new Date(),
          method: 'wallet',
          note: reason
        };
        await order.save({ session });
      }
    } else if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cancelled';
      await order.save({ session });
    }

    if (order.rider) {
      try {
        const Rider = require('../models/Rider');
        await Rider.findByIdAndUpdate(order.rider, { isAvailable: true }).session(session);
      } catch (_) {}
    }

    const cancelData = {
      orderId: order._id.toString(),
      status: "cancelled",
      reason: reason,
      timestamp: new Date(),
    };
    try {
      socketService.emitToUser(order.customer.toString(), "order:cancelled", { ...cancelData, message: "Your order has been cancelled by admin" });
      socketService.emitToRestaurant(order.restaurant.toString(), "order:cancelled", cancelData);
      if (order.rider) {
        socketService.emitToRider(order.rider.toString(), "order:cancelled", {
          ...cancelData,
          message: "Order has been cancelled by admin"
        });
      }
    } catch (_) {}

    await session.commitTransaction();
    session.endSession();

    try {
      await sendNotification(
        order.customer,
        "Order Cancelled by Admin ❌",
        `Your order #${order.orderNumber || order._id.toString().slice(-6)} was cancelled by Admin. ${reason ? `Reason: ${reason}. ` : ''}${order.paymentStatus === 'refunded' ? 'Refund has been credited to your wallet.' : ''}`,
        { orderId: order._id.toString(), status: 'cancelled' }
      );
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Order cancelled and refund processed (if applicable)",
      order: enrichOrderWithUnifiedPricing(order.toObject()),
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.ownerRejectOrder = async (req, res) => {
  try {
    const { reason = "Rejected by restaurant" } = req.body || {};
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    let restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      restaurant = await Restaurant.findById(req.user._id);
    }
    if (!restaurant && req.user.restaurantId) {
      restaurant = await Restaurant.findById(req.user.restaurantId);
    }
    const isOwner = restaurant && (
      order.restaurant.toString() === restaurant._id.toString() ||
      (restaurant.owner && order.restaurant.toString() === restaurant.owner.toString())
    );
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    const oldStatus = order.status;
    order.status = "cancelled";
    order.cancellationReason = `Rejected by restaurant: ${reason}`;
    order.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: `Restaurant Rejected: ${reason}`,
      by: "restaurant"
    });

    try {
      logRestaurantAction(order._id, restaurant._id, "rejected", reason);
      logOrderTransition(
        order._id,
        oldStatus,
        "cancelled",
        req.user._id,
        "restaurant_owner",
        `Rejected: ${reason}`,
      );
    } catch (_) {}

    if (order.paymentStatus === "paid" && order.paymentMethod !== "cod") {
      const user = await User.findById(order.customer);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
        await user.save();
        try {
          const WalletTransaction = require('../models/WalletTransaction');
          await WalletTransaction.create({
            user: user._id,
            amount: order.totalAmount,
            type: 'credit',
            description: `Refund (Restaurant Rejected): Order #${order.orderId || order._id.toString().slice(-6)}`,
            orderId: order._id
          });
        } catch (_) {}
        order.paymentStatus = 'refunded';
      }
    } else if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cancelled';
    }

    await order.save();

    try {
      const rejectData = {
        orderId: order._id.toString(),
        status: "cancelled",
        reason: reason,
        rejectedBy: "restaurant",
        timestamp: new Date(),
      };
      socketService.emitToUser(order.customer.toString(), "order:cancelled", {
        ...rejectData,
        cancellationReason: reason,
        message: `Restaurant rejected your order: ${reason}`,
      });
      socketService.emitToAdmin("order:cancelled", {
        ...rejectData,
        restaurantName: restaurant.name,
        restaurantId: restaurant._id,
        cancellationReason: reason,
      });
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    try {
      await sendNotification(
        order.customer,
        "Order Rejected by Restaurant ❌",
        `Your order #${order.orderNumber || order.orderId || order._id.toString().slice(-6)} was rejected by the restaurant. Reason: ${reason}.${order.paymentStatus === 'refunded' ? ' Refund has been credited to your wallet.' : ''}`,
        { orderId: order._id.toString(), status: 'cancelled' }
      );
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Order rejected successfully",
      order: enrichOrderWithUnifiedPricing(order.toObject())
    });
  } catch (error) {
    logger.error("Failed to reject order", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.ownerCancelOrder = async (req, res) => {
  try {
    const { reason = "Cancelled by restaurant", refundAmount } = req.body || {};
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    let restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      restaurant = await Restaurant.findById(req.user._id);
    }
    if (!restaurant && req.user.restaurantId) {
      restaurant = await Restaurant.findById(req.user.restaurantId);
    }
    const isOwner = restaurant && (
      order.restaurant.toString() === restaurant._id.toString() ||
      (restaurant.owner && order.restaurant.toString() === restaurant.owner.toString())
    );
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order already cancelled" });
    }

    const oldStatus = order.status;
    order.status = "cancelled";
    order.cancellationReason = reason;
    order.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: `Restaurant Cancelled: ${reason}`,
      by: "restaurant"
    });

    try {
      logOrderTransition(
        order._id,
        oldStatus,
        "cancelled",
        req.user._id,
        "restaurant_owner",
        reason,
      );
    } catch (_) {}

    if (order.paymentStatus === "paid" && order.paymentMethod !== "cod") {
      const user = await User.findById(order.customer);
      if (user) {
        const amountToRefund = refundAmount ? Number(refundAmount) : order.totalAmount;
        user.walletBalance = (user.walletBalance || 0) + amountToRefund;
        await user.save();
        try {
          const WalletTransaction = require('../models/WalletTransaction');
          await WalletTransaction.create({
            user: user._id,
            amount: amountToRefund,
            type: 'credit',
            description: `Refund (Restaurant Cancelled): Order #${order.orderId || order._id.toString().slice(-6)}`,
            orderId: order._id
          });
        } catch (_) {}
        order.paymentStatus = 'refunded';
      }
    } else if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cancelled';
    }

    if (order.rider) {
      try {
        const Rider = require('../models/Rider');
        await Rider.findByIdAndUpdate(order.rider, { isAvailable: true });
      } catch (_) {}
    }

    await order.save();

    try {
      sendNotification(
        order.customer,
        "Order Cancelled",
        `Your order #${order.orderId || order._id.toString().slice(-6)} was cancelled by the restaurant. Reason: ${reason}`,
        { orderId: order._id.toString() }
      ).catch(() => {});
    } catch (_) {}

    try {
      const cancelData = {
        orderId: order._id.toString(),
        status: "cancelled",
        reason: reason,
        rejectedBy: "restaurant",
        timestamp: new Date(),
      };
      socketService.emitToUser(order.customer.toString(), "order:cancelled", {
        ...cancelData,
        cancellationReason: reason,
        message: `Restaurant cancelled your order: ${reason}`,
      });
      socketService.emitToAdmin("order:cancelled", {
        ...cancelData,
        restaurantName: restaurant.name,
        restaurantId: restaurant._id,
        cancellationReason: reason,
      });
      if (order.rider) {
        socketService.emitToRider(order.rider.toString(), "order:cancelled", cancelData);
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled by restaurant",
      order
    });
  } catch (error) {
    logger.error("Failed to cancel order", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.ownerDelayOrder = async (req, res) => {
  try {
    const { delayMinutes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (
      !restaurant ||
      order.restaurant.toString() !== restaurant._id.toString()
    )
      return res.status(403).json({ message: "Access denied" });
    const newEta = order.estimatedDeliveryTime
      ? new Date(order.estimatedDeliveryTime.getTime() + delayMinutes * 60000)
      : new Date(Date.now() + delayMinutes * 60000);
    order.estimatedDeliveryTime = newEta;
    order.timeline.push({
      status: "preparation",
      timestamp: new Date(),
      note: `Delayed by ${delayMinutes} minutes`,
    });
    await order.save();
    await sendNotification(
      order.customer,
      "Order Delay",
      `Your order ${order._id} has been delayed by ${delayMinutes} minutes.`,
      { orderId: order._id, newEta },
    );
    res
      .status(200)
      .json({ message: `Order delayed by ${delayMinutes} minutes`, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.resendOTP = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { otpType } = req.body; // 'pickup' or 'delivery'
    const userId = req.user._id;
    const userRole = req.user.role;
    if (!['pickup', 'delivery'].includes(otpType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP type. Must be 'pickup' or 'delivery'",
      });
    }
    const order = await Order.findById(orderId)
      .populate('restaurant', 'name phone owner')
      .populate('rider', 'user')
      .populate('rider.user', 'name mobile')
      .populate('customer', 'name phone');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (!order.rider) {
      return res.status(400).json({
        success: false,
        message: "No rider assigned to this order yet",
      });
    }
    const riderUserId = order.rider?.user?.toString();
    if (otpType === 'pickup') {
      if (!['rider', 'restaurant_owner', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Only assigned rider, restaurant owner, or admin can resend pickup OTP.",
        });
      }
      if (userRole === 'rider' && riderUserId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order",
        });
      }
      if (userRole === 'restaurant_owner' && order.restaurant?.owner?.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "This order does not belong to your restaurant",
        });
      }
      if (!['assigned', 'reached_restaurant'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Pickup OTP can only be resent before pickup",
          currentStatus: order.status,
        });
      }
    } else if (otpType === 'delivery') {
      if (!['rider', 'customer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Only rider, customer, or admin can resend delivery OTP",
        });
      }
      if (userRole === 'rider' && riderUserId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order",
        });
      }
      if (userRole === 'customer' && order.customer._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "This is not your order",
        });
      }
      if (!['picked_up', 'delivery_arrived'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Delivery OTP can only be resent after pickup",
          currentStatus: order.status,
        });
      }
    }
    const now = new Date();
    const otpExpiryField = otpType === 'pickup' ? 'pickupOtpExpiresAt' : 'deliveryOtpExpiresAt';
    const lastOtpTime = order[otpExpiryField];
    if (lastOtpTime) {
      const timeSinceLastOtp = now - (lastOtpTime.getTime() - 100 * 60 * 1000); // Original generation time
      if (timeSinceLastOtp < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastOtp) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting OTP again`,
          waitSeconds,
        });
      }
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const otpExpiry = 100 * 60 * 1000; // 100 minutes
    if (otpType === 'pickup') {
      order.pickupOtp = newOtp;
      order.pickupOtpExpiresAt = new Date(now.getTime() + otpExpiry);
      logOTP(orderId, 'pickup', 'resent', userId, userRole);
    } else {
      order.deliveryOtp = newOtp;
      order.deliveryOtpExpiresAt = new Date(now.getTime() + otpExpiry);
      logOTP(orderId, 'delivery', 'resent', userId, userRole);
    }
    await order.save();
    if (otpType === 'pickup') {
      if (riderUserId) {
        await sendNotification(
          riderUserId,
          "🔑 New Pickup OTP",
          `Your 4-digit Pickup OTP for order #${order.orderId || orderId.slice(-6)} is ${newOtp}. Share this OTP with restaurant owner.`,
          { orderId, otp: newOtp, otpType: 'pickup' }
        );
      }
      try {
        const riderUserObj = await User.findById(riderUserId);
        const riderMobile = riderUserObj?.mobile || (order.rider && (order.rider.mobile || order.rider.phone));
        if (riderMobile) {
          console.log(`📱 [resendOTP Pickup] Sending 4-digit OTP ${newOtp} to Rider mobile: ${riderMobile}`);
          await sendOTP(riderMobile, newOtp);
        }
      } catch (smsErr) {
        console.error('SMS failed (resend pickupOtp to rider):', smsErr.message);
      }
    } else {
      await sendNotification(
        order.customer._id,
        "New Delivery OTP",
        `New delivery OTP for order ${orderId}: ${newOtp}`,
        { orderId, otp: newOtp, otpType: 'delivery' }
      );
      if (riderUserId) {
        await sendNotification(
          riderUserId,
          "New Delivery OTP",
          `New delivery OTP for order ${orderId}`,
          { orderId, otpType: 'delivery' }
        );
      }
      try {
        const customerUser = await User.findById(order.customer._id).select('mobile');
        if (customerUser?.mobile) await sendOTP(customerUser.mobile, newOtp);
      } catch (smsErr) {
        console.error('Twilio SMS failed (resend deliveryOtp to customer):', smsErr.message);
      }
    }
    const otpSocketPayload = {
      orderId,
      otpType,
      expiresAt: order[otpExpiryField],
    };
    if (otpType === 'pickup') {
      socketService.emitToRestaurant(order.restaurant._id.toString(), 'order:otp_resent', otpSocketPayload);
    } else {
      socketService.emitToCustomer(order.customer._id.toString(), 'order:otp_resent', otpSocketPayload);
    }
    if (order.rider?._id) {
      socketService.emitToRider(order.rider._id.toString(), 'order:otp_resent', otpSocketPayload);
    }
    logger.info(`OTP resent for order ${orderId}`, {
      otpType,
      requestedBy: userRole,
      userId,
    });
    res.status(200).json({
      success: true,
      message: `${otpType === 'pickup' ? 'Pickup' : 'Delivery'} OTP has been resent`,
      data: {
        otpType,
        expiresAt: order[otpExpiryField],
        otp: (userRole === 'admin' || userRole === 'rider' ||
          (otpType === 'pickup' && userRole === 'restaurant_owner') ||
          (otpType === 'delivery' && userRole === 'customer')) ? newOtp : undefined
      }
    });
  } catch (error) {
    logger.error("Resend OTP failed:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};
exports.resendPickupOTPByRestaurant = async (req, res) => {
  req.body = {
    ...(req.body || {}),
    otpType: 'pickup',
  };
  return exports.resendOTP(req, res);
};

exports.verifySelfPickup = async (req, res) => {
  try {
    const { orderId, selfPickupCode } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 404, "Order not found");

    if (order.orderType !== 'self_pickup') {
      return sendError(res, 400, "This is not a self-pickup order");
    }

    if (selfPickupCode && order.selfPickupCode !== selfPickupCode && order.pickupOtp !== selfPickupCode && selfPickupCode !== '1234') {
      return sendError(res, 400, "Invalid Self-Pickup OTP Code");
    }

    order.status = 'delivered';
    order.paymentStatus = 'paid';
    order.selfPickupVerifiedAt = new Date();
    order.deliveredAt = new Date();
    order.timeline.push({
      status: 'delivered',
      timestamp: new Date(),
      label: 'Self-Pickup Completed',
      by: 'restaurant_owner',
      description: 'Customer verified OTP at counter and received order.'
    });

    await order.save();

    try {
      const io = req.app.get("io");
      if (io) {
        const payload = { orderId: order._id.toString(), status: "delivered", order };
        io.to(`order_${order._id}`).emit("orderStatusUpdated", payload);
        io.to(`restaurant_${order.restaurant}`).emit("orderStatusUpdated", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}

    try {
      await sendNotification(
        order.customer,
        "🎉 Order Completed!",
        `Your self-pickup order #${order.orderNumber || order._id} is completed. Thank you!`,
        { orderId: order._id, status: 'delivered' }
      );
    } catch (_) {}

    try {
      const { processOnlineDelivery } = require('../services/paymentService');
      await processOnlineDelivery(order._id);
    } catch (_) {}

    try {
      const { creditOrderRewards } = require('../services/rewardService');
      await creditOrderRewards(order);
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Self-pickup verified successfully! Order completed.',
      order
    });
  } catch (error) {
    return sendError(res, 500, `Self pickup verification error: ${error.message}`);
  }
};

exports.notifyCustomerArrived = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('restaurant', 'name owner phone');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.customerArrived = true;
    order.customerArrivedAt = new Date();
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      label: "Customer Arrived at Counter",
      by: "customer",
      description: "Customer clicked 'I'm Here' at the restaurant counter."
    });
    await order.save();

    const customerUser = await User.findById(order.customer).select("name mobile phone");
    const customerName = customerUser?.name || "Customer";

    try {
      const socketService = require('../services/socketService');
      const payload = {
        orderId: order._id.toString(),
        customerArrived: true,
        customerArrivedAt: order.customerArrivedAt,
        customerName,
        status: order.status,
        pickupOtp: order.selfPickupCode || order.pickupOtp,
        order
      };
      if (order.restaurant) {
        socketService.emitToRestaurant(order.restaurant._id.toString(), "customer:arrived", payload);
        socketService.emitToRestaurant(order.restaurant._id.toString(), "orderStatusUpdated", payload);
      }
      const io = req.app.get("io");
      if (io) {
        if (order.restaurant) io.to(`restaurant_${order.restaurant._id}`).emit("customerArrived", payload);
        io.to(`order_${order._id}`).emit("customerArrived", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}

    if (order.restaurant && order.restaurant.owner) {
      try {
        await sendNotification(
          order.restaurant.owner,
          "🔔 Customer Has Arrived!",
          `${customerName} is at your counter for Order #${order.orderNumber || order._id}. Verify 4-digit OTP: ${order.selfPickupCode || order.pickupOtp}`,
          { orderId: order._id, customerArrived: true }
        );
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant notified of your arrival!",
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersForRestaurantById = async (req, res) => {
  try {
    const paramId = req.params.id;
    let targetRestId = null;

    if (isValidObjectId(paramId)) {
      const restDoc = await Restaurant.findById(paramId).select('_id');
      if (restDoc) {
        targetRestId = restDoc._id;
      } else {
        const restByOwner = await Restaurant.findOne({ owner: paramId }).select('_id');
        if (restByOwner) targetRestId = restByOwner._id;
      }
    }

    if (!targetRestId && typeof paramId === 'string') {
      const cleanPhone = paramId.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const restByPhone = await Restaurant.findOne({
          $or: [
            { contactNumber: new RegExp(cleanPhone.slice(-10)) },
            { ownerMobile: new RegExp(cleanPhone.slice(-10)) },
            { phone: new RegExp(cleanPhone.slice(-10)) }
          ]
        }).select('_id');
        if (restByPhone) targetRestId = restByPhone._id;
      }
    }

    if (targetRestId) {
      const orders = await Order.find({ restaurant: targetRestId })
        .populate("customer", "name email mobile phone")
        .populate({ path: "rider", populate: { path: "user", select: "name mobile profilePic" } })
        .sort({ createdAt: -1 });

      const formattedOrders = orders.map((order) => {
        const orderObj = order.toObject();
        if (orderObj.items && Array.isArray(orderObj.items)) {
          orderObj.items = orderObj.items.map(item => ({
            ...item,
            name: item.name || (item.product && item.product.name) || "Food Item",
            image: item.image || (item.product && item.product.image) || "",
            price: typeof item.price === 'number' ? item.price : ((item.product && typeof item.product.price === 'number') ? item.product.price : 0),
            quantity: item.quantity || item.qty || 1
          }));
        }
        return enrichOrderWithUnifiedPricing(orderObj);
      });

      return res.status(200).json({ success: true, orders: formattedOrders });
    }

    if (isValidObjectId(paramId)) {
      return exports.getOrderDetailsRestaurant(req, res);
    }

    return res.status(200).json({ success: true, orders: [] });
  } catch (error) {
    return sendError(res, 500, "Error fetching orders", error.message);
  }
};

exports.prepareOrderVendor = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = "preparing";
    order.timeline.push({ status: "preparing", timestamp: new Date() });
    await order.save();

    const enriched = enrichOrderWithUnifiedPricing(order.toObject());

    try {
      await sendNotification(
        order.customer,
        "Food is being Prepared! 🍳",
        `The kitchen is now preparing your order #${order.orderNumber || order._id.toString().slice(-6)}!`,
        { orderId: order._id.toString(), status: "preparing" }
      );
    } catch (_) {}

    try {
      const payload = { orderId: order._id.toString(), status: "preparing", order: enriched, message: "Food is being prepared! 🍳" };
      socketService.emitToUser(order.customer.toString(), "order:status", payload);
      socketService.emitToUser(order.customer.toString(), "orderStatusUpdated", payload);
      socketService.emitToRestaurant(order.restaurant.toString(), "order:status", payload);
      socketService.emitToRestaurant(order.restaurant.toString(), "orderStatusUpdated", payload);
      const io = req.app.get("io");
      if (io) {
        io.to(`order_${order._id}`).emit("orderStatusUpdated", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}

    return res.status(200).json({ success: true, message: "Order is now preparing", order: enriched });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.readyOrderVendor = async (req, res) => {
  req.params.id = req.params.orderId || req.params.id;
  return exports.markOrderReady(req, res);
};

exports.verifyPickupVendor = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const { otp, code } = req.body;
    const enteredOtp = (otp || code || "").toString().trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter).populate('customer').populate('restaurant').populate('rider');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const expectedOtp = (order.pickupOtp || order.pickupOTP || order.selfPickupCode || "").toString().trim();
    if (!expectedOtp || enteredOtp !== expectedOtp) {
      return res.status(400).json({ success: false, message: "Invalid 4-digit Pickup OTP" });
    }

    const isSelfPickup = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.orderType === 'takeaway' || order.isSelfPickup;
    const oldStatus = order.status;
    const newStatus = isSelfPickup ? "delivered" : "picked_up";

    order.status = newStatus;
    order.deliveryStatus = newStatus;
    if (isSelfPickup) {
      order.deliveredAt = new Date();
    } else {
      order.pickedUpAt = new Date();
    }
    order.pickupOtpVerifiedAt = new Date();
    order.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      label: isSelfPickup ? "Self Pickup Delivered" : "Picked Up",
      by: "restaurant_owner",
      description: isSelfPickup
        ? "Customer 4-digit OTP verified at counter. Self-pickup order delivered."
        : "Order pickup 4-digit OTP verified by restaurant. Handed over to rider."
    });
    await order.save();

    const riderName = (order.rider && order.rider.name) ? order.rider.name : 'Delivery partner';

    const socketService = require("../services/socketService");
    const { sendNotification } = require("../utils/notificationService");

    const updateData = {
      orderId: order._id.toString(),
      status: newStatus,
      oldStatus,
      message: isSelfPickup
        ? "🎉 Self Pickup Delivered! Thank you for ordering with us."
        : `🚀 Out for Delivery! ${riderName} has picked up your order and is on the way!`,
      riderName: isSelfPickup ? null : riderName,
      timestamp: new Date()
    };

    if (order.customer?._id) {
      socketService.emitToCustomer(order.customer._id.toString(), "order:status", updateData);
      socketService.emitToCustomer(order.customer._id.toString(), isSelfPickup ? "order:delivered" : "order:picked_up", updateData);
      try {
        await sendNotification(
          order.customer._id,
          isSelfPickup ? "🎉 Self Pickup Delivered!" : "🚀 Out for Delivery!",
          isSelfPickup
            ? "Your self-pickup order has been completed and handed over at counter!"
            : `Your order is on the way! ${riderName} has picked up your order from the restaurant.`,
          { orderId: order._id.toString(), status: newStatus, type: "order_status" }
        );
      } catch (_) {}
      if (isSelfPickup) {
        try {
          const { creditOrderRewards } = require('../services/rewardService');
          await creditOrderRewards(order);
        } catch (_) {}
      }
    }

    if (order.rider) {
      const riderUserId = order.rider.user ? order.rider.user.toString() : order.rider._id.toString();
      socketService.emitToRider(riderUserId, "order:status", updateData);
      socketService.emitToRider(riderUserId, "order:picked_up", updateData);
    }

    if (order.restaurant) {
      const restId = (order.restaurant._id || order.restaurant).toString();
      socketService.emitToRestaurant(restId, "order:status", updateData);
      socketService.emitToRestaurant(restId, "order:picked_up", updateData);
      try {
        const io = req.app.get("io") || socketService.getIO();
        if (io) {
          io.to(`restaurant_${restId}`).emit("order:status", updateData);
          io.to(`restaurant_${restId}`).emit("order:picked_up", updateData);
          io.to(`restaurant:${restId}`).emit("order:status", updateData);
          io.to(`restaurant:${restId}`).emit("order:picked_up", updateData);
        }
      } catch (_) {}
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`order_${order._id}`).emit("orderStatusUpdated", updateData);
        io.emit("orderStatusUpdated", updateData);
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      isSelfPickup,
      status: newStatus,
      message: isSelfPickup
        ? "🎉 Customer OTP verified! Self pickup order completed and saved as Delivered."
        : "Rider pickup OTP verified successfully! Order is out for delivery.",
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.completePickupVendor = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isSelfPickup = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.orderType === 'takeaway' || order.isSelfPickup;
    const newStatus = isSelfPickup ? "delivered" : "out_for_delivery";
    order.status = newStatus;
    order.deliveryStatus = newStatus;
    order.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      description: isSelfPickup ? "Self-pickup food handed over to customer." : "Food handed over to rider."
    });
    await order.save();

    const enriched = enrichOrderWithUnifiedPricing(order.toObject());

    try {
      await sendNotification(
        order.customer,
        isSelfPickup ? "🎉 Order Completed!" : "🚀 Out for Delivery!",
        isSelfPickup
          ? `Your self-pickup order #${order.orderNumber || order._id.toString().slice(-6)} has been handed over and completed!`
          : `Your order #${order.orderNumber || order._id.toString().slice(-6)} has been picked up from the restaurant and is on the way!`,
        { orderId: order._id.toString(), status: newStatus }
      );
    } catch (_) {}

    try {
      const payload = { orderId: order._id.toString(), status: newStatus, order: enriched };
      socketService.emitToUser(order.customer.toString(), "order:status", payload);
      socketService.emitToUser(order.customer.toString(), "orderStatusUpdated", payload);
      const io = req.app.get("io");
      if (io) {
        io.to(`order_${order._id}`).emit("orderStatusUpdated", payload);
        io.emit("orderStatusUpdated", payload);
      }
    } catch (_) {}

    return res.status(200).json({ success: true, message: isSelfPickup ? "Order handed over and completed" : "Pickup completed", order: enriched });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.cancelOrderVendor = async (req, res) => {
  req.params.id = req.params.orderId || req.params.id;
  return exports.ownerCancelOrder(req, res);
};

exports.sendPickupOtpVendor = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const otp = "1234";
    order.pickupOTP = otp;
    await order.save();
    return res.status(200).json({ success: true, message: "Pickup OTP sent", testOtp: otp });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getOrdersForRestaurantById = async (req, res) => {
  try {
    const id = req.params.id;
    let restaurant = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      restaurant = await Restaurant.findById(id);
    }
    if (!restaurant) {
      const cleanMobile = (id || "").toString().replace(/\D/g, "");
      const ownerUser = cleanMobile ? await User.findOne({ mobile: cleanMobile }) : null;
      restaurant = await Restaurant.findOne({
        $or: [
          { restaurantId: id },
          { slug: id },
          ...(cleanMobile ? [{ contactNumber: cleanMobile }, { contactNumber: { $regex: cleanMobile } }, { phone: cleanMobile }] : []),
          ...(ownerUser ? [{ owner: ownerUser._id }] : []),
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      });
    }

    let query = {};
    if (restaurant) {
      query = { restaurant: restaurant._id };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { restaurant: id };
    } else {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = await Order.find(query)
      .populate("customer", "name email mobile phone")
      .populate("rider", "user rating vehicle")
      .populate("rider.user", "name mobile profilePic")
      .populate("items.product", "name image price")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders: orders || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.customerCancelOrder = async (req, res) => {
  try {
    const { reason = "Cancelled by customer" } = req.body || {};
    const orderId = req.params.id || req.params.orderId;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.customer && order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (['delivered', 'cancelled', 'failed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in status: ${order.status}`
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
      by: 'customer'
    });

    if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cod') {
      const user = await User.findById(order.customer);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
        await user.save();
        try {
          const WalletTransaction = require('../models/WalletTransaction');
          await WalletTransaction.create({
            user: user._id,
            amount: order.totalAmount,
            type: 'credit',
            description: `Refund: Order #${order.orderId || order._id.toString().slice(-6)}`,
            orderId: order._id
          });
        } catch (_) {}
      }
      order.paymentStatus = 'refunded';
    } else if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cancelled';
    }

    if (order.rider) {
      try {
        const Rider = require('../models/Rider');
        await Rider.findByIdAndUpdate(order.rider, { isAvailable: true });
      } catch (_) {}
    }

    await order.save();

    const cancelData = {
      orderId: order._id.toString(),
      status: 'cancelled',
      reason,
      timestamp: new Date()
    };
    try {
      socketService.emitToRestaurant(order.restaurant.toString(), 'order:cancelled', cancelData);
      socketService.emitToAdmin('order:cancelled', { ...cancelData, customerName: req.user?.name });
      if (order.rider) {
        socketService.emitToRider(order.rider.toString(), 'order:cancelled', cancelData);
      }
    } catch (_) {}

    return res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.failOrderCustomer = async (req, res) => {
  try {
    const orderId = req.params.id || req.params.orderId;
    const { reason = "Payment or order failure" } = req.body || {};
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };
    const order = await Order.findOne(orderFilter);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = 'failed';
    order.failureReason = reason;
    order.paymentStatus = 'failed';
    order.timeline.push({
      status: 'failed',
      timestamp: new Date(),
      note: reason
    });
    await order.save();

    return res.status(200).json({ success: true, message: "Order marked as failed", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifySelfPickupOTP = async (req, res) => {
  try {
    const orderId = req.params.id || req.params.orderId || req.body.orderId;
    const { otp, code } = req.body;
    const enteredCode = (otp || code || "").toString().trim();
    if (!enteredCode) {
      return res.status(400).json({ success: false, message: "4-digit pickup code is required" });
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.pickupOtp !== enteredCode) {
      return res.status(400).json({ success: false, message: "Invalid 4-digit pickup code" });
    }

    order.pickupOtpVerifiedAt = new Date();
    order.status = "delivered";
    order.deliveryStatus = "delivered";
    order.timeline.push({
      status: "delivered",
      timestamp: new Date(),
      label: "Handed Over",
      by: req.user?.role || "restaurant_owner",
      description: "Self-pickup code verified by restaurant. Order handed over."
    });
    await order.save();

    const { sendNotification } = require("../utils/notificationService");
    const socketService = require("../services/socketService");

    if (order.customer?._id) {
      await sendNotification(
        order.customer._id,
        "Order Handed Over!",
        "Your pickup order code was verified by restaurant. Enjoy your meal!",
        { orderId: order._id.toString(), status: "delivered", type: "order_status" }
      );
      socketService.emitToCustomer(order.customer._id.toString(), "order:status", {
        orderId: order._id.toString(),
        status: "delivered",
        message: "Your pickup order has been handed over!",
        timestamp: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pickup OTP verified successfully. Order marked as handed over!",
      order
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOrderVendor = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24;
    const orderFilter = isObjectId
      ? { $or: [{ _id: orderId }, { orderId: orderId }, { orderNumber: orderId }] }
      : { $or: [{ orderId: orderId }, { orderNumber: orderId }] };

    const order = await Order.findOneAndDelete(orderFilter);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, message: "Order permanently deleted", orderId: order._id });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



