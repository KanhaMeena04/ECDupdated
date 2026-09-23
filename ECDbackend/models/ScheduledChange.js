const mongoose = require('mongoose');

const ScheduledChangeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetEntity: {
      type: String,
      required: true,
      enum: ['AdminSetting', 'EmergencyControl', 'FeatureFlag', 'Restaurant', 'RiderEarningConfig']
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'EXECUTED', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    executionLog: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScheduledChange', ScheduledChangeSchema);
