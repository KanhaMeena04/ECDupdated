const AdminSetting = require('../models/AdminSetting');

const ensureSettings = async () => {
  const existing = await AdminSetting.findOne();
  if (existing) return existing;
  return AdminSetting.create({});
};

const toPublicPayload = (settings) => {
  const isCod = settings.isCodEnabled !== false && settings.codConfig?.enabled !== false;
  const maxCod = Number(settings.codConfig?.maxAmount || settings.maxCodAmount || 1000);
  const minCod = Number(settings.codConfig?.minAmount || 0);

  return {
    appName: settings.appName || 'ECDKART Food Delivery',
    logoUrl: settings.logoUrl || '',
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
    termsUrl: settings.termsUrl || '',
    privacyUrl: settings.privacyUrl || '',
    isCodEnabled: isCod,
    maxCodAmount: maxCod,
    minCodAmount: minCod,
    codConfig: {
      enabled: isCod,
      maxAmount: maxCod,
      minAmount: minCod,
      customMessage: settings.codConfig?.customMessage || ''
    },
    deliveryFeeConfig: settings.deliveryFeeConfig,
    platformFeeConfig: settings.platformFeeConfig,
    packagingFeeConfig: settings.packagingFeeConfig,
    brandFooterConfig: settings.brandFooterConfig || {
      enabled: true,
      title: "ECD here for You",
      subtitle: "Delivering fast food, groceries & happiness to your doorstep.",
      badgeText: "Fast Delivery & 100% Quality Guaranteed"
    },
    surgeConfig: settings.surgeConfig,
    tipConfig: settings.tipConfig || { enabled: true, options: [5, 10, 20] },
    taxConfig: settings.taxConfig || { enabled: true, gstPercent: 5 },
    selfPickupConfig: settings.selfPickupConfig || { enabled: true, pickupCapacityPerHour: 20, preparationBufferMins: 10, gracePeriodMins: 15 },
    riderEarningConfig: settings.riderEarningConfig || { baseEarning: 20, baseDistanceKm: 2, perKmEarning: 8 },
    orderTimingConfig: settings.orderTimingConfig || {
      cancellationWindowMins: settings.selfPickupConfig?.cancellationWindowMins || 5,
      riderPickupGracePeriodMins: settings.selfPickupConfig?.gracePeriodMins || 15,
      selfPickupGracePeriodMins: settings.selfPickupConfig?.gracePeriodMins || 15,
      preparationBufferMins: 10
    }
  };
};

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const publicData = toPublicPayload(settings);
    const isCodEnabled = publicData.isCodEnabled;
    const maxCodAmount = publicData.maxCodAmount;
    res.status(200).json({
      success: true,
      isCodEnabled,
      maxCodAmount,
      settings: {
        isCodEnabled,
        maxCodAmount,
        ...publicData
      },
      data: {
        isCodEnabled,
        maxCodAmount,
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
    if (req.body.codEnable !== undefined) {
      settings.isCodEnabled = req.body.codEnable === 'ENABLE' || req.body.codEnable === true || req.body.codEnable === 'true';
      if (!settings.codConfig) settings.codConfig = {};
      settings.codConfig.enabled = settings.isCodEnabled;
    }
    if (req.body.maxCodAmount !== undefined) {
      settings.maxCodAmount = Number(req.body.maxCodAmount);
      if (!settings.codConfig) settings.codConfig = {};
      settings.codConfig.maxAmount = Number(req.body.maxCodAmount);
    }
    if (req.body.codConfig) {
      settings.codConfig = { ...settings.codConfig, ...req.body.codConfig };
      if (req.body.codConfig.enabled !== undefined) settings.isCodEnabled = Boolean(req.body.codConfig.enabled);
      if (req.body.codConfig.maxAmount !== undefined) settings.maxCodAmount = Number(req.body.codConfig.maxAmount);
    }
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
    const ec = settings.riderEarningConfig || {};
    const pc = settings.riderPayoutConfig || {};
    return res.status(200).json({
      success: true,
      config: {
        payoutModel: ec.payoutModel || pc.payoutModel || 'commission',
        baseEarning: Number(ec.baseEarning ?? pc.basePay ?? 20),
        baseDistanceKm: Number(ec.baseDistanceKm ?? pc.baseDistanceKm ?? 2),
        perKmEarning: Number(ec.perKmEarning ?? pc.extraPerKmFee ?? 8),
        riderDeliveryFeePercent: Number(ec.riderDeliveryFeePercent ?? pc.riderDeliveryFeePercent ?? 70),
        peakBonus: Number(ec.peakBonus ?? 10),
        isPeakBonusActive: Boolean(ec.isPeakBonusActive),
        rainBonus: Number(ec.rainBonus ?? 15),
        isRainBonusActive: Boolean(ec.isRainBonusActive),
        nightBonus: Number(ec.nightBonus ?? 15),
        isNightBonusActive: Boolean(ec.isNightBonusActive),
        codOtpAlertMessage: ec.codOtpAlertMessage || pc.codOtpAlertMessage || "Pehle customer se ₹{amount} CASH collect karein, uske baad hi delivery OTP enter karein!",
        onlineOtpAlertMessage: ec.onlineOtpAlertMessage || pc.onlineOtpAlertMessage || "Order online already paid hai. Customer se Cash collect NA karein!",
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
    settings.riderPayoutConfig = settings.riderPayoutConfig || {};

    if (req.body.payoutModel !== undefined) {
      settings.riderPayoutConfig.payoutModel = req.body.payoutModel;
    }
    if (req.body.riderDeliveryFeePercent !== undefined) {
      settings.riderPayoutConfig.riderDeliveryFeePercent = Number(req.body.riderDeliveryFeePercent);
    }
    if (req.body.baseEarning !== undefined) {
      settings.riderPayoutConfig.basePay = Number(req.body.baseEarning);
    }
    if (req.body.baseDistanceKm !== undefined) {
      settings.riderPayoutConfig.baseDistanceKm = Number(req.body.baseDistanceKm);
    }
    if (req.body.perKmEarning !== undefined) {
      settings.riderPayoutConfig.extraPerKmFee = Number(req.body.perKmEarning);
    }
    if (req.body.codOtpAlertMessage !== undefined) {
      settings.riderPayoutConfig.codOtpAlertMessage = req.body.codOtpAlertMessage;
    }
    if (req.body.onlineOtpAlertMessage !== undefined) {
      settings.riderPayoutConfig.onlineOtpAlertMessage = req.body.onlineOtpAlertMessage;
    }
    await settings.save();

    try {
      const RiderEarningConfig = require('../models/RiderEarningConfig');
      await RiderEarningConfig.findOneAndUpdate({}, { ...req.body, updatedBy: req.user?._id }, { upsert: true });
    } catch (_) {}

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

exports.getOrderTimingConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({
      success: true,
      config: settings.orderTimingConfig || {
        cancellationWindowMins: settings.selfPickupConfig?.cancellationWindowMins || 5,
        riderPickupGracePeriodMins: settings.selfPickupConfig?.gracePeriodMins || 15,
        selfPickupGracePeriodMins: settings.selfPickupConfig?.gracePeriodMins || 15,
        preparationBufferMins: 10
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderTimingConfig = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const cancellationWindowMins = Number(req.body.cancellationWindowMins) || 5;
    const riderPickupGracePeriodMins = Number(req.body.riderPickupGracePeriodMins) || 15;
    const selfPickupGracePeriodMins = Number(req.body.selfPickupGracePeriodMins) || riderPickupGracePeriodMins;
    const preparationBufferMins = Number(req.body.preparationBufferMins) || 10;

    settings.orderTimingConfig = {
      cancellationWindowMins,
      riderPickupGracePeriodMins,
      selfPickupGracePeriodMins,
      preparationBufferMins
    };

    if (settings.selfPickupConfig) {
      settings.selfPickupConfig.cancellationWindowMins = cancellationWindowMins;
      settings.selfPickupConfig.gracePeriodMins = selfPickupGracePeriodMins;
      settings.selfPickupConfig.preparationBufferMins = preparationBufferMins;
    }

    await settings.save();
    return res.status(200).json({
      success: true,
      message: 'Order timing and cancellation parameters saved successfully',
      config: settings.orderTimingConfig
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
