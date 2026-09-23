const mongoose = require('mongoose');

const incentiveTierSchema = new mongoose.Schema({
  targetOrders: { type: Number, required: true },
  bonusAmount: { type: Number, required: true },
  period: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  isActive: { type: Boolean, default: true }
});

const RiderEarningConfigSchema = new mongoose.Schema(
  {
    baseEarning: { type: Number, default: 20 },
    baseDistanceKm: { type: Number, default: 2 },
    perKmEarning: { type: Number, default: 8 },
    peakBonus: { type: Number, default: 10 },
    isPeakBonusActive: { type: Boolean, default: false },
    rainBonus: { type: Number, default: 15 },
    isRainBonusActive: { type: Boolean, default: false },
    nightBonus: { type: Number, default: 15 },
    isNightBonusActive: { type: Boolean, default: false },
    incentiveTiers: {
      type: [incentiveTierSchema],
      default: [
        { targetOrders: 10, bonusAmount: 100, period: 'daily', isActive: true },
        { targetOrders: 20, bonusAmount: 250, period: 'daily', isActive: true },
        { targetOrders: 50, bonusAmount: 700, period: 'weekly', isActive: true }
      ]
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

RiderEarningConfigSchema.statics.getConfig = async function () {
  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('RiderEarningConfig', RiderEarningConfigSchema);
