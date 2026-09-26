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
      .select('_id name adminCommission deliveryFeeOverride adminOverride')
      .lean();
    const categories = await Category.find({})
      .select('_id name')
      .lean();

    res.status(200).json({
      success: true,
      config: {
        deliveryFeeConfig: settings.deliveryFeeConfig,
        surgeConfig: settings.surgeConfig,
        commissionConfig: settings.commissionConfig,
        platformFeeConfig: settings.platformFeeConfig,
        packagingFeeConfig: settings.packagingFeeConfig,
        tipConfig: settings.tipConfig,
        taxConfig: settings.taxConfig,
      },
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: typeof r.name === 'object' ? r.name.en : r.name,
        adminCommission: r.adminCommission || 20,
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

    if (baseFee !== undefined) settings.deliveryFeeConfig.baseFee = Number(baseFee);
    if (baseDistanceKm !== undefined) settings.deliveryFeeConfig.baseDistanceKm = Number(baseDistanceKm);
    if (maxDeliveryRadiusKm !== undefined) settings.deliveryFeeConfig.maxDeliveryRadiusKm = Number(maxDeliveryRadiusKm);
    if (isFreeDeliveryEnabled !== undefined) settings.deliveryFeeConfig.isFreeDeliveryEnabled = Boolean(isFreeDeliveryEnabled);
    if (freeDeliveryThreshold !== undefined) settings.deliveryFeeConfig.freeDeliveryThreshold = Number(freeDeliveryThreshold);
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
    }
    if (Array.isArray(categoryCommissions)) {
      settings.commissionConfig.categoryCommissions = categoryCommissions;
    }

    await settings.save();

    // Process restaurant-wise overrides if provided
    if (Array.isArray(restaurantOverrides)) {
      for (const override of restaurantOverrides) {
        if (override.restaurantId && override.commissionPercent !== undefined) {
          const rest = await Restaurant.findById(override.restaurantId);
          if (rest) {
            const oldRestComm = rest.adminCommission;
            rest.adminCommission = Number(override.commissionPercent);
            await rest.save();

            await AuditLog.log({
              entity: 'Restaurant',
              entityId: rest._id,
              action: 'admin_override',
              userId: req.user?._id,
              userRole: 'admin',
              changes: {
                field: 'adminCommission',
                oldValue: oldRestComm,
                newValue: rest.adminCommission,
              },
              reason: reason || `Admin set restaurant commission to ${override.commissionPercent}%`,
            });
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
