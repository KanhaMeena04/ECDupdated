const mongoose = require('mongoose');
const AdminSettingSchema = new mongoose.Schema(
  {
    appName: { type: String, trim: true, default: 'Food Delivery' },
    logoUrl: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    termsUrl: { type: String, trim: true, default: '' },
    privacyUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);
module.exports = mongoose.model('AdminSetting', AdminSettingSchema);
