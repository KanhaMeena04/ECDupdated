const AdminSetting = require('../models/AdminSetting');
const ensureSettings = async () => {
  const existing = await AdminSetting.findOne();
  if (existing) return existing;
  return AdminSetting.create({});
};
const toPublicPayload = (settings) => ({
  appName: settings.appName || 'Food Delivery',
  logoUrl: settings.logoUrl || '',
  contactEmail: settings.contactEmail || '',
  contactPhone: settings.contactPhone || '',
  termsUrl: settings.termsUrl || '',
  privacyUrl: settings.privacyUrl || '',
});
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.status(200).json(toPublicPayload(settings));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateAdminSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const payload = {
      appName: typeof req.body.appName === 'string' ? req.body.appName : settings.appName,
      logoUrl: typeof req.body.logoUrl === 'string' ? req.body.logoUrl : settings.logoUrl,
      contactEmail: typeof req.body.contactEmail === 'string' ? req.body.contactEmail : settings.contactEmail,
      contactPhone: typeof req.body.contactPhone === 'string' ? req.body.contactPhone : settings.contactPhone,
      termsUrl: typeof req.body.termsUrl === 'string' ? req.body.termsUrl : settings.termsUrl,
      privacyUrl: typeof req.body.privacyUrl === 'string' ? req.body.privacyUrl : settings.privacyUrl,
    };
    settings.set(payload);
    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
