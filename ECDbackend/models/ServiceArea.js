const mongoose = require('mongoose');

const ServiceAreaSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    village: { type: String, trim: true, default: '' },
    pincode: { type: String, required: true, trim: true },
    isServiceActive: { type: Boolean, default: true },
    deliveryRadiusKm: { type: Number, default: 10 },
    baseDeliveryFee: { type: Number, default: 30 },
    minimumOrderValue: { type: Number, default: 100 },
    peakCharge: { type: Number, default: 0 },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ServiceAreaSchema.index({ state: 1, district: 1, city: 1, zone: 1, pincode: 1 });

module.exports = mongoose.model('ServiceArea', ServiceAreaSchema);
