
const Promocode = require('../models/Promocode');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');
async function calculateOrderPrice({
  items,
  restaurantId,
  userId = null,
  couponCode = null,
  deliveryDistance = 0,
  tip = 0,
  useWallet = false,
  walletBalance = 0
}) {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    let itemTotal = 0;
    for (const item of items) {
      let itemPrice = item.price || 0;
      if (item.variation && item.variation.price) {
        itemPrice += item.variation.price;
      }
      if (item.addOns && Array.isArray(item.addOns)) {
        const addOnsTotal = item.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
        itemPrice += addOnsTotal;
      }
      itemTotal += itemPrice * (item.quantity || 1);
    }
    const taxRate = restaurant.taxRate || 0.05;
    const tax = itemTotal * taxRate;
    const packaging = restaurant.packagingCharge || 0;
    let deliveryFee = calculateDeliveryFee(deliveryDistance, restaurant);
    if (restaurant.isFreeDelivery && itemTotal >= (restaurant.freeDeliveryContribution || 0)) {
      deliveryFee = 0;
    }
    const platformFee = restaurant.platformFee || 5;
    const smallCartThreshold = 150;
    const smallCartFee = itemTotal < smallCartThreshold ? 20 : 0;
    const surgeMultiplier = await calculateSurgeMultiplier(restaurant);
    const surgeFee = deliveryFee * (surgeMultiplier - 1); // Extra fee beyond base delivery
    const subtotal = itemTotal + tax + packaging + deliveryFee + platformFee + smallCartFee + surgeFee;
    const couponResult = await validateAndApplyCoupon({
      couponCode,
      itemTotal,
      restaurantId,
      userId,
      deliveryFee
    });
    let discount = couponResult.discount;
    let finalDeliveryFee = couponResult.freeDelivery ? 0 : deliveryFee;
    const couponError = couponResult.error;
    let totalAmount = itemTotal + tax + packaging + finalDeliveryFee + platformFee + smallCartFee + surgeFee - discount + tip;
    totalAmount = Math.max(0, totalAmount); // Never negative
    let walletDeduction = 0;
    let amountToPay = totalAmount;
    if (useWallet && walletBalance > 0) {
      walletDeduction = Math.min(walletBalance, totalAmount);
      amountToPay = totalAmount - walletDeduction;
    }
    return {
      success: true,
      breakdown: {
        itemTotal: round(itemTotal),
        tax: round(tax),
        taxRate: taxRate,
        packaging: round(packaging),
        deliveryFee: round(finalDeliveryFee),
        platformFee: round(platformFee),
        smallCartFee: round(smallCartFee),
        surgeFee: round(surgeFee),
        surgeMultiplier: surgeMultiplier,
        discount: round(discount),
        tip: round(tip),
        subtotal: round(subtotal),
        totalAmount: round(totalAmount),
        walletDeduction: round(walletDeduction),
        amountToPay: round(amountToPay)
      },
      coupon: {
        code: couponCode || null,
        applied: discount > 0 || couponResult.freeDelivery,
        error: couponError,
        freeDelivery: couponResult.freeDelivery || false
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      breakdown: null
    };
  }
}
function calculateDeliveryFee(distance, restaurant) {
  let baseFee = restaurant.baseDeliveryFee || 40;
  if (restaurant.perKmCharge && distance > 0) {
    const baseDistance = restaurant.baseDeliveryDistance || 3; // First 3km included in base
    if (distance > baseDistance) {
      const extraDistance = distance - baseDistance;
      const extraCharge = extraDistance * restaurant.perKmCharge;
      baseFee += extraCharge;
    }
  }
  const maxDeliveryFee = restaurant.maxDeliveryFee || 100;
  return Math.min(baseFee, maxDeliveryFee);
}
async function calculateSurgeMultiplier(restaurant) {
  let multiplier = 1.0;
  if (!restaurant.enableSurgePricing) {
    return multiplier;
  }
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  if (hour >= 12 && hour < 14) {
    multiplier = 1.2;
  }
  if (hour >= 19 && hour < 22) {
    multiplier = 1.3;
  }
  if ((day >= 5 || day === 0) && hour >= 18) {
    multiplier = Math.max(multiplier, 1.4);
  }
  return multiplier;
}
async function validateAndApplyCoupon({
  couponCode,
  itemTotal,
  restaurantId,
  userId,
  deliveryFee
}) {
  if (!couponCode) {
    return { discount: 0, freeDelivery: false, error: null };
  }
  const promo = await Promocode.findOne({
    code: couponCode,
    status: 'active'
  });
  if (!promo) {
    return { discount: 0, freeDelivery: false, error: 'Invalid coupon code' };
  }
  const now = new Date();
  if (now < promo.availableFrom || now > promo.expiryDate) {
    return { discount: 0, freeDelivery: false, error: 'Coupon expired or not yet active' };
  }
  if (promo.restaurant && promo.restaurant.toString() !== restaurantId.toString()) {
    return { discount: 0, freeDelivery: false, error: 'Coupon not valid for this restaurant' };
  }
  if (itemTotal < (promo.minOrderValue || 0)) {
    const needed = promo.minOrderValue - itemTotal;
    return { 
      discount: 0, 
      freeDelivery: false, 
      error: `Add items worth ₹${needed.toFixed(2)} more to apply this coupon` 
    };
  }
  if (promo.isTimeBound) {
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (promo.activeDays && promo.activeDays.length > 0 && !promo.activeDays.includes(currentDay)) {
      return { 
        discount: 0, 
        freeDelivery: false, 
        error: `Coupon valid only on ${promo.activeDays.join(', ')}` 
      };
    }
    if (promo.timeSlots && promo.timeSlots.length > 0) {
      const isValidTime = promo.timeSlots.some(slot => {
        return currentTime >= slot.startTime && currentTime <= slot.endTime;
      });
      if (!isValidTime) {
        return { discount: 0, freeDelivery: false, error: 'Coupon not valid at this time' };
      }
    }
  }
  if (userId && promo.usageLimitPerUser > 0) {
    const usageCount = await Order.countDocuments({
      customer: userId,
      couponCode: promo.code,
      status: { $ne: 'cancelled' }
    });
    if (usageCount >= promo.usageLimitPerUser) {
      return { 
        discount: 0, 
        freeDelivery: false, 
        error: 'You have reached usage limit for this coupon' 
      };
    }
  }
  if (promo.usageLimitPerCoupon > 0 && promo.usedCount >= promo.usageLimitPerCoupon) {
    return { discount: 0, freeDelivery: false, error: 'Coupon usage limit reached' };
  }
  let discount = 0;
  let freeDelivery = false;
  if (promo.offerType === 'percent') {
    discount = (itemTotal * promo.discountValue) / 100;
    if (promo.maxDiscountAmount > 0) {
      discount = Math.min(discount, promo.maxDiscountAmount);
    }
  } else if (promo.offerType === 'flat' || promo.offerType === 'amount') {
    discount = promo.discountValue;
  } else if (promo.offerType === 'free_delivery') {
    freeDelivery = true;
    discount = 0; // Discount is applied by making delivery free
  }
  discount = Math.min(discount, itemTotal);
  return { discount, freeDelivery, error: null };
}
function round(value) {
  return Math.round(value * 100) / 100;
}
async function recalculateOrderPrice(order) {
  return await calculateOrderPrice({
    items: order.items,
    restaurantId: order.restaurant,
    userId: order.customer,
    couponCode: order.couponCode,
    tip: order.tip || 0
  });
}
module.exports = {
  calculateOrderPrice,
  calculateDeliveryFee,
  calculateSurgeMultiplier,
  validateAndApplyCoupon,
  recalculateOrderPrice
};
