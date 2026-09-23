const Product = require("../models/Product");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const AuditLog = require("../models/AuditLog");

/**
 * GET /api/admin/menu/pending
 * Retrieve all menu items pending admin review
 */
exports.getPendingMenuItems = async (req, res) => {
  try {
    const { restaurantId, categoryId, subcategoryId, search } = req.query;

    const filter = {
      $or: [
        { approvalStatus: "pending" },
        { isApproved: false, isRejected: { $ne: true } },
        { pendingUpdate: { $exists: true } }
      ]
    };

    if (restaurantId) filter.restaurant = restaurantId;
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;

    if (search) {
      filter["name.en"] = { $regex: search, $options: "i" };
    }

    const items = await Product.find(filter)
      .populate("restaurant", "name email contactNumber restaurantApproved isActive menuApproved")
      .populate("category", "name slug")
      .populate("categoryId", "name slug")
      .populate("subcategoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = items.map(item => {
      const b2cSelling = item.pricing?.b2c?.sellingPrice ?? item.basePrice ?? 0;
      const b2cMrp = item.pricing?.b2c?.mrp ?? item.mrp ?? b2cSelling;
      const b2bSelling = item.pricing?.b2b?.sellingPrice ?? b2cSelling;

      return {
        _id: item._id,
        id: item._id,
        name: item.name?.en || item.name || '',
        description: item.description?.en || item.description || '',
        image: item.image,
        restaurant: item.restaurant,
        category: item.categoryId || item.category,
        subcategory: item.subcategoryId,
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
        },
        foodType: item.foodType || (item.isVeg ? 'veg' : 'non-veg'),
        preparationTime: item.preparationTime || 15,
        available: item.available !== false,
        approvalStatus: item.approvalStatus || (item.isApproved ? 'approved' : 'pending'),
        isApproved: item.isApproved || false,
        isPublished: item.isPublished || false,
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
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    product.approvalNotes = notes || "Approved by admin";

    await product.save();

    // Also update restaurant menuApproved flag if not already set
    await Restaurant.findByIdAndUpdate(product.restaurant, {
      menuApproved: true,
      menuApprovedAt: new Date(),
    });

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "MENU_ITEM_APPROVED",
      userId: req.user._id,
      userRole: "admin",
      reason: `Admin approved menu item '${product.name?.en || product.name || ''}'`,
    });

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
      userId: req.user._id,
      userRole: "admin",
      reason: `Admin rejected menu item: ${rejectionReason}`,
    });

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
      userId: req.user._id,
      userRole: "admin",
      reason: `Admin requested changes for menu item: ${changeRequest}`,
    });

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
