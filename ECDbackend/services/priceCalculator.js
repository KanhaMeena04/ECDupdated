const Promocode = require('../models/Promocode');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Order = require('../models/Order');
const AdminSetting = require('../models/AdminSetting');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { evaluateRules } = require('./ruleEngineEvaluator');

/**
 * Calculates complete order pricing, delivery fees, surge charges, platform fees, packaging fees,
 * discounts, and commission precedence based on central AdminSetting & restaurant overrides.
 */
async function calculateOrderPrice({
  items,
  restaurantId,
  restaurant: inputRestaurant = null,
  adminSetting: inputAdminSetting = null,
  userId = null,
  couponCode = null,
  deliveryDistance = 0,
  tip = 0,
  useWallet = false,
  walletBalance = 0,
  orderType = 'delivery'
}) {
  try {
    const restaurant = (inputRestaurant && typeof inputRestaurant === 'object') ? inputRestaurant : await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    const adminSetting = inputAdminSetting || await AdminSetting.getSettings();

    // 1. Calculate Item Total & B2B Total
    let itemTotal = 0;
    let b2bTotal = 0;
    let categoriesInCart = new Set();

    for (const item of items) {
      let itemPrice = Number(item.price || item.basePrice || item.sellingPrice || 0);
      if (!itemPrice || itemPrice <= 0) {
        const prodId = item.product || item.productId || item._id;
        if (prodId && (typeof prodId === 'object' || mongoose.Types.ObjectId.isValid(prodId))) {
          const targetId = typeof prodId === 'object' ? prodId._id : prodId;
          if (targetId) {
            const dbProd = await Product.findById(targetId);
            if (dbProd) {
              itemPrice = Number(dbProd.sellingPrice || dbProd.price || dbProd.basePrice || dbProd.regularPrice || 0);
            }
          }
        }
      }
      if (item.variation && item.variation.price) {
        itemPrice += Number(item.variation.price) || 0;
      }
      if (item.addOns && Array.isArray(item.addOns)) {
        const addOnsTotal = item.addOns.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
        itemPrice += addOnsTotal;
      }
      const qty = item.quantity || 1;
      itemTotal += itemPrice * qty;

      // Resolve B2B unit price for item
      let unitB2b = item.b2bPrice;
      if (unitB2b === undefined || unitB2b === null || isNaN(unitB2b) || unitB2b < 0) {
        if (item.product && typeof item.product === 'object') {
          unitB2b = item.product.b2bPrice ?? item.product.pricing?.b2b?.sellingPrice;
        }
      }
      // If still not resolved, query Product model from DB
      if (unitB2b === undefined || unitB2b === null || isNaN(unitB2b) || unitB2b <= 0) {
        const prodId = (item.product && typeof item.product === 'object') ? (item.product._id || item.product.id) : (item.product || item.productId || item._id);
        if (prodId && (typeof prodId === 'object' || mongoose.Types.ObjectId.isValid(prodId))) {
          const targetId = typeof prodId === 'object' ? prodId._id : prodId;
          const dbProd = await Product.findById(targetId).lean();
          if (dbProd) {
            unitB2b = dbProd.b2bPrice ?? dbProd.pricing?.b2b?.sellingPrice;
            if (item.variation && dbProd.variations && Array.isArray(dbProd.variations)) {
              const matchedVar = dbProd.variations.find(v => v.name === item.variation.name || v._id?.toString() === item.variation._id?.toString());
              if (matchedVar && matchedVar.b2bPrice !== undefined && matchedVar.b2bPrice !== null) {
                unitB2b = matchedVar.b2bPrice;
              }
            }
          }
        }
      }
      // If product has no explicit b2bPrice set, fallback to restaurant rate
      if (unitB2b === undefined || unitB2b === null || isNaN(unitB2b) || unitB2b <= 0) {
        const fallbackRate = Number(restaurant.adminCommission || 20);
        unitB2b = Math.max(0, itemPrice * (1 - fallbackRate / 100));
      }
      b2bTotal += Number(unitB2b) * qty;

      if (item.category) {
        categoriesInCart.add(item.category.toString());
      }
    }

    // 2. Tax & Packaging Calculation
    let tax = 0;
    let taxRate = 0;
    const isTaxEnabled = adminSetting.taxConfig?.enabled !== false;
    if (isTaxEnabled) {
      const adminGst = (adminSetting.taxConfig?.gstPercent !== undefined && adminSetting.taxConfig?.gstPercent !== null)
        ? Number(adminSetting.taxConfig.gstPercent)
        : 5;
      const restGst = Number(restaurant.taxConfig?.gstPercent);
      const effectiveGst = (!isNaN(restGst) && restGst > 0)
        ? restGst
        : adminGst;
      taxRate = effectiveGst / 100;
      tax = itemTotal * taxRate;
    }
    
    let packaging = 0;
    if (adminSetting.packagingFeeConfig?.enabled !== false) {
      const restPackaging = Number(restaurant.packagingCharge);
      packaging = (!isNaN(restPackaging) && restPackaging > 0)
        ? restPackaging
        : Number(adminSetting.packagingFeeConfig?.globalPackagingFee ?? 0);
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

      // Check First User / First Order Free Delivery Eligibility
      let isFirstOrder = false;
      const isFirstOrderFreeEnabled = adminSetting.deliveryFeeConfig?.firstOrderFreeDelivery !== false;
      if (isFirstOrderFreeEnabled && userId && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const existingOrdersCount = await Order.countDocuments({
            user: userId,
            status: { $nin: ['cancelled', 'failed'] }
          });
          if (existingOrdersCount === 0) {
            isFirstOrder = true;
            deliveryFee = 0;
            extraDeliveryCharges = 0;
            freeDeliveryApplied = true;
            deliveryRuleApplied = 'First Order Free Delivery (New User)';
          }
        } catch (_) {}
      }

      // Calculate Surge / Extra Charges (skip if first order free delivery)
      if (!isFirstOrder) {
        extraDeliveryCharges = calculateSurgeFee(adminSetting.surgeConfig);
        if (extraDeliveryCharges > 0) {
          surgeApplied = true;
        }
      }
    }

    // 4. Platform Fee
    let platformFee = 0;
    if (adminSetting.platformFeeConfig?.enabled !== false) {
      if (adminSetting.platformFeeConfig?.type === 'percentage') {
        const feePct = (adminSetting.platformFeeConfig?.fee !== undefined && adminSetting.platformFeeConfig?.fee !== null)
          ? Number(adminSetting.platformFeeConfig.fee)
          : 2;
        platformFee = (itemTotal * feePct) / 100;
        const minFee = Number(adminSetting.platformFeeConfig?.minFee ?? 0);
        const maxFee = Number(adminSetting.platformFeeConfig?.maxFee ?? 50);
        platformFee = Math.max(minFee, Math.min(platformFee, maxFee));
      } else {
        platformFee = (adminSetting.platformFeeConfig?.fee !== undefined && adminSetting.platformFeeConfig?.fee !== null)
          ? Number(adminSetting.platformFeeConfig.fee)
          : 5;
      }
    }

    // Evaluate dynamic Admin Rule Engine policies
    let userOrdCount = 0;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        userOrdCount = await Order.countDocuments({ user: userId, status: { $nin: ['cancelled', 'failed'] } });
      } catch (_) {}
    }
    const ruleEval = await evaluateRules({
      orderValue: itemTotal,
      rainStatus: Boolean(adminSetting.surgeConfig?.rainCharge?.enabled),
      riderDistance: deliveryDistance,
      userOrderCount: userOrdCount
    });

    if (orderType !== 'self_pickup') {
      if (ruleEval.overrideDeliveryFee !== null) {
        deliveryFee = ruleEval.overrideDeliveryFee;
        if (deliveryFee === 0) freeDeliveryApplied = true;
        deliveryRuleApplied = `RuleEngine Override (₹${deliveryFee})`;
      }
      if (ruleEval.additionalDeliveryFee > 0) {
        extraDeliveryCharges += ruleEval.additionalDeliveryFee;
        surgeApplied = true;
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
    if (ruleEval.discountPercent > 0) {
      discount += (itemTotal * ruleEval.discountPercent) / 100;
    }
    if (ruleEval.discountFixed > 0) {
      discount += ruleEval.discountFixed;
    }
    discount = Math.min(discount, itemTotal + deliveryFee);
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

    // 6. Dual Model: B2B Rate Model (Default) vs Commission % Model
    const isCommissionModel = Boolean(restaurant.pricingModel === 'commission' || restaurant.useCommissionModel === true);

    let appliedCommissionRate = 0;
    let adminCommissionAmount = 0;
    let restaurantNetPayable = 0;
    let commissionRule = '';

    if (isCommissionModel) {
      // Option: Commission % Module enabled for this restaurant
      const commissionResult = await calculateCommissionPrecedence({
        restaurant,
        categoriesInCart: Array.from(categoriesInCart),
        adminSetting,
        itemTotal
      });
      appliedCommissionRate = commissionResult.rate;
      adminCommissionAmount = round(commissionResult.amount);
      // PACKAGING FEE BELONGS 100% TO ADMIN - ZERO PACKAGING FOR RESTAURANT
      restaurantNetPayable = round(Math.max(0, itemTotal - adminCommissionAmount));
      commissionRule = commissionResult.rule;
    } else {
      // Default: B2B Rate Model
      // Restaurant gets exact B2B Total
      // Admin gets Selling Price - B2B Price
      restaurantNetPayable = round(b2bTotal);
      adminCommissionAmount = round(Math.max(0, itemTotal - b2bTotal));
      appliedCommissionRate = itemTotal > 0 ? Math.round((adminCommissionAmount / itemTotal) * 100) : 0;
      commissionRule = `B2B Rate Model (Selling ₹${round(itemTotal)} - B2B ₹${round(b2bTotal)} = Admin Margin ₹${adminCommissionAmount})`;
    }

    return {
      success: true,
      isRadiusExceeded,
      breakdown: {
        itemTotal: round(itemTotal),
        b2bTotal: round(b2bTotal),
        pricingModel: isCommissionModel ? 'commission' : 'b2b',
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
        // Commission & Settlement Breakdown (Packaging fee 100% to Admin)
        appliedCommissionRate,
        adminCommissionAmount,
        restaurantNetPayable,
      },
      sources: {
        deliveryRule: deliveryRuleApplied,
        commissionRule: commissionRule || commissionResult?.rule || 'Standard',
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
    return { fee: deliveryFeeConfig?.baseFee !== undefined ? deliveryFeeConfig.baseFee : 10, rule: 'Default Base Fee' };
  }

  const baseDistance = deliveryFeeConfig.baseDistanceKm || 3;
  if (distance <= baseDistance && deliveryFeeConfig.baseFee !== undefined) {
    return { fee: deliveryFeeConfig.baseFee, rule: `Base Delivery Fee (up to ${baseDistance} KM)` };
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

  return { fee: deliveryFeeConfig?.baseFee !== undefined ? Number(deliveryFeeConfig.baseFee) : 30, rule: 'Global Base Fee' };
}

/**
 * Calculates delivery fee for restaurant-specific distance rules.
 */
function calculateRestaurantDeliveryFee(distance, restaurant) {
  let baseFee = restaurant.baseDeliveryFee !== undefined ? Number(restaurant.baseDeliveryFee) : 40;
  if (restaurant.perKmCharge && distance > 0) {
    const baseDistance = restaurant.baseDeliveryDistance !== undefined ? Number(restaurant.baseDeliveryDistance) : 3;
    if (distance > baseDistance) {
      baseFee += (distance - baseDistance) * Number(restaurant.perKmCharge);
    }
  }
  const maxFee = restaurant.maxDeliveryFee !== undefined ? Number(restaurant.maxDeliveryFee) : 100;
  return Math.min(baseFee, maxFee);
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
    const startTime = surgeConfig.peakHour.startTime || "12:00";
    const endTime = surgeConfig.peakHour.endTime || "15:00";
    if (currentHour >= startTime && currentHour <= endTime) {
      totalExtra += Number(surgeConfig.peakHour.fee ?? 0);
    }
  }

  // Night Charge
  if (surgeConfig.nightCharge?.enabled) {
    const startTime = surgeConfig.nightCharge.startTime || "23:00";
    const endTime = surgeConfig.nightCharge.endTime || "06:00";
    if (startTime > endTime) {
      if (currentHour >= startTime || currentHour <= endTime) {
        totalExtra += Number(surgeConfig.nightCharge.fee ?? 0);
      }
    } else {
      if (currentHour >= startTime && currentHour <= endTime) {
        totalExtra += Number(surgeConfig.nightCharge.fee ?? 0);
      }
    }
  }

  // Rain Charge
  if (surgeConfig.rainCharge?.enabled) {
    totalExtra += Number(surgeConfig.rainCharge.fee ?? 0);
  }

  // High Demand Charge
  if (surgeConfig.highDemandCharge?.enabled) {
    totalExtra += Number(surgeConfig.highDemandCharge.fee ?? 0);
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
  const globalRate = (adminSetting?.commissionConfig?.globalCommissionPercent !== undefined && adminSetting?.commissionConfig?.globalCommissionPercent !== null)
    ? Number(adminSetting.commissionConfig.globalCommissionPercent)
    : 20;

  // 1. Restaurant Specific Commission Override (Only if explicitly overridden by Admin)
  const isExplicitOverride = Boolean(
    restaurant?.adminOverride?.isOverridden === true ||
    (restaurant?.adminCommission !== undefined && restaurant?.adminCommission !== null && !isNaN(restaurant?.adminCommission) && restaurant.adminCommission !== 10 && restaurant.adminCommission !== globalRate)
  );
  if (isExplicitOverride && restaurant?.adminCommission !== undefined && restaurant?.adminCommission !== null && !isNaN(restaurant?.adminCommission)) {
    const rate = Number(restaurant.adminCommission);
    return { rate, amount: (itemTotal * rate) / 100, rule: `Restaurant Override (${rate}%)` };
  }

  // 2. Category Specific Commission
  if (categoriesInCart.length > 0 && adminSetting.commissionConfig?.categoryCommissions?.length > 0) {
    const categoryCommissions = adminSetting.commissionConfig.categoryCommissions;
    for (const catId of categoriesInCart) {
      const match = categoryCommissions.find(c => c.category?.toString() === catId.toString());
      if (match && match.commissionPercent !== undefined && match.commissionPercent !== null && !isNaN(match.commissionPercent)) {
        const rate = Number(match.commissionPercent);
        return { rate, amount: (itemTotal * rate) / 100, rule: `Category Override (${match.categoryName || 'Category'} ${rate}%)` };
      }
    }
  }

  // 3. Global Default Commission
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
