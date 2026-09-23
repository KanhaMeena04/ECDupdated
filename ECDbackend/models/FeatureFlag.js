const mongoose = require('mongoose');

const FeatureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    isEnabled: { type: Boolean, default: false },
    environment: { type: String, enum: ['all', 'development', 'production'], default: 'all' },
    targetAudience: { type: String, enum: ['all', 'beta_testers', 'admin_only'], default: 'all' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeatureFlag', FeatureFlagSchema);
