const AdminSetting = require('../models/AdminSetting');

const ensureSettings = async () => {
  const existing = await AdminSetting.findOne();
  if (existing) return existing;
  return AdminSetting.create({});
};

const toPublicPayload = (settings) => ({
  appName: settings.appName || 'ECDKART Food Delivery',
  logoUrl: settings.logoUrl || '',
  contactEmail: settings.contactEmail || '',
  contactPhone: settings.contactPhone || '',
  termsUrl: settings.termsUrl || '',
  privacyUrl: settings.privacyUrl || '',
  deliveryFeeConfig: settings.deliveryFeeConfig,
  platformFeeConfig: settings.platformFeeConfig,
  packagingFeeConfig: settings.packagingFeeConfig,
  surgeConfig: settings.surgeConfig,
  tipConfig: settings.tipConfig || { enabled: true, options: [5, 10, 20] },
  taxConfig: settings.taxConfig || { enabled: true, gstPercent: 5 },
  selfPickupConfig: settings.selfPickupConfig || { enabled: true, pickupCapacityPerHour: 20, preparationBufferMins: 10, gracePeriodMins: 15 },
  riderEarningConfig: settings.riderEarningConfig || { baseEarning: 20, baseDistanceKm: 2, perKmEarning: 8 }
});

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const publicData = toPublicPayload(settings);
    const isCodEnabled = settings.isCodEnabled !== false;
    res.status(200).json({
      success: true,
      isCodEnabled,
      settings: {
        isCodEnabled,
        ...publicData
      },
      data: {
        isCodEnabled,
        ...publicData
      },
      ...publicData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    settings.set(req.body);
    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiderEarningConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({
      success: true,
      config: settings.riderEarningConfig || {
        baseEarning: 20,
        baseDistanceKm: 2,
        perKmEarning: 8,
        peakBonus: 10,
        isPeakBonusActive: false,
        rainBonus: 15,
        isRainBonusActive: false,
        nightBonus: 15,
        isNightBonusActive: false
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRiderEarningConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    settings.riderEarningConfig = { ...settings.riderEarningConfig, ...req.body };
    await settings.save();
    return res.status(200).json({
      success: true,
      message: 'Rider earning config updated successfully',
      config: settings.riderEarningConfig
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSelfPickupConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({
      success: true,
      config: settings.selfPickupConfig || {
        enabled: true,
        pickupCapacityPerHour: 20,
        preparationBufferMins: 10,
        gracePeriodMins: 15,
        cancellationWindowMins: 5,
        customerArrivalTimeoutMins: 30
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSelfPickupConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    settings.selfPickupConfig = { ...settings.selfPickupConfig, ...req.body };
    await settings.save();
    return res.status(200).json({
      success: true,
      message: 'Self pickup config updated successfully',
      config: settings.selfPickupConfig
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
