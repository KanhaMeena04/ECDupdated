const mongoose = require('mongoose');

const deliverySlabSchema = new mongoose.Schema({
  minDistanceKm: { type: Number, required: true, min: 0 },
  maxDistanceKm: { type: Number, required: true, min: 0 },
  fee: { type: Number, required: true, min: 0 },
  perKmFee: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
});

const AdminSettingSchema = new mongoose.Schema(
  {
    appName: { type: String, trim: true, default: 'ECDkart Food Delivery' },
    logoUrl: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    termsUrl: { type: String, trim: true, default: '' },
    privacyUrl: { type: String, trim: true, default: '' },

    // Delivery Fee Configuration
    deliveryFeeConfig: {
      enabled: { type: Boolean, default: true },
      baseFee: { type: Number, default: 30 },
      baseDistanceKm: { type: Number, default: 3 },
      maxDeliveryRadiusKm: { type: Number, default: 12 },
      isFreeDeliveryEnabled: { type: Boolean, default: true },
      freeDeliveryThreshold: { type: Number, default: 500 },
      slabs: {
        type: [deliverySlabSchema],
        default: [
          { minDistanceKm: 0, maxDistanceKm: 3, fee: 30, perKmFee: 0, isActive: true },
          { minDistanceKm: 3, maxDistanceKm: 5, fee: 40, perKmFee: 0, isActive: true },
          { minDistanceKm: 5, maxDistanceKm: 8, fee: 60, perKmFee: 0, isActive: true },
          { minDistanceKm: 8, maxDistanceKm: 12, fee: 80, perKmFee: 0, isActive: true }
        ]
      }
    },

    // Surge Charges Configuration
    surgeConfig: {
      peakHour: {
        enabled: { type: Boolean, default: false },
        fee: { type: Number, default: 15 },
        startTime: { type: String, default: '12:00' },
        endTime: { type: String, default: '15:00' }
      },
      nightCharge: {
        enabled: { type: Boolean, default: false },
        fee: { type: Number, default: 25 },
        startTime: { type: String, default: '23:00' },
        endTime: { type: String, default: '06:00' }
      },
      rainCharge: {
        enabled: { type: Boolean, default: false },
        fee: { type: Number, default: 20 }
      },
      highDemandCharge: {
        enabled: { type: Boolean, default: false },
        fee: { type: Number, default: 15 }
      }
    },

    // Commission Configuration
    commissionConfig: {
      globalCommissionPercent: { type: Number, default: 20 },
      categoryCommissions: [{
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        categoryName: { type: String },
        commissionPercent: { type: Number, required: true }
      }]
    },

    // Platform Fee Configuration
    platformFeeConfig: {
      enabled: { type: Boolean, default: true },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
      fee: { type: Number, default: 5 },
      minFee: { type: Number, default: 5 },
      maxFee: { type: Number, default: 20 }
    },

    // Packaging Fee Configuration
    packagingFeeConfig: {
      enabled: { type: Boolean, default: true },
      globalPackagingFee: { type: Number, default: 10 }
    },

    // Rider Tip Configuration
    tipConfig: {
      enabled: { type: Boolean, default: true },
      options: { type: [Number], default: [5, 10, 20] }
    },

    // Tax Configuration (GST)
    taxConfig: {
      enabled: { type: Boolean, default: true },
      gstPercent: { type: Number, default: 5 }
    }
  },
  { timestamps: true }
);

AdminSettingSchema.statics.getSettings = async function() {
  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('AdminSetting', AdminSettingSchema);
