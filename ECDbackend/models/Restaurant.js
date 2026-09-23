const mongoose = require("mongoose");
const translationSchema = {
  en: { type: String, required: true },
  de: { type: String },
  ar: { type: String },
};
const dailyTimingSchema = {
  open: { type: String }, // e.g., "09:00"
  close: { type: String }, // e.g., "22:00"
  isClosed: { type: Boolean, default: false } // For holidays/closed days
};
const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product : [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }], // Products offered by the restaurant - synced when items are added
    name: { type: mongoose.Schema.Types.Mixed }, // String or translation object { en, de, ar }
    description: { type: mongoose.Schema.Types.Mixed },
    restaurantType: { type: String },
    image: { type: String },
    bannerImage: { type: String },
    restaurantImages: [{ type: String }],
    cuisine: [{ type: String }], // Form: Cuisines
    brand: { type: String },
    email: { type: String }, // Form: Email (Public contact email)
    contactNumber: { type: String }, // Form: Contact Number
    address: { type: String }, // Form: Address
    city: { type: String }, // Form: Select City
    area: { type: String }, // Form: Select Area
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [long, lat]
    },
    deliveryTime: { type: Number, default: 30 }, // Form: Estimated Delivery Time (Mins)
    geofenceRadius: { type: Number, default: 5 }, // Form: Geofence Radius (km)
    deliveringZones: [{ type: String }], // Form: Delivering Zones
    deliveryType: [{ 
      type: String, 
      enum: ['Home Delivery', 'Pickup', 'Dining'] 
    }], 
    paymentMethods: {
      type: String,
      enum: ['COD', 'Online', 'Both'],
      default: 'Both'
    },
    packagingCharge: { type: Number, default: 0 }, 
    adminCommission: { type: Number, default: 10 },  // ✅ FIXED: 10% default commission instead of 0
    isFreeDelivery: { type: Boolean, default: false }, 
    freeDeliveryContribution: { type: Number, default: 0 }, 
    totalFreeDeliverySpend: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, // Form: Status (Active/Inactive)
    restaurantApproved: { type: Boolean, default: false },
    menuApproved: { type: Boolean, default: false }, // Admin approval for menu
    menuApprovedAt: { type: Date },
    menuApprovalNotes: { type: String },
    rating: { 
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      breakdown: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 }
      },
      lastRatedAt: { type: Date }
    },
    totalOrders: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    successfulOrders: { type: Number, default: 0 },
    bankDetails: {
      accountName: { type: String },
      bankName: { type: String },
      accountAddress: { type: String },
      branchName: { type: String },
      accountNumber: { type: String },
      branchAddress: { type: String },
      swiftCode: { type: String },
      routingNumber: { type: String }
    },
    documents: {
      license: { url: String, backUrl: String, number: String, expiry: Date },
      pan: { url: String, number: String },
      gst: { url: String, number: String }
    },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verificationNotes: { type: String },
    rejectionReason: { type: String },
    rejectionDate: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pendingUpdate: {
      email: { type: String },
      contactNumber: { type: String },
      otp: { type: String },
      otpExpires: { type: Date },
      otpAttempts: { type: Number, default: 0 }
    },
    minOrderValue: { type: Number, default: 0 },
    priceRange: {
      min: { type: Number, default: 0 }, // Minimum product price
      max: { type: Number, default: 0 }, // Maximum product price
      average: { type: Number, default: 0 }, // Average product price
      lastCalculated: { type: Date } // When it was last calculated
    },
    taxConfig: {
      gstNumber: { type: String },
      gstPercent: { type: Number, default: 0 }
    },
    estimatedPreparationTime: { type: Number, default: 15 }, // in minutes
    autoAcceptOrders: { type: Boolean, default: false },
    prepBufferTimeMinutes: { type: Number, default: 0 },
    isSelfPickupEnabled: { type: Boolean, default: true },
    cancellationWindowMinutes: { type: Number, default: 5 },
    gracePeriodMinutes: { type: Number, default: 15 },
    isTemporarilyClosed: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: true },
    offers: [{
      title: { type: String, required: true },
      code: { type: String },
      discountPercent: { type: Number, default: 0 },
      maxDiscount: { type: Number, default: 0 },
      minOrder: { type: Number, default: 0 },
      description: { type: String },
      isActive: { type: Boolean, default: true }
    }],
    adminOverride: {
      isOverridden: { type: Boolean, default: false },
      isFeatured: { type: Boolean },
      isOnline: { type: Boolean },
      isActive: { type: Boolean },
      deliveryTime: { type: Number },
      reason: { type: String },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date }
    },
    phone: { type: String },
    logo: { type: String },
    accountDetail: { type: String },
    upi: { type: String },
    restaurantId: { type: String },
    restaurantKey: { type: String },
    avgRating: { type: Number, default: 0 },
    adminRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    menu: { type: Array, default: [] },
    storeType: { type: String },
    slug: { type: String },
    zoneIds: [{ type: String }],
    timing: {
      monday: dailyTimingSchema,
      tuesday: dailyTimingSchema,
      wednesday: dailyTimingSchema,
      thursday: dailyTimingSchema,
      friday: dailyTimingSchema,
      saturday: dailyTimingSchema,
      sunday: dailyTimingSchema,
      isHoliday: { type: Boolean, default: false } // Global Holiday Switch
    }
  },
  { timestamps: true, strict: false }
);
module.exports = mongoose.model("Restaurant", restaurantSchema);

