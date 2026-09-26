const Product = require("../models/Product");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const AuditLog = require("../models/AuditLog");

const syncRestaurantMenuToProducts = async () => {
  try {
    const restaurantsWithMenu = await Restaurant.find({
      $or: [
        { "menu.0": { $exists: true } },
        { menu: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    if (restaurantsWithMenu.length > 0) {
      let defaultCat = await Category.findOne({ isMaster: true });
      if (!defaultCat) defaultCat = await Category.findOne({});
      if (!defaultCat) {
        defaultCat = await Category.create({
          name: { en: "Main Course" },
          slug: "main-course",
          isActive: true,
          isMaster: true,
        });
      }

      for (const rest of restaurantsWithMenu) {
        if (Array.isArray(rest.menu) && rest.menu.length > 0) {
          for (const m of rest.menu) {
            const mName = m.name || (typeof m === 'string' ? m : '');
            if (!mName) continue;

            const exists = await Product.findOne({
              restaurant: rest._id,
              $or: [
                { "name.en": mName },
                { name: mName }
              ]
            });

            if (!exists) {
              const rawFoodType = (m.foodType || (m.isVeg ? 'veg' : 'non-veg')).toString().toLowerCase();
              const itemFoodType = rawFoodType.includes('egg') ? 'egg' : (rawFoodType.includes('non') ? 'non-veg' : 'veg');
              const price = Number(m.price || m.basePrice || 0);
              const mrp = Number(m.mrp || m.b2cMrp || price);

              let itemCat = defaultCat;
              if (m.category && typeof m.category === 'string') {
                const foundCat = await Category.findOne({
                  $or: [
                    { "name.en": { $regex: `^${m.category.trim()}$`, $options: 'i' } },
                    { name: { $regex: `^${m.category.trim()}$`, $options: 'i' } },
                    { slug: m.category.toLowerCase().replace(/\s+/g, '-') }
                  ]
                });
                if (foundCat) itemCat = foundCat;
              }

              const isAppr = Boolean(rest.restaurantApproved);
              const createdProd = await Product.create({
                restaurant: rest._id,
                category: itemCat._id,
                categoryId: itemCat._id,
                name: { en: mName },
                description: { en: m.description || "" },
                image: m.image || "",
                basePrice: price,
                sellingPrice: price,
                mrp: mrp,
                pricing: {
                  b2c: { mrp: mrp, sellingPrice: price, discountPercent: 0 },
                  b2b: { sellingPrice: price, discountPercent: 0 }
                },
                isVeg: itemFoodType === 'veg',
                foodType: itemFoodType,
                available: true,
                isApproved: isAppr,
                approvalStatus: isAppr ? 'approved' : 'pending',
                isPublished: isAppr,
              });

              await Restaurant.findByIdAndUpdate(rest._id, { $addToSet: { product: createdProd._id } });
            }
          }
        }
      }
    }
  } catch (syncErr) {
    console.warn('[Menu Auto-Sync Notice]:', syncErr.message);
  }
};

/**
 * GET /api/admin/menu/pending
 * Retrieve all menu items pending admin review
 */
exports.getPendingMenuItems = async (req, res) => {
  try {
    const { restaurantId, categoryId, subcategoryId, search } = req.query;
    await syncRestaurantMenuToProducts();

    const filter = {
      $or: [
        { approvalStatus: "pending" },
        { approvalStatus: { $exists: false } },
        { isApproved: false, isRejected: { $ne: true } },
        { isApproved: { $exists: false } },
        { pendingUpdate: { $exists: true, $ne: null } }
      ]
    };

    if (restaurantId) filter.restaurant = restaurantId;
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;

    if (search) {
      filter.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Product.find(filter)
      .populate("restaurant", "name email contactNumber restaurantApproved isActive menuApproved")
      .populate("category", "name slug")
      .populate("categoryId", "name slug")
      .populate("subcategoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = items.map(item => {
      const b2cSelling = Number(item.pricing?.b2c?.sellingPrice ?? item.sellingPrice ?? item.basePrice ?? item.price ?? 0);
      const b2cMrp = Number(item.pricing?.b2c?.mrp ?? item.mrp ?? b2cSelling);
      const b2bSelling = Number(item.pricing?.b2b?.sellingPrice ?? item.b2bPrice ?? b2cSelling);
      const rawFoodType = (item.foodType || (item.isVeg ? 'veg' : 'non-veg')).toString().toLowerCase();
      const normFoodType = rawFoodType.includes('egg') ? 'egg' : (rawFoodType.includes('non') ? 'non-veg' : 'veg');

      const rawCat = item.categoryId || item.category;
      const formattedCat = rawCat && typeof rawCat === 'object'
        ? rawCat
        : { _id: rawCat || '', name: typeof item.category === 'string' ? item.category : 'Main Course' };

      const rawSub = item.subcategoryId || item.subcategory;
      const formattedSub = rawSub && typeof rawSub === 'object'
        ? rawSub
        : { _id: rawSub || '', name: typeof item.subcategory === 'string' ? item.subcategory : '' };

      const rawVariations = item.variations || item.variants || item.flavors || [];
      const formattedVariations = Array.isArray(rawVariations) ? rawVariations.map(v => {
        if (typeof v === 'string') return { name: { en: v }, price: 0 };
        if (v && typeof v === 'object') return { name: v.name || { en: 'Variant' }, price: Number(v.price || 0) };
        return null;
      }).filter(Boolean) : [];

      const rawAddOns = item.addOns || [];
      const formattedAddOns = Array.isArray(rawAddOns) ? rawAddOns.map(a => {
        if (typeof a === 'string') return { name: { en: a }, price: 0, image: '' };
        if (a && typeof a === 'object') return { name: a.name || { en: 'Add-on' }, price: Number(a.price || 0), image: a.image || '' };
        return null;
      }).filter(Boolean) : [];

      return {
        _id: item._id,
        id: item._id,
        name: typeof item.name === 'object' ? (item.name.en || Object.values(item.name)[0] || 'Unnamed Item') : (item.name || 'Unnamed Item'),
        description: typeof item.description === 'object' ? (item.description.en || Object.values(item.description)[0] || '') : (item.description || ''),
        image: item.image || '',
        restaurant: item.restaurant,
        category: formattedCat,
        subcategory: formattedSub,
        pricing: {
          b2c: {
            mrp: b2cMrp,
            sellingPrice: b2cSelling,
            discountPercent: item.pricing?.b2c?.discountPercent || (b2cMrp > b2cSelling ? Math.round(((b2cMrp - b2cSelling) / b2cMrp) * 100) : 0)
          },
          b2b: {
            sellingPrice: b2bSelling,
            discountPercent: item.pricing?.b2b?.discountPercent || 0
          }
        },
        foodType: normFoodType,
        preparationTime: item.preparationTime || 15,
        available: item.available !== false && item.isAvailable !== false,
        approvalStatus: item.approvalStatus || (item.isApproved ? 'approved' : (item.isRejected ? 'rejected' : 'pending')),
        isApproved: Boolean(item.isApproved),
        isPublished: Boolean(item.isPublished),
        isRejected: Boolean(item.isRejected),
        rejectionReason: item.rejectionReason || '',
        changeRequest: item.changeRequest || '',
        variations: formattedVariations,
        addOns: formattedAddOns,
        submittedAt: item.createdAt,
        pendingUpdate: item.pendingUpdate
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error("Error in getPendingMenuItems:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/menu/all
 * Retrieve all menu items across restaurants with status filter
 */
exports.getAllMenuItemsAdmin = async (req, res) => {
  try {
    const { status, restaurantId, categoryId, search } = req.query;
    await syncRestaurantMenuToProducts();
    const filter = {};

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.$or = [
          { approvalStatus: 'pending' },
          { approvalStatus: { $exists: false } },
          { isApproved: false, isRejected: { $ne: true } },
          { isApproved: { $exists: false } },
          { pendingUpdate: { $exists: true, $ne: null } }
        ];
      } else if (status === 'approved') {
        filter.$or = [
          { isApproved: true },
          { approvalStatus: 'approved' }
        ];
      } else if (status === 'rejected') {
        filter.$or = [
          { approvalStatus: 'rejected' },
          { isRejected: true }
        ];
      } else if (status === 'changes_requested') {
        filter.approvalStatus = 'changes_requested';
      }
    }

    if (restaurantId) filter.restaurant = restaurantId;
    if (categoryId) filter.categoryId = categoryId;
    if (search) {
      filter.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Product.find(filter)
      .populate("restaurant", "name email contactNumber restaurantApproved isActive menuApproved")
      .populate("category", "name slug")
      .populate("categoryId", "name slug")
      .populate("subcategoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = items.map(item => {
      const b2cSelling = Number(item.pricing?.b2c?.sellingPrice ?? item.sellingPrice ?? item.basePrice ?? item.price ?? 0);
      const b2cMrp = Number(item.pricing?.b2c?.mrp ?? item.mrp ?? b2cSelling);
      const b2bSelling = Number(item.pricing?.b2b?.sellingPrice ?? item.b2bPrice ?? b2cSelling);
      const rawFoodType = (item.foodType || (item.isVeg ? 'veg' : 'non-veg')).toString().toLowerCase();
      const normFoodType = rawFoodType.includes('egg') ? 'egg' : (rawFoodType.includes('non') ? 'non-veg' : 'veg');

      const rawCat = item.categoryId || item.category;
      const formattedCat = rawCat && typeof rawCat === 'object'
        ? rawCat
        : { _id: rawCat || '', name: typeof item.category === 'string' ? item.category : 'Main Course' };

      const rawSub = item.subcategoryId || item.subcategory;
      const formattedSub = rawSub && typeof rawSub === 'object'
        ? rawSub
        : { _id: rawSub || '', name: typeof item.subcategory === 'string' ? item.subcategory : '' };

      const rawVariations = item.variations || item.variants || item.flavors || [];
      const formattedVariations = Array.isArray(rawVariations) ? rawVariations.map(v => {
        if (typeof v === 'string') return { name: { en: v }, price: 0 };
        if (v && typeof v === 'object') return { name: v.name || { en: 'Variant' }, price: Number(v.price || 0) };
        return null;
      }).filter(Boolean) : [];

      const rawAddOns = item.addOns || [];
      const formattedAddOns = Array.isArray(rawAddOns) ? rawAddOns.map(a => {
        if (typeof a === 'string') return { name: { en: a }, price: 0, image: '' };
        if (a && typeof a === 'object') return { name: a.name || { en: 'Add-on' }, price: Number(a.price || 0), image: a.image || '' };
        return null;
      }).filter(Boolean) : [];

      return {
        _id: item._id,
        id: item._id,
        name: typeof item.name === 'object' ? (item.name.en || Object.values(item.name)[0] || 'Unnamed Item') : (item.name || 'Unnamed Item'),
        description: typeof item.description === 'object' ? (item.description.en || Object.values(item.description)[0] || '') : (item.description || ''),
        image: item.image || '',
        restaurant: item.restaurant,
        category: formattedCat,
        subcategory: formattedSub,
        pricing: {
          b2c: {
            mrp: b2cMrp,
            sellingPrice: b2cSelling,
            discountPercent: item.pricing?.b2c?.discountPercent || (b2cMrp > b2cSelling ? Math.round(((b2cMrp - b2cSelling) / b2cMrp) * 100) : 0)
          },
          b2b: {
            sellingPrice: b2bSelling,
            discountPercent: item.pricing?.b2b?.discountPercent || 0
          }
        },
        foodType: normFoodType,
        preparationTime: item.preparationTime || 15,
        available: item.available !== false && item.isAvailable !== false,
        approvalStatus: item.approvalStatus || (item.isApproved ? 'approved' : (item.isRejected ? 'rejected' : 'pending')),
        isApproved: Boolean(item.isApproved),
        isPublished: Boolean(item.isPublished),
        isRejected: Boolean(item.isRejected),
        rejectionReason: item.rejectionReason || '',
        changeRequest: item.changeRequest || '',
        variations: formattedVariations,
        addOns: formattedAddOns,
        submittedAt: item.createdAt,
        pendingUpdate: item.pendingUpdate
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error("Error in getAllMenuItemsAdmin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/menu/:id
 * Retrieve complete details of a specific menu item for review
 */
exports.getMenuItemForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Product.findById(id)
      .populate("restaurant")
      .populate("category")
      .populate("categoryId")
      .populate("subcategoryId")
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const b2cSelling = item.pricing?.b2c?.sellingPrice ?? item.basePrice ?? 0;
    const b2cMrp = item.pricing?.b2c?.mrp ?? item.mrp ?? b2cSelling;
    const b2bSelling = item.pricing?.b2b?.sellingPrice ?? b2cSelling;

    const formatted = {
      ...item,
      b2cSelling,
      b2cMrp,
      b2bSelling,
      pricing: {
        b2c: {
          mrp: b2cMrp,
          sellingPrice: b2cSelling,
          discountPercent: item.pricing?.b2c?.discountPercent || item.discountPercent || 0
        },
        b2b: {
          sellingPrice: b2bSelling,
          discountPercent: item.pricing?.b2b?.discountPercent || 0
        }
      }
    };

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error in getMenuItemForReview:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/menu/:id/approve
 * Admin approves restaurant menu item
 */
exports.approveMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    // Apply pending update if present
    if (product.pendingUpdate) {
      Object.assign(product, product.pendingUpdate);
      product.pendingUpdate = undefined;
      product.pendingUpdateAt = undefined;
    }

    product.approvalStatus = "approved";
    product.isApproved = true;
    product.isPublished = true;
    product.isRejected = false;
    product.approvedBy = req.user ? req.user._id : undefined;
    product.approvedAt = new Date();
    product.approvalNotes = notes || "Approved by admin";

    await product.save();

    // Also update restaurant menuApproved flag and ensure product is in restaurant.product array
    if (product.restaurant) {
      await Restaurant.findByIdAndUpdate(product.restaurant, {
        menuApproved: true,
        menuApprovedAt: new Date(),
        $addToSet: { product: product._id }
      });

      // Also update embedded restaurant.menu item if exists
      const prodName = typeof product.name === 'object' ? (product.name.en || Object.values(product.name)[0] || '') : (product.name || '');
      await Restaurant.updateOne(
        { _id: product.restaurant, "menu.name": prodName },
        { $set: { "menu.$.isApproved": true, "menu.$.isAvailable": true, "menu.$.approvalStatus": "approved" } }
      ).catch(() => {});
    }

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "MENU_ITEM_APPROVED",
      userId: req.user ? req.user._id : product.restaurant,
      userRole: "admin",
      reason: `Admin approved menu item '${product.name?.en || product.name || ''}'`,
    });

    // Send In-App & Push Notification to Restaurant Owner
    try {
      const { sendNotification } = require("../utils/notificationService");
      const User = require("../models/User");
      let targetUserId = null;
      if (product.restaurant) {
        const restDoc = await Restaurant.findById(product.restaurant).lean();
        if (restDoc) {
          if (restDoc.owner) {
            targetUserId = restDoc.owner;
          } else if (restDoc.contactNumber || restDoc.phone) {
            const u = await User.findOne({
              $or: [
                { mobile: restDoc.contactNumber },
                { mobile: restDoc.phone },
                { phone: restDoc.contactNumber },
                { phone: restDoc.phone }
              ]
            }).lean();
            if (u) targetUserId = u._id;
          }
        }
      }

      const prodTitle = typeof product.name === 'object' ? (product.name.en || Object.values(product.name)[0] || 'Menu Item') : (product.name || 'Menu Item');

      if (targetUserId) {
        await sendNotification(
          targetUserId,
          "Menu Item Approved 🎉",
          `Your menu item "${prodTitle}" has been approved by admin and is now live on the app!`,
          {
            type: "menu_item_approved",
            productId: product._id.toString(),
            restaurantId: product.restaurant ? product.restaurant.toString() : "",
            status: "approved"
          }
        );
      }
    } catch (notifErr) {
      console.warn("[Menu Approval Notification Notice]:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Menu item approved successfully and published to User App",
      data: product
    });
  } catch (error) {
    console.error("Error in approveMenuItem:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/menu/:id/reject
 * Admin rejects restaurant menu item
 */
exports.rejectMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    product.approvalStatus = "rejected";
    product.isApproved = false;
    product.isPublished = false;
    product.isRejected = true;
    product.rejectionReason = rejectionReason.trim();
    product.rejectedAt = new Date();

    await product.save();

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "MENU_ITEM_REJECTED",
      userId: req.user ? req.user._id : product.restaurant,
      userRole: "admin",
      reason: `Admin rejected menu item: ${rejectionReason}`,
    });

    // Send In-App & Push Notification to Restaurant Owner
    try {
      const { sendNotification } = require("../utils/notificationService");
      const User = require("../models/User");
      let targetUserId = null;
      if (product.restaurant) {
        const restDoc = await Restaurant.findById(product.restaurant).lean();
        if (restDoc) {
          if (restDoc.owner) {
            targetUserId = restDoc.owner;
          } else if (restDoc.contactNumber || restDoc.phone) {
            const u = await User.findOne({
              $or: [
                { mobile: restDoc.contactNumber },
                { mobile: restDoc.phone },
                { phone: restDoc.contactNumber },
                { phone: restDoc.phone }
              ]
            }).lean();
            if (u) targetUserId = u._id;
          }
        }
      }

      const prodTitle = typeof product.name === 'object' ? (product.name.en || Object.values(product.name)[0] || 'Menu Item') : (product.name || 'Menu Item');

      if (targetUserId) {
        await sendNotification(
          targetUserId,
          "Menu Item Rejected ❌",
          `Your menu item "${prodTitle}" was rejected. Reason: ${rejectionReason}`,
          {
            type: "menu_item_rejected",
            productId: product._id.toString(),
            restaurantId: product.restaurant ? product.restaurant.toString() : "",
            rejectionReason: rejectionReason,
            status: "rejected"
          }
        );
      }
    } catch (notifErr) {
      console.warn("[Menu Rejection Notification Notice]:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Menu item rejected",
      data: product
    });
  } catch (error) {
    console.error("Error in rejectMenuItem:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/menu/:id/request-changes
 * Admin requests changes for a menu item
 */
exports.requestChangesMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { changeRequest } = req.body;

    if (!changeRequest || !changeRequest.trim()) {
      return res.status(400).json({ success: false, message: "Change request details are required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    product.approvalStatus = "changes_requested";
    product.isApproved = false;
    product.isPublished = false;
    product.changeRequest = changeRequest.trim();

    await product.save();

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "MENU_ITEM_CHANGES_REQUESTED",
      userId: req.user ? req.user._id : product.restaurant,
      userRole: "admin",
      reason: `Admin requested changes for menu item: ${changeRequest}`,
    });

    // Send In-App & Push Notification to Restaurant Owner
    try {
      const { sendNotification } = require("../utils/notificationService");
      const User = require("../models/User");
      let targetUserId = null;
      if (product.restaurant) {
        const restDoc = await Restaurant.findById(product.restaurant).lean();
        if (restDoc) {
          if (restDoc.owner) {
            targetUserId = restDoc.owner;
          } else if (restDoc.contactNumber || restDoc.phone) {
            const u = await User.findOne({
              $or: [
                { mobile: restDoc.contactNumber },
                { mobile: restDoc.phone },
                { phone: restDoc.contactNumber },
                { phone: restDoc.phone }
              ]
            }).lean();
            if (u) targetUserId = u._id;
          }
        }
      }

      const prodTitle = typeof product.name === 'object' ? (product.name.en || Object.values(product.name)[0] || 'Menu Item') : (product.name || 'Menu Item');

      if (targetUserId) {
        await sendNotification(
          targetUserId,
          "Changes Requested for Menu Item ⚠️",
          `Admin requested modifications for "${prodTitle}": ${changeRequest}`,
          {
            type: "menu_item_changes_requested",
            productId: product._id.toString(),
            restaurantId: product.restaurant ? product.restaurant.toString() : "",
            changeRequest: changeRequest,
            status: "changes_requested"
          }
        );
      }
    } catch (notifErr) {
      console.warn("[Menu Change Request Notification Notice]:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Change request sent to restaurant",
      data: product
    });
  } catch (error) {
    console.error("Error in requestChangesMenuItem:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
