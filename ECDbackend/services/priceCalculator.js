const Promocode = require('../models/Promocode');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Order = require('../models/Order');
const AdminSetting = require('../models/AdminSetting');

/**
 * Calculates complete order pricing, delivery fees, surge charges, platform fees, packaging fees,
 * discounts, and commission precedence based on central AdminSetting & restaurant overrides.
 */
async function calculateOrderPrice({
  items,
  restaurantId,
  userId = null,
  couponCode = null,
  deliveryDistance = 0,
  tip = 0,
  useWallet = false,
  walletBalance = 0,
  orderType = 'delivery'
}) {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const adminSetting = await AdminSetting.getSettings();

    // 1. Calculate Item Total
    let itemTotal = 0;
    let categoriesInCart = new Set();

    for (const item of items) {
      let itemPrice = item.price || item.basePrice || 0;
      if (item.variation && item.variation.price) {
        itemPrice += item.variation.price;
      }
      if (item.addOns && Array.isArray(item.addOns)) {
        const addOnsTotal = item.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
        itemPrice += addOnsTotal;
      }
      itemTotal += itemPrice * (item.quantity || 1);

      if (item.category) {
        categoriesInCart.add(item.category.toString());
      }
    }

    // 2. Tax & Packaging Calculation
    const taxRate = restaurant.taxConfig?.gstPercent ? (restaurant.taxConfig.gstPercent / 100) : 0.05;
    const tax = itemTotal * taxRate;
    
    let packaging = 0;
    if (adminSetting.packagingFeeConfig?.enabled !== false) {
      packaging = restaurant.packagingCharge !== undefined && restaurant.packagingCharge > 0
        ? restaurant.packagingCharge
        : (adminSetting.packagingFeeConfig?.globalPackagingFee || 0);
    }

    // 3. Delivery Fee & Distance Slab Calculation
    let deliveryFee = 0;
    let extraDeliveryCharges = 0;
    let deliveryRuleApplied = 'Global Slabs';
    let freeDeliveryApplied = false;
    let surgeApplied = false;
    let isRadiusExceeded = false;

    if (orderType === 'self_pickup') {
      deliveryFee = 0;
      deliveryRuleApplied = 'Self Pickup (₹0)';
    } else {
      const maxRadius = adminSetting.deliveryFeeConfig?.maxDeliveryRadiusKm || 12;
      if (deliveryDistance > maxRadius) {
        isRadiusExceeded = true;
      }

      // Calculate Base Delivery Fee from Slabs or Restaurant Override
      if (restaurant.adminOverride?.isOverridden && restaurant.adminOverride.deliveryFee !== undefined) {
        deliveryFee = restaurant.adminOverride.deliveryFee;
        deliveryRuleApplied = 'Restaurant Specific Override';
      } else if (restaurant.baseDeliveryFee && restaurant.baseDeliveryFee > 0) {
        deliveryFee = calculateRestaurantDeliveryFee(deliveryDistance, restaurant);
        deliveryRuleApplied = 'Restaurant Base Pricing';
      } else {
        const slabResult = calculateSlabDeliveryFee(deliveryDistance, adminSetting.deliveryFeeConfig);
        deliveryFee = slabResult.fee;
        deliveryRuleApplied = slabResult.rule;
      }

      // Check Free Delivery Eligibility
      const isFreeEnabled = adminSetting.deliveryFeeConfig?.isFreeDeliveryEnabled !== false;
      const freeThreshold = adminSetting.deliveryFeeConfig?.freeDeliveryThreshold || 500;
      if ((isFreeEnabled && itemTotal >= freeThreshold) || (restaurant.isFreeDelivery && itemTotal >= (restaurant.freeDeliveryContribution || 0))) {
        deliveryFee = 0;
        freeDeliveryApplied = true;
        deliveryRuleApplied += ' [Free Delivery Threshold Met]';
      }

      // Calculate Surge / Extra Charges
      extraDeliveryCharges = calculateSurgeFee(adminSetting.surgeConfig);
      if (extraDeliveryCharges > 0) {
        surgeApplied = true;
      }
    }

    // 4. Platform Fee
    let platformFee = 0;
    if (adminSetting.platformFeeConfig?.enabled !== false) {
      if (adminSetting.platformFeeConfig?.type === 'percentage') {
        platformFee = (itemTotal * (adminSetting.platformFeeConfig.fee || 2)) / 100;
        platformFee = Math.max(adminSetting.platformFeeConfig.minFee || 0, Math.min(platformFee, adminSetting.platformFeeConfig.maxFee || 50));
      } else {
        platformFee = adminSetting.platformFeeConfig?.fee || 5;
      }
    }

    // 5. Coupon & Discounts
    const couponResult = await validateAndApplyCoupon({
      couponCode,
      itemTotal,
      restaurantId,
      userId,
      deliveryFee
    });

    let discount = couponResult.discount;
    if (couponResult.freeDelivery) {
      deliveryFee = 0;
      freeDeliveryApplied = true;
    }

    const subtotal = itemTotal + tax + packaging + deliveryFee + extraDeliveryCharges + platformFee;
    let totalAmount = subtotal - discount + tip;
    totalAmount = Math.max(0, totalAmount);

    // Wallet Deduction
    let walletDeduction = 0;
    let amountToPay = totalAmount;
    if (useWallet && walletBalance > 0) {
      walletDeduction = Math.min(walletBalance, totalAmount);
      amountToPay = totalAmount - walletDeduction;
    }

    // 6. Commission Precedence Calculation
    const commissionResult = await calculateCommissionPrecedence({
      restaurant,
      categoriesInCart: Array.from(categoriesInCart),
      adminSetting,
      itemTotal
    });

    return {
      success: true,
      isRadiusExceeded,
      breakdown: {
        itemTotal: round(itemTotal),
        tax: round(tax),
        taxRate: taxRate,
        packaging: round(packaging),
        deliveryFee: round(deliveryFee),
        extraDeliveryCharges: round(extraDeliveryCharges),
        platformFee: round(platformFee),
        discount: round(discount),
        tip: round(tip),
        subtotal: round(subtotal),
        totalAmount: round(totalAmount),
        walletDeduction: round(walletDeduction),
        amountToPay: round(amountToPay),
        // Commission Breakdown
        appliedCommissionRate: commissionResult.rate,
        adminCommissionAmount: round(commissionResult.amount),
        restaurantNetPayable: round(itemTotal - commissionResult.amount),
      },
      sources: {
        deliveryRule: deliveryRuleApplied,
        commissionRule: commissionResult.rule,
        freeDeliveryApplied,
        surgeApplied,
        restaurantOverrideUsed: restaurant.adminOverride?.isOverridden || false,
      },
      coupon: {
        code: couponCode || null,
        applied: discount > 0 || couponResult.freeDelivery,
        error: couponResult.error,
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

/**
 * Calculates delivery fee based on Admin distance slabs.
 */
function calculateSlabDeliveryFee(distance, deliveryFeeConfig) {
  if (!deliveryFeeConfig || !Array.isArray(deliveryFeeConfig.slabs) || deliveryFeeConfig.slabs.length === 0) {
    return { fee: deliveryFeeConfig?.baseFee || 30, rule: 'Default Base Fee' };
  }

  const activeSlabs = deliveryFeeConfig.slabs.filter(s => s.isActive !== false);
  activeSlabs.sort((a, b) => a.minDistanceKm - b.minDistanceKm);

  for (const slab of activeSlabs) {
    // Handle boundary carefully: [minDistanceKm, maxDistanceKm)
    if (distance >= slab.minDistanceKm && distance <= slab.maxDistanceKm) {
      let fee = slab.fee;
      if (slab.perKmFee && slab.perKmFee > 0 && distance > slab.minDistanceKm) {
        fee += (distance - slab.minDistanceKm) * slab.perKmFee;
      }
      return { fee, rule: `Slab ${slab.minDistanceKm}–${slab.maxDistanceKm} KM` };
    }
  }

  // If distance exceeds highest slab, use highest slab fee + perKmFee if present
  if (activeSlabs.length > 0) {
    const highest = activeSlabs[activeSlabs.length - 1];
    let fee = highest.fee;
    if (highest.perKmFee && distance > highest.maxDistanceKm) {
      fee += (distance - highest.maxDistanceKm) * highest.perKmFee;
    }
    return { fee, rule: `Extended Slab > ${highest.maxDistanceKm} KM` };
  }

  return { fee: deliveryFeeConfig.baseFee || 30, rule: 'Global Base Fee' };
}

/**
 * Calculates delivery fee for restaurant-specific distance rules.
 */
function calculateRestaurantDeliveryFee(distance, restaurant) {
  let baseFee = restaurant.baseDeliveryFee || 40;
  if (restaurant.perKmCharge && distance > 0) {
    const baseDistance = restaurant.baseDeliveryDistance || 3;
    if (distance > baseDistance) {
      baseFee += (distance - baseDistance) * restaurant.perKmCharge;
    }
  }
  return Math.min(baseFee, restaurant.maxDeliveryFee || 100);
}

/**
 * Calculates surge and extra charges from AdminSetting.
 */
function calculateSurgeFee(surgeConfig) {
  if (!surgeConfig) return 0;
  let totalExtra = 0;
  const now = new Date();
  const currentHour = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Peak Hour Charge
  if (surgeConfig.peakHour?.enabled) {
    if (currentHour >= surgeConfig.peakHour.startTime && currentHour <= surgeConfig.peakHour.endTime) {
      totalExtra += (surgeConfig.peakHour.fee || 0);
    }
  }

  // Night Charge
  if (surgeConfig.nightCharge?.enabled) {
    if (currentHour >= surgeConfig.nightCharge.startTime || currentHour <= surgeConfig.nightCharge.endTime) {
      totalExtra += (surgeConfig.nightCharge.fee || 0);
    }
  }

  // Rain Charge
  if (surgeConfig.rainCharge?.enabled) {
    totalExtra += (surgeConfig.rainCharge.fee || 0);
  }

  // High Demand Charge
  if (surgeConfig.highDemandCharge?.enabled) {
    totalExtra += (surgeConfig.highDemandCharge.fee || 0);
  }

  return totalExtra;
}

/**
 * Calculates Commission Precedence:
 * 1. Contract / Restaurant-specific Override
 * 2. Category-specific Commission (if configured)
 * 3. Global Default Commission (default 20%)
 */
async function calculateCommissionPrecedence({ restaurant, categoriesInCart, adminSetting, itemTotal }) {
  // 1. Restaurant Specific Commission Override
  if (restaurant.adminCommission !== undefined && restaurant.adminCommission > 0) {
    const rate = restaurant.adminCommission;
    return { rate, amount: (itemTotal * rate) / 100, rule: `Restaurant Override (${rate}%)` };
  }

  // 2. Category Specific Commission
  if (categoriesInCart.length > 0 && adminSetting.commissionConfig?.categoryCommissions?.length > 0) {
    const categoryCommissions = adminSetting.commissionConfig.categoryCommissions;
    for (const catId of categoriesInCart) {
      const match = categoryCommissions.find(c => c.category?.toString() === catId.toString());
      if (match && match.commissionPercent) {
        const rate = match.commissionPercent;
        return { rate, amount: (itemTotal * rate) / 100, rule: `Category Override (${match.categoryName || 'Category'} ${rate}%)` };
      }
    }
  }

  // 3. Global Default Commission
  const globalRate = adminSetting.commissionConfig?.globalCommissionPercent ?? 20;
  return { rate: globalRate, amount: (itemTotal * globalRate) / 100, rule: `Global Default (${globalRate}%)` };
}

async function validateAndApplyCoupon({ couponCode, itemTotal, restaurantId, userId, deliveryFee }) {
  if (!couponCode) {
    return { discount: 0, freeDelivery: false, error: null };
  }
  const promo = await Promocode.findOne({ code: couponCode, status: 'active' });
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
    return { discount: 0, freeDelivery: false, error: `Add items worth ₹${needed.toFixed(2)} more to apply this coupon` };
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
    discount = 0;
  }
  discount = Math.min(discount, itemTotal);
  return { discount, freeDelivery, error: null };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = {
  calculateOrderPrice,
  calculateSlabDeliveryFee,
  calculateSurgeFee,
  calculateCommissionPrecedence,
  validateAndApplyCoupon
};
