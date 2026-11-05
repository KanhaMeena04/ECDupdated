const AdminSetting = require('../models/AdminSetting');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { calculateOrderPrice } = require('../services/priceCalculator');

// -------------------------------------------------------------
// GET ALL CENTRAL PRICING CONFIGURATIONS
// -------------------------------------------------------------
exports.getPricingConfig = async (req, res) => {
  try {
    const settings = await AdminSetting.getSettings();
    const restaurants = await Restaurant.find({})
      .select('_id name adminCommission deliveryFeeOverride adminOverride pricingModel useCommissionModel')
      .lean();
    const categories = await Category.find({})
      .select('_id name')
      .lean();

    const isCod = settings.isCodEnabled !== false && settings.codConfig?.enabled !== false;
    const maxCod = Number(settings.codConfig?.maxAmount || settings.maxCodAmount || 1000);
    const minCod = Number(settings.codConfig?.minAmount || 0);

    res.status(200).json({
      success: true,
      config: {
        deliveryFeeConfig: settings.deliveryFeeConfig,
        surgeConfig: settings.surgeConfig,
        commissionConfig: settings.commissionConfig,
        brandFooterConfig: settings.brandFooterConfig || { enabled: true, title: "ECD here for You", subtitle: "Delivering fast food, groceries & happiness to your doorstep.", badgeText: "Fast Delivery & 100% Quality Guaranteed" },
        platformFeeConfig: settings.platformFeeConfig,
        packagingFeeConfig: settings.packagingFeeConfig,
        tipConfig: settings.tipConfig,
        taxConfig: settings.taxConfig,
        isCodEnabled: isCod,
        maxCodAmount: maxCod,
        codConfig: {
          enabled: isCod,
          maxAmount: maxCod,
          minAmount: minCod,
          customMessage: settings.codConfig?.customMessage || ''
        },
      },
      riderPayoutConfig: {
        payoutModel: settings.riderPayoutConfig?.payoutModel || settings.riderEarningConfig?.payoutModel || 'commission',
        basePay: Number(settings.riderPayoutConfig?.basePay ?? settings.riderEarningConfig?.baseEarning ?? settings.deliveryFeeConfig?.riderBasePay ?? 25),
        baseDistanceKm: Number(settings.riderPayoutConfig?.baseDistanceKm ?? settings.riderEarningConfig?.baseDistanceKm ?? 2),
        extraPerKmFee: Number(settings.riderPayoutConfig?.extraPerKmFee ?? settings.riderEarningConfig?.perKmEarning ?? settings.deliveryFeeConfig?.riderBonusPerKm ?? 5),
        riderDeliveryFeePercent: Number(settings.riderPayoutConfig?.riderDeliveryFeePercent ?? settings.riderEarningConfig?.riderDeliveryFeePercent ?? 70),
        codOtpAlertMessage: settings.riderPayoutConfig?.codOtpAlertMessage || settings.riderEarningConfig?.codOtpAlertMessage || "Collect ₹{amount} CASH before entering OTP!",
        onlineOtpAlertMessage: settings.riderPayoutConfig?.onlineOtpAlertMessage || settings.riderEarningConfig?.onlineOtpAlertMessage || "Order paid online. Do NOT collect cash!",
      },
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: typeof r.name === 'object' ? r.name.en : r.name,
        pricingModel: r.pricingModel || (r.useCommissionModel ? 'commission' : 'b2b'),
        useCommissionModel: Boolean(r.useCommissionModel || r.pricingModel === 'commission'),
        adminCommission: (r.adminOverride?.isOverridden && r.adminCommission != null)
          ? Number(r.adminCommission)
          : Number(settings.commissionConfig?.globalCommissionPercent ?? (r.adminCommission || 20)),
        isOverridden: Boolean(r.adminOverride?.isOverridden),
      })),
      categories: categories.map(c => ({
        _id: c._id,
        name: typeof c.name === 'object' ? c.name.en : c.name,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// UPDATE DELIVERY FEE & DISTANCE SLABS
// -------------------------------------------------------------
exports.updateDeliveryFeeConfig = async (req, res) => {
  try {
    const { baseFee, baseDistanceKm, maxDeliveryRadiusKm, isFreeDeliveryEnabled, freeDeliveryThreshold, slabs, reason } = req.body;

    // Slab Validation
    if (Array.isArray(slabs)) {
      for (const s of slabs) {
        if (s.minDistanceKm < 0 || s.maxDistanceKm < 0 || s.fee < 0) {
          return res.status(400).json({ success: false, message: 'Min/max distance and fee must be non-negative numbers' });
        }
        if (Number(s.minDistanceKm) >= Number(s.maxDistanceKm)) {
          return res.status(400).json({ success: false, message: `Invalid slab range: ${s.minDistanceKm} km to ${s.maxDistanceKm} km. Min must be less than max.` });
        }
      }
    }

    const settings = await AdminSetting.getSettings();
    const oldConfig = { ...settings.deliveryFeeConfig };

    const payoutModel = req.body.payoutModel || req.body.riderPayoutConfig?.payoutModel || settings.riderPayoutConfig?.payoutModel || 'commission';
    const riderDeliveryFeePercent = Number(req.body.riderDeliveryFeePercent ?? req.body.riderPayoutConfig?.riderDeliveryFeePercent ?? settings.riderPayoutConfig?.riderDeliveryFeePercent ?? 70);
    const basePay = Number(req.body.riderBasePay ?? req.body.riderPayoutConfig?.basePay ?? settings.riderPayoutConfig?.basePay ?? 25);
    const extraPerKmFee = Number(req.body.riderBonusPerKm ?? req.body.riderPayoutConfig?.extraPerKmFee ?? settings.riderPayoutConfig?.extraPerKmFee ?? 5);
    const riderBaseDistanceKm = Number(req.body.riderPayoutConfig?.baseDistanceKm ?? settings.riderPayoutConfig?.baseDistanceKm ?? 2);
    const codOtpAlertMessage = req.body.codOtpAlertMessage || req.body.riderPayoutConfig?.codOtpAlertMessage || settings.riderPayoutConfig?.codOtpAlertMessage;
    const onlineOtpAlertMessage = req.body.onlineOtpAlertMessage || req.body.riderPayoutConfig?.onlineOtpAlertMessage || settings.riderPayoutConfig?.onlineOtpAlertMessage;

    if (!settings.riderPayoutConfig) settings.riderPayoutConfig = {};
    settings.riderPayoutConfig.payoutModel = payoutModel;
    settings.riderPayoutConfig.basePay = basePay;
    settings.riderPayoutConfig.baseDistanceKm = riderBaseDistanceKm;
    settings.riderPayoutConfig.extraPerKmFee = extraPerKmFee;
    settings.riderPayoutConfig.riderDeliveryFeePercent = riderDeliveryFeePercent;
    if (codOtpAlertMessage) settings.riderPayoutConfig.codOtpAlertMessage = codOtpAlertMessage;
    if (onlineOtpAlertMessage) settings.riderPayoutConfig.onlineOtpAlertMessage = onlineOtpAlertMessage;

    if (!settings.riderEarningConfig) settings.riderEarningConfig = {};
    settings.riderEarningConfig.payoutModel = payoutModel;
    settings.riderEarningConfig.baseEarning = basePay;
    settings.riderEarningConfig.baseDistanceKm = riderBaseDistanceKm;
    settings.riderEarningConfig.perKmEarning = extraPerKmFee;
    settings.riderEarningConfig.riderDeliveryFeePercent = riderDeliveryFeePercent;
    if (codOtpAlertMessage) settings.riderEarningConfig.codOtpAlertMessage = codOtpAlertMessage;
    if (onlineOtpAlertMessage) settings.riderEarningConfig.onlineOtpAlertMessage = onlineOtpAlertMessage;

    try {
      const RiderEarningConfig = require('../models/RiderEarningConfig');
      await RiderEarningConfig.findOneAndUpdate({}, {
        payoutModel,
        baseEarning: basePay,
        baseDistanceKm: riderBaseDistanceKm,
        perKmEarning: extraPerKmFee,
        riderDeliveryFeePercent,
        ...(codOtpAlertMessage && { codOtpAlertMessage }),
        ...(onlineOtpAlertMessage && { onlineOtpAlertMessage }),
        updatedBy: req.user?._id
      }, { upsert: true });
    } catch (_) {}
    if (baseFee !== undefined) settings.deliveryFeeConfig.baseFee = Number(baseFee);
    if (baseDistanceKm !== undefined) settings.deliveryFeeConfig.baseDistanceKm = Number(baseDistanceKm);
    if (maxDeliveryRadiusKm !== undefined) settings.deliveryFeeConfig.maxDeliveryRadiusKm = Number(maxDeliveryRadiusKm);
    if (isFreeDeliveryEnabled !== undefined) settings.deliveryFeeConfig.isFreeDeliveryEnabled = Boolean(isFreeDeliveryEnabled);
    if (freeDeliveryThreshold !== undefined) settings.deliveryFeeConfig.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    if (req.body.firstOrderFreeDelivery !== undefined) settings.deliveryFeeConfig.firstOrderFreeDelivery = Boolean(req.body.firstOrderFreeDelivery);
    if (Array.isArray(slabs)) settings.deliveryFeeConfig.slabs = slabs;

    await settings.save();

    await AuditLog.log({
      entity: 'HomeScreenSection',
      entityId: settings._id,
      action: 'admin_override',
      userId: req.user?._id,
      userRole: 'admin',
      changes: {
        field: 'deliveryFeeConfig',
        oldValue: oldConfig,
        newValue: settings.deliveryFeeConfig,
      },
      reason: reason || 'Admin updated central delivery fee & distance slabs',
    });

    res.status(200).json({
      success: true,
      message: 'Delivery fee configuration updated successfully',
      deliveryFeeConfig: settings.deliveryFeeConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// UPDATE CASH ON DELIVERY (COD) MAXIMUM AMOUNT & CONFIGURATION
// -------------------------------------------------------------
exports.updateCodConfig = async (req, res) => {
  try {
    const { enabled, isCodEnabled, maxAmount, maxCodAmount, minAmount, minCodAmount, customMessage, reason } = req.body;
    const settings = await AdminSetting.getSettings();
    const oldConfig = { ...settings.codConfig };

    if (!settings.codConfig) settings.codConfig = {};

    const codEnabledVal = enabled !== undefined ? enabled : isCodEnabled;
    if (codEnabledVal !== undefined) {
      settings.codConfig.enabled = Boolean(codEnabledVal);
      settings.isCodEnabled = Boolean(codEnabledVal);
    }

    const codMaxVal = maxAmount !== undefined ? maxAmount : maxCodAmount;
    if (codMaxVal !== undefined) {
      const parsedMax = Math.max(0, Number(codMaxVal));
      settings.codConfig.maxAmount = parsedMax;
      settings.maxCodAmount = parsedMax;
    }

    const codMinVal = minAmount !== undefined ? minAmount : minCodAmount;
    if (codMinVal !== undefined) {
      settings.codConfig.minAmount = Math.max(0, Number(codMinVal));
    }

    if (customMessage !== undefined) {
      settings.codConfig.customMessage = String(customMessage);
    }

    await settings.save();

    await AuditLog.log({
      entity: 'HomeScreenSection',
      entityId: settings._id,
      action: 'admin_override',
      userId: req.user?._id,
      userRole: 'admin',
      changes: {
        field: 'codConfig',
        oldValue: oldConfig,
        newValue: settings.codConfig,
      },
      reason: reason || 'Admin updated COD maximum amount & configuration',
    });

    res.status(200).json({
      success: true,
      message: 'Cash on Delivery configuration updated successfully',
      codConfig: settings.codConfig,
      isCodEnabled: settings.isCodEnabled,
      maxCodAmount: settings.maxCodAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// UPDATE SURGE / EXTRA CHARGES CONFIGURATION
// -------------------------------------------------------------
exports.updateSurgeConfig = async (req, res) => {
  try {
    const { peakHour, nightCharge, rainCharge, highDemandCharge, reason } = req.body;

    const settings = await AdminSetting.getSettings();
    const oldConfig = { ...settings.surgeConfig };

    if (peakHour) settings.surgeConfig.peakHour = { ...settings.surgeConfig.peakHour, ...peakHour };
    if (nightCharge) settings.surgeConfig.nightCharge = { ...settings.surgeConfig.nightCharge, ...nightCharge };
    if (rainCharge) settings.surgeConfig.rainCharge = { ...settings.surgeConfig.rainCharge, ...rainCharge };
    if (highDemandCharge) settings.surgeConfig.highDemandCharge = { ...settings.surgeConfig.highDemandCharge, ...highDemandCharge };
    settings.markModified('surgeConfig');

    await settings.save();

    await AuditLog.log({
      entity: 'HomeScreenSection',
      entityId: settings._id,
      action: 'admin_override',
      userId: req.user?._id,
      userRole: 'admin',
      changes: {
        field: 'surgeConfig',
        oldValue: oldConfig,
        newValue: settings.surgeConfig,
      },
      reason: reason || 'Admin updated surge and extra delivery charges',
    });

    res.status(200).json({
      success: true,
      message: 'Surge pricing configuration updated successfully',
      surgeConfig: settings.surgeConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// UPDATE COMMISSION CONFIGURATION
// -------------------------------------------------------------
exports.updateCommissionConfig = async (req, res) => {
  try {
    const { globalCommissionPercent, categoryCommissions, restaurantOverrides, reason } = req.body;

    const settings = await AdminSetting.getSettings();
    const oldConfig = { ...settings.commissionConfig };

    if (globalCommissionPercent !== undefined) {
      settings.commissionConfig.globalCommissionPercent = Number(globalCommissionPercent);
      // Synchronize all non-overridden restaurants with the new global default commission
      await Restaurant.updateMany(
        { "adminOverride.isOverridden": { $ne: true } },
        { $set: { adminCommission: Number(globalCommissionPercent) } }
      );
    }
    if (Array.isArray(categoryCommissions)) {
      settings.commissionConfig.categoryCommissions = categoryCommissions;
    }

    await settings.save();

    // Process restaurant-wise overrides if provided
    if (Array.isArray(restaurantOverrides)) {
      for (const override of restaurantOverrides) {
        if (override.restaurantId) {
          const rest = await Restaurant.findById(override.restaurantId);
          if (rest) {
            const oldRestComm = rest.adminCommission;
            if (override.pricingModel !== undefined) {
              rest.pricingModel = override.pricingModel;
              rest.useCommissionModel = override.pricingModel === 'commission';
            } else if (override.useCommissionModel !== undefined) {
              rest.useCommissionModel = Boolean(override.useCommissionModel);
              rest.pricingModel = rest.useCommissionModel ? 'commission' : 'b2b';
            }
            if (override.commissionPercent !== undefined && !isNaN(Number(override.commissionPercent))) {
              rest.adminCommission = Number(override.commissionPercent);
              rest.adminOverride = {
                ...(rest.adminOverride || {}),
                isOverridden: true,
                commissionPercent: Number(override.commissionPercent),
                updatedAt: new Date(),
              };
            }
            if (rest.pricingModel === 'b2b') {
              rest.useCommissionModel = false;
            } else if (rest.pricingModel === 'commission') {
              rest.useCommissionModel = true;
            }
            rest.markModified('pricingModel');
            rest.markModified('useCommissionModel');
            rest.markModified('adminOverride');
            await rest.save();

            try {
              await AuditLog.log({
                entity: 'Restaurant',
                entityId: rest._id,
                action: 'admin_override',
                userId: req.user?._id,
                userRole: 'admin',
                changes: {
                  field: 'pricingModel_and_commission',
                  oldValue: oldRestComm,
                  newValue: { pricingModel: rest.pricingModel, adminCommission: rest.adminCommission },
                },
                reason: reason || `Admin set restaurant model to ${rest.pricingModel}`,
              });
            } catch (_) {}
          }
        }
      }
    }

    await AuditLog.log({
      entity: 'HomeScreenSection',
      entityId: settings._id,
      action: 'admin_override',
      userId: req.user?._id,
      userRole: 'admin',
      changes: {
        field: 'commissionConfig',
        oldValue: oldConfig,
        newValue: settings.commissionConfig,
      },
      reason: reason || 'Admin updated commission settings',
    });

    res.status(200).json({
      success: true,
      message: 'Commission configuration updated successfully',
      commissionConfig: settings.commissionConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// UPDATE PLATFORM & PACKAGING FEE CONFIGURATION
// -------------------------------------------------------------
exports.updateFeeConfig = async (req, res) => {
  try {
    const { platformFeeConfig, packagingFeeConfig, tipConfig, taxConfig, reason } = req.body;

    const settings = await AdminSetting.getSettings();
    const oldPlatform = { ...settings.platformFeeConfig };
    const oldPackaging = { ...settings.packagingFeeConfig };

    if (platformFeeConfig) {
      settings.platformFeeConfig = { ...settings.platformFeeConfig, ...platformFeeConfig };
      settings.markModified('platformFeeConfig');
    }
    if (packagingFeeConfig) {
      settings.packagingFeeConfig = { ...settings.packagingFeeConfig, ...packagingFeeConfig };
      settings.markModified('packagingFeeConfig');
    }
    if (tipConfig) {
      settings.tipConfig = { ...settings.tipConfig, ...tipConfig };
      settings.markModified('tipConfig');
    }
    if (taxConfig) {
      settings.taxConfig = { ...settings.taxConfig, ...taxConfig };
      settings.markModified('taxConfig');
    }

    await settings.save();

    await AuditLog.log({
      entity: 'HomeScreenSection',
      entityId: settings._id,
      action: 'admin_override',
      userId: req.user?._id,
      userRole: 'admin',
      changes: {
        field: 'platform_packaging_fees',
        oldValue: { platform: oldPlatform, packaging: oldPackaging },
        newValue: { platform: settings.platformFeeConfig, packaging: settings.packagingFeeConfig },
      },
      reason: reason || 'Admin updated platform & packaging fee settings',
    });

    res.status(200).json({
      success: true,
      message: 'Fee configuration updated successfully',
      platformFeeConfig: settings.platformFeeConfig,
      packagingFeeConfig: settings.packagingFeeConfig,
      tipConfig: settings.tipConfig,
      taxConfig: settings.taxConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// LIVE PRICING PREVIEW SIMULATOR (DOES NOT CREATE ORDER)
// -------------------------------------------------------------
exports.previewPricingCalculation = async (req, res) => {
  try {
    const { restaurantId, deliveryDistance = 2, itemTotal = 300, couponCode = null, orderType = 'delivery', categoryId = null } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required for pricing preview' });
    }

    // Build mock items
    const mockItems = [
      {
        price: Number(itemTotal),
        quantity: 1,
        category: categoryId || null,
      },
    ];

    const result = await calculateOrderPrice({
      items: mockItems,
      restaurantId,
      deliveryDistance: Number(deliveryDistance),
      couponCode,
      orderType,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(200).json({
      success: true,
      preview: result.breakdown,
      sources: result.sources,
      coupon: result.coupon,
      isRadiusExceeded: result.isRadiusExceeded,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------------------------
// UPDATE CUSTOMER APP BRAND FOOTER WATERMARK CONFIGURATION
// -------------------------------------------------------------
exports.updateBrandFooterConfig = async (req, res) => {
  try {
    const { enabled, title, subtitle, badgeText } = req.body;
    const settings = await AdminSetting.getSettings();
    if (!settings.brandFooterConfig) {
      settings.brandFooterConfig = {};
    }
    if (enabled !== undefined) settings.brandFooterConfig.enabled = Boolean(enabled);
    if (title !== undefined) settings.brandFooterConfig.title = title.trim();
    if (subtitle !== undefined) settings.brandFooterConfig.subtitle = subtitle.trim();
    if (badgeText !== undefined) settings.brandFooterConfig.badgeText = badgeText.trim();

    settings.markModified('brandFooterConfig');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Brand footer watermark updated successfully',
      brandFooterConfig: settings.brandFooterConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
