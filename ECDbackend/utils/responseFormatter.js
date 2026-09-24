
const normalizeRatingOutput = (rating) => {
  if (rating && typeof rating === "object") return rating;
  const average = typeof rating === "number" ? rating : 0;
  return {
    average,
    count: 0,
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
  let userCuisine = [];
  if (Array.isArray(restaurant.cuisine) && restaurant.cuisine.length > 0) {
    userCuisine = restaurant.cuisine;
  } else if (typeof restaurant.cuisine === "string" && restaurant.cuisine.trim()) {
    userCuisine = [restaurant.cuisine.trim()];
  } else if (restaurant.storeType) {
    userCuisine = [restaurant.storeType.charAt(0).toUpperCase() + restaurant.storeType.slice(1)];
  } else {
    userCuisine = [];
  }

  return {
    _id: restaurant._id,
    name: restaurant.name,
    description: restaurant.description,
    restaurantType: restaurant.restaurantType,
    image: restaurant.image,
    bannerImage: restaurant.bannerImage,
    restaurantImages: restaurant.restaurantImages || [],
    cuisine: userCuisine,
    rating: normalizeRatingOutput(restaurant.rating),
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
    offers: restaurant.offers || [],
    menu: restaurant.menu || []
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

  // Calculate rating average and count
  let avgRating = 0;
  let ratingCount = 0;
  if (typeof restaurant.rating === 'number') {
    avgRating = restaurant.rating;
  } else if (restaurant.rating && typeof restaurant.rating === 'object') {
    avgRating = restaurant.rating.average || restaurant.avgRating || 0;
    ratingCount = restaurant.rating.count || restaurant.totalReviews || 0;
  } else {
    avgRating = restaurant.avgRating || restaurant.adminRating || 0;
    ratingCount = restaurant.totalReviews || 0;
  }

  // Owner fallback
  let ownerData = restaurant.owner;
  if (!ownerData || typeof ownerData !== 'object' || (!ownerData.name && !ownerData.email)) {
    ownerData = {
      name: restaurant.ownerName || restaurant.name || "Restaurant Owner",
      email: restaurant.email || (restaurant.slug ? `${restaurant.slug}@ecdkart.com` : "contact@ecdkart.com"),
      mobile: restaurant.phone || restaurant.contactNumber || "—"
    };
  }

  // Cuisine fallback
  let cuisineList = [];
  if (Array.isArray(restaurant.cuisine) && restaurant.cuisine.length > 0) {
    cuisineList = restaurant.cuisine;
  } else if (typeof restaurant.cuisine === 'string' && restaurant.cuisine) {
    cuisineList = [restaurant.cuisine];
  } else if (restaurant.storeType) {
    cuisineList = [restaurant.storeType.charAt(0).toUpperCase() + restaurant.storeType.slice(1), "Multi-Cuisine"];
  } else {
    cuisineList = ["Multi-Cuisine", "Fast Food"];
  }

  // Documents fallback (using accountDetail image from cluster DB if docs empty)
  let docs = restaurant.documents;
  if (!docs || Object.keys(docs).length === 0) {
    docs = {};
    if (restaurant.accountDetail) {
      docs.bankVerification = {
        number: restaurant.upi || restaurant.restaurantKey || restaurant.restaurantId || "Verified",
        file: restaurant.accountDetail,
        url: restaurant.accountDetail
      };
    }
    if (restaurant.restaurantKey) {
      docs.restaurantKey = {
        number: restaurant.restaurantKey,
        file: null
      };
    }
    if (restaurant.restaurantId) {
      docs.registrationId = {
        number: restaurant.restaurantId,
        file: null
      };
    }
  }

  // Bank details fallback
  let bank = restaurant.bankDetails;
  if (!bank || !bank.accountNumber) {
    bank = {
      accountName: restaurant.name,
      accountNumber: restaurant.restaurantId || "—",
      swiftCode: restaurant.upi || "—",
      bankName: restaurant.upi ? (restaurant.upi.split('@')[1]?.toUpperCase() || "UPI Account") : "Registered Merchant Account"
    };
  }

  // Payment methods fallback
  let payments = restaurant.paymentMethods;
  if (!payments || (Array.isArray(payments) && payments.length === 0)) {
    payments = restaurant.upi ? `UPI (${restaurant.upi}), Cash on Delivery` : "Cash on Delivery, Online / UPI";
  }

  const phoneNum = restaurant.phone || restaurant.contactNumber || "—";

  return {
    _id: restaurant._id,
    name: restaurant.name,
    description: restaurant.description || "",
    restaurantType: restaurant.restaurantType || restaurant.storeType || "restaurant",
    image: restaurant.image || restaurant.logo || "https://ik.imagekit.io/ECDKART/placeholder_restaurant.png",
    bannerImage: restaurant.bannerImage || restaurant.image || restaurant.logo,
    restaurantImages: restaurant.restaurantImages || [],
    cuisine: cuisineList,
    brand: restaurant.brand || restaurant.name,
    owner: ownerData,
    rating: avgRating,
    ratingObject: {
      average: avgRating,
      count: ratingCount,
      breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 }
    },
    address: restaurant.address || "—",
    city: restaurant.city || "Sohna",
    area: restaurant.area || "Sohna Rural",
    email: restaurant.email || (restaurant.slug ? `${restaurant.slug}@ecdkart.com` : "contact@ecdkart.com"),
    phone: phoneNum,
    contactNumber: phoneNum,
    deliveryTime: restaurant.deliveryTime || 30,
    deliveryType: restaurant.deliveryType || ["Delivery", "Takeaway"],
    paymentMethods: payments,
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
    geofenceRadius: restaurant.geofenceRadius || 10,
    deliveringZones: restaurant.zoneIds || restaurant.deliveringZones || [],
    location: restaurant.location,
    estimatedPreparationTime: restaurant.estimatedPreparationTime || 15,
    timing: restaurant.timing || {
      monday: { open: "09:00", close: "22:00", isClosed: false },
      tuesday: { open: "09:00", close: "22:00", isClosed: false },
      wednesday: { open: "09:00", close: "22:00", isClosed: false },
      thursday: { open: "09:00", close: "22:00", isClosed: false },
      friday: { open: "09:00", close: "22:00", isClosed: false },
      saturday: { open: "09:00", close: "22:00", isClosed: false },
      sunday: { open: "09:00", close: "22:00", isClosed: false },
    },
    documents: docs,
    verificationStatus: restaurant.verificationStatus || (restaurant.accountDetail ? 'verified' : 'approved'),
    bankDetails: bank,
    taxConfig: restaurant.taxConfig,
    offers: restaurant.offers || [],
    totalOrders: restaurant.orderCount || restaurant.totalOrders || 0,
    totalEarnings: restaurant.walletBalance || restaurant.totalEarnings || 0,
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

  const pName = (product.name && typeof product.name === 'object') ? (product.name.en || product.name.de || Object.values(product.name)[0] || 'Item') : (product.name || 'Item');
  const pDesc = (product.description && typeof product.description === 'object') ? (product.description.en || product.description.de || Object.values(product.description)[0] || '') : (product.description || '');

  return {
    _id: product._id,
    id: product._id,
    restaurant: product.restaurant,
    category: product.category,
    name: pName,
    nameObject: product.name,
    description: pDesc,
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
