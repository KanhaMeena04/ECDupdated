
const normalizeRatingOutput = (rating) => {
  if (rating && typeof rating === "object") {
    const average = typeof rating.average === "number" ? rating.average : (Number(rating.average) || 0);
    const count = typeof rating.count === "number" ? rating.count : (Number(rating.count) || 0);
    return {
      average,
      count,
      breakdown: rating.breakdown || { five: 0, four: 0, three: 0, two: 0, one: 0 },
      lastRatedAt: rating.lastRatedAt || null,
    };
  }
  const average = typeof rating === "number" ? rating : (Number(rating) || 0);
  return {
    average,
    count: average > 0 ? 1 : 0,
    breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
    lastRatedAt: null,
  };
};
const getRatingCount = (rating) => {
  if (rating && typeof rating === "object" && typeof rating.count === "number") {
    return rating.count;
  }
  return 0;
};
exports.formatRestaurantForUser = (restaurant) => {
  if (!restaurant) return null;
  const isOverridden = restaurant.adminOverride && restaurant.adminOverride.isOverridden;
  return {
    _id: restaurant._id,
    name: restaurant.name,
    description: restaurant.description,
    restaurantType: restaurant.restaurantType,
    image: restaurant.image,
    bannerImage: restaurant.bannerImage,
    restaurantImages: restaurant.restaurantImages || [],
    cuisine: restaurant.cuisine || ["North Indian", "Fast Food"],
    rating: normalizeRatingOutput(restaurant.rating ?? restaurant.avgRating ?? restaurant.adminRating ?? 0),
    ratingCount: getRatingCount(restaurant.rating),
    address: restaurant.address,
    city: restaurant.city,
    area: restaurant.area,
    phone: restaurant.phone || restaurant.contactNumber,
    contactNumber: restaurant.contactNumber,
    deliveryTime: isOverridden && restaurant.adminOverride.deliveryTime !== undefined ? restaurant.adminOverride.deliveryTime : restaurant.deliveryTime,
    deliveryType: restaurant.deliveryType || [],
    isFreeDelivery: restaurant.isFreeDelivery,
    minOrderValue: restaurant.minOrderValue || 0,
    estimatedPreparationTime: restaurant.estimatedPreparationTime || 15,
    isActive: isOverridden && restaurant.adminOverride.isActive !== undefined ? restaurant.adminOverride.isActive : restaurant.isActive,
    isOnline: isOverridden && restaurant.adminOverride.isOnline !== undefined ? restaurant.adminOverride.isOnline : (restaurant.isOnline !== undefined ? restaurant.isOnline : true),
    isFeatured: isOverridden && restaurant.adminOverride.isFeatured !== undefined ? restaurant.adminOverride.isFeatured : (restaurant.isFeatured || false),
    isTemporarilyClosed: restaurant.isTemporarilyClosed || false,
    restaurantApproved: restaurant.restaurantApproved !== false,
    menuApproved: restaurant.menuApproved !== false,
    verificationStatus: restaurant.verificationStatus || 'verified',
    timing: restaurant.timing,
    offers: restaurant.offers || []
  };
};
exports.formatRestaurantForList = (restaurant) => {
  if (!restaurant) return null;
  const formatted = exports.formatRestaurantForUser(restaurant);
  return formatted;
};
exports.formatRestaurantForAdmin = (restaurant) => {
  if (!restaurant) return null;
  const isOverridden = restaurant.adminOverride && restaurant.adminOverride.isOverridden;
  const rawName = restaurant.name || restaurant.restaurantName || restaurant.title || '';
  let realName = '';
  if (typeof rawName === 'object' && rawName !== null) {
    realName = rawName.en || Object.values(rawName).find(v => typeof v === 'string' && v.trim()) || '';
  } else if (typeof rawName === 'string') {
    realName = rawName.trim();
  }
  if (!realName) realName = 'Restaurant';

  const realImage = restaurant.logo || restaurant.image || restaurant.bannerImage || '';
  const realPhone = restaurant.phone || restaurant.contactNumber || (restaurant.owner && typeof restaurant.owner === 'object' ? restaurant.owner.mobile : '');
  const realCuisine = (restaurant.categories && restaurant.categories.length > 0) ? restaurant.categories : (restaurant.cuisine || []);
  const realPin = restaurant.restaurantKey || restaurant.pin || (restaurant.owner && typeof restaurant.owner === 'object' ? restaurant.owner.pin : '1234') || '1234';
  const ownerName = (restaurant.owner && typeof restaurant.owner === 'object' && restaurant.owner.name) ? restaurant.owner.name : (restaurant.ownerName || `${realName} Owner`);
  const ownerEmail = (restaurant.owner && typeof restaurant.owner === 'object' && restaurant.owner.email) ? restaurant.owner.email : (restaurant.email || (realPhone ? `${realPhone.replace(/[^0-9]/g, '')}@ecdkart.com` : ''));

  return {
    _id: restaurant._id,
    id: restaurant._id,
    name: realName,
    description: restaurant.description || '',
    restaurantType: restaurant.storeType || restaurant.restaurantType || 'restaurant',
    image: realImage,
    logo: realImage,
    bannerImage: restaurant.bannerImage || realImage,
    restaurantImages: restaurant.restaurantImages || [],
    cuisine: realCuisine,
    categories: restaurant.categories || realCuisine,
    brand: restaurant.brand || realName,
    owner: restaurant.owner,
    ownerName: ownerName,
    ownerEmail: ownerEmail,
    ownerMobile: (restaurant.owner && typeof restaurant.owner === 'object' ? restaurant.owner.mobile : '') || realPhone,
    ownerPin: realPin,
    pin: realPin,
    restaurantKey: restaurant.restaurantKey || realPin,
    rating: normalizeRatingOutput(restaurant.rating ?? restaurant.avgRating ?? restaurant.adminRating ?? 0),
    address: restaurant.address || 'Selected from map',
    city: restaurant.city || 'Sohna',
    area: restaurant.area || '',
    email: restaurant.email || (restaurant.owner ? restaurant.owner.email : '') || '',
    phone: realPhone,
    contactNumber: realPhone,
    contact: realPhone,
    deliveryTime: restaurant.deliveryTime || 30,
    deliveryType: restaurant.deliveryType || ['Home Delivery', 'Pickup'],
    paymentMethods: restaurant.paymentMethods || 'Both',
    isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
    isOnline: restaurant.isOnline !== undefined ? restaurant.isOnline : true,
    isFeatured: restaurant.featured || restaurant.isFeatured || false,
    adminOverride: restaurant.adminOverride || { isOverridden: false },
    restaurantApproved: restaurant.restaurantApproved !== undefined ? restaurant.restaurantApproved : true,
    menuApproved: restaurant.menuApproved !== undefined ? restaurant.menuApproved : true,
    isTemporarilyClosed: restaurant.isTemporarilyClosed || false,
    packagingCharge: restaurant.packagingCharge || 0,
    adminCommission: restaurant.adminCommission || 10,
    isFreeDelivery: restaurant.isFreeDelivery || false,
    freeDeliveryContribution: restaurant.freeDeliveryContribution || 0,
    minOrderValue: restaurant.minOrderValue || 0,
    geofenceRadius: restaurant.geofenceRadius || 5,
    deliveringZones: restaurant.zoneIds || restaurant.deliveringZones || [],
    location: restaurant.location,
    estimatedPreparationTime: restaurant.estimatedPreparationTime || 15,
    timing: restaurant.timing || {},
    documents: restaurant.documents || (restaurant.accountDetail ? { accountDetail: { number: restaurant.upi || 'Verified', file: restaurant.accountDetail } } : {}),
    verificationStatus: restaurant.verificationStatus || 'verified',
    bankDetails: restaurant.bankDetails || (restaurant.upi ? { upi: restaurant.upi, accountNumber: restaurant.upi } : {}),
    taxConfig: restaurant.taxConfig || {},
    offers: restaurant.offers || [],
    totalOrders: restaurant.orderCount || restaurant.totalOrders || 0,
    orderCount: restaurant.orderCount || restaurant.totalOrders || 0,
    totalEarnings: restaurant.codEarnings || restaurant.totalEarnings || 0,
    walletBalance: restaurant.walletBalance || 0,
    codBalance: restaurant.codBalance || 0,
    codEarnings: restaurant.codEarnings || 0,
    upi: restaurant.upi || '',
    accountDetail: restaurant.accountDetail || '',
    menu: restaurant.menu || [],
    totalDeliveries: restaurant.totalDeliveries || 0,
    successfulOrders: restaurant.successfulOrders || restaurant.orderCount || 0,
    averageOrderValue: restaurant.averageOrderValue || 0,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  };
};
exports.formatProductForUser = (product) => {
  if (!product) return null;
  const isOverridden = product.adminPriceOverride && (product.adminPriceOverride.isOverridden || product.adminPriceOverride.enabled);
  const effectiveBasePrice = isOverridden && product.adminPriceOverride.basePrice !== undefined ? product.adminPriceOverride.basePrice : product.basePrice;
  const effectiveMrp = isOverridden && product.adminPriceOverride.mrp !== undefined ? product.adminPriceOverride.mrp : (product.mrp || effectiveBasePrice);
  const effectiveDiscountPercent = isOverridden && product.adminPriceOverride.discountPercent !== undefined ? product.adminPriceOverride.discountPercent : (product.discountPercent || 0);
  const effectiveDiscountAmount = isOverridden && product.adminPriceOverride.discountAmount !== undefined ? product.adminPriceOverride.discountAmount : (product.discountAmount || 0);
  const effectiveOfferPrice = isOverridden && product.adminPriceOverride.offerPrice !== undefined ? product.adminPriceOverride.offerPrice : product.offerPrice;

  return {
    _id: product._id,
    restaurant: product.restaurant,
    category: product.category,
    name: product.name,
    description: product.description,
    image: product.image,
    price: effectiveBasePrice,
    basePrice: effectiveBasePrice,
    originalBasePrice: product.basePrice,
    mrp: effectiveMrp,
    discountPercent: effectiveDiscountPercent,
    discountAmount: effectiveDiscountAmount,
    offerPrice: effectiveOfferPrice,
    sellingPrice: effectiveBasePrice,
    isVeg: product.isVeg,
    available: product.available && !product.outOfStock,
    outOfStock: product.outOfStock || false,
    preparationTime: product.preparationTime || 15,
    subcategory: product.subcategory || '',
    isFeatured: product.isFeatured || false,
    variations: product.variations || [],
    addOns: product.addOns || [],
    seasonal: product.seasonal || false,
    seasonTag: product.seasonTag,
    adminPriceOverride: product.adminPriceOverride || { isOverridden: false },
  };
};
exports.formatOrderForCustomer = (order) => {
  if (!order) return null;
  return {
    _id: order._id,
    status: order.status,
    restaurant: order.restaurant,
    items: order.items,
    totalAmount: order.totalAmount,
    itemTotal: order.itemTotal,
    tax: order.tax,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    tip: order.tip,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    deliveryAddress: order.deliveryAddress,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    createdAt: order.createdAt,
    timeline: order.timeline,
    rider: order.rider,
    isRated: order.isRated,
  };
};
exports.formatWalletTransaction = (transaction) => {
  if (!transaction) return null;
  return {
    _id: transaction._id,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    orderId: transaction.orderId,
    createdAt: transaction.createdAt,
  };
};
exports.formatRiderForAdmin = (rider) => {
  if (!rider) return null;
  return {
    _id: rider._id,
    user: rider.user,
    rating: rider.rating,
    address: rider.address,
    workCity: rider.workCity,
    workZone: rider.workZone,
    vehicle: rider.vehicle,
    documents: rider.documents,
    bankDetails: rider.bankDetails,
    isOnline: rider.isOnline,
    isAvailable: rider.isAvailable,
    breakMode: rider.breakMode,
    verificationStatus: rider.verificationStatus,
    riderVerified: rider.riderVerified,
    totalEarnings: rider.totalEarnings,
    currentBalance: rider.currentBalance,
    totalOrders: rider.totalOrders,
    totalDeliveries: rider.totalDeliveries,
    createdAt: rider.createdAt,
    updatedAt: rider.updatedAt,
  };
};
exports.formatCityForUser = (city) => {
  if (!city) return null;
  return {
    _id: city._id,
    name: city.name,
    isActive: city.isActive,
    zones: (city.zones || []).map(zone => ({
      _id: zone._id,
      name: zone.name,
      isActive: zone.isActive,
      polygon: zone.polygon,
    })),
  };
};
const sendError = (res, status, message, details = null) => {
  return res.status(status).json({
    success: false,
    message: message || "An error occurred",
    ...(details ? { details } : {})
  });
};

const sendSuccess = (res, status = 200, message = "Success", data = null) => {
  return res.status(status).json({
    success: true,
    message,
    ...(data ? (typeof data === 'object' && !Array.isArray(data) ? { ...data, data } : { data }) : {})
  });
};

module.exports = {
  sendError,
  sendSuccess,
  formatRestaurantForUser: exports.formatRestaurantForUser,
  formatRestaurantForList: exports.formatRestaurantForList,
  formatRestaurantForAdmin: exports.formatRestaurantForAdmin,
  formatProductForUser: exports.formatProductForUser,
  formatOrderForCustomer: exports.formatOrderForCustomer,
  formatWalletTransaction: exports.formatWalletTransaction,
  formatRiderForAdmin: exports.formatRiderForAdmin,
  formatCityForUser: exports.formatCityForUser,
};
