const mongoose = require('mongoose');

const EmergencyControlSchema = new mongoose.Schema(
  {
    acceptNewOrders: { type: Boolean, default: true },
    deliveryService: { type: Boolean, default: true },
    selfPickup: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: true },
    cod: { type: Boolean, default: true },
    riderDispatch: { type: Boolean, default: true },
    couponsEnabled: { type: Boolean, default: true },
    offersEnabled: { type: Boolean, default: true },
    disabledAreas: [{ type: String }], // Array of Zone/City/Pincode strings
    disabledRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    reason: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

EmergencyControlSchema.statics.getControls = async function () {
  try {
    let doc = await this.findOne({});
    if (!doc) {
      doc = await this.create({});
    }
    return doc;
  } catch (e) {
    return {
      acceptNewOrders: true,
      deliveryService: true,
      selfPickup: true,
      onlinePayment: true,
      cod: true,
      riderDispatch: true,
      couponsEnabled: true,
      offersEnabled: true,
      disabledAreas: [],
      disabledRestaurants: []
    };
  }
};

module.exports = mongoose.model('EmergencyControl', EmergencyControlSchema);
