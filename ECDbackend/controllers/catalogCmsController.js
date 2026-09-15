const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");
const { formatProductForUser, formatRestaurantForAdmin } = require("../utils/responseFormatter");

// -------------------------------------------------------------
// RESTAURANT MASTER CONTROL
// -------------------------------------------------------------

exports.getAdminRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .populate("owner", "name email contactNumber")
      .sort({ createdAt: -1 })
      .lean();
    
    const formatted = restaurants.map((r) => formatRestaurantForAdmin(r));
    res.status(200).json({ success: true, count: formatted.length, restaurants: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRestaurantMasterControl = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured, isOnline, isActive, deliveryTime, reason } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const oldState = {
      isFeatured: restaurant.isFeatured,
      isOnline: restaurant.isOnline,
      isActive: restaurant.isActive,
      deliveryTime: restaurant.deliveryTime,
      adminOverride: restaurant.adminOverride,
    };

    if (isFeatured !== undefined) restaurant.isFeatured = isFeatured;
    if (isOnline !== undefined) restaurant.isOnline = isOnline;
    if (isActive !== undefined) restaurant.isActive = isActive;
    if (deliveryTime !== undefined) restaurant.deliveryTime = Number(deliveryTime);

    restaurant.adminOverride = {
      isOverridden: true,
      isFeatured: restaurant.isFeatured,
      isOnline: restaurant.isOnline,
      isActive: restaurant.isActive,
      deliveryTime: restaurant.deliveryTime,
      reason: reason || "Admin master control update",
      updatedBy: req.user?._id,
      updatedAt: new Date(),
    };

    await restaurant.save();

    await AuditLog.log({
      entity: "Restaurant",
      entityId: restaurant._id,
      action: "admin_override",
      userId: req.user?._id || restaurant.owner,
      userRole: "admin",
      changes: {
        field: "master_control",
        oldValue: oldState,
        newValue: {
          isFeatured: restaurant.isFeatured,
          isOnline: restaurant.isOnline,
          isActive: restaurant.isActive,
          deliveryTime: restaurant.deliveryTime,
        },
      },
      reason: reason || "Admin updated restaurant master control parameters",
    });

    res.status(200).json({
      success: true,
      message: "Restaurant master control updated successfully",
      restaurant: formatRestaurantForAdmin(restaurant),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addRestaurantOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, discountPercent, maxDiscount, minOrder, description } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const newOffer = {
      title,
      code: code ? code.toUpperCase() : `REST${Date.now().toString().slice(-4)}`,
      discountPercent: Number(discountPercent || 0),
      maxDiscount: Number(maxDiscount || 0),
      minOrder: Number(minOrder || 0),
      description: description || "",
      isActive: true,
    };

    restaurant.offers.push(newOffer);
    await restaurant.save();

    await AuditLog.log({
      entity: "Restaurant",
      entityId: restaurant._id,
      action: "updated",
      userId: req.user?._id || restaurant.owner,
      userRole: "admin",
      changes: { field: "offers", oldValue: null, newValue: newOffer },
      reason: "Admin added restaurant-specific offer",
    });

    res.status(201).json({ success: true, message: "Offer added successfully", offers: restaurant.offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// CATEGORY & SUBCATEGORY MANAGEMENT
// -------------------------------------------------------------

exports.getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("restaurant", "name")
      .sort({ position: 1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdminCategory = async (req, res) => {
  try {
    const { restaurantId, name, description, image, position, isFeatured, userAppVisible, subcategories } = req.body;

    const category = await Category.create({
      restaurant: restaurantId,
      name: typeof name === "string" ? { en: name } : name,
      description: description || "",
      image: image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
      position: Number(position || 0),
      isFeatured: isFeatured === true,
      userAppVisible: userAppVisible !== false,
      subcategories: Array.isArray(subcategories) ? subcategories : [],
    });

    await AuditLog.log({
      entity: "Category",
      entityId: category._id,
      action: "created",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "category", oldValue: null, newValue: category },
      reason: "Admin created category",
    });

    res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdminCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, position, isActive, isFeatured, userAppVisible, subcategories, reason } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const oldState = {
      name: category.name,
      description: category.description,
      position: category.position,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      userAppVisible: category.userAppVisible,
      subcategories: category.subcategories,
    };

    if (name) category.name = typeof name === "string" ? { en: name } : name;
    if (description !== undefined) category.description = description;
    if (image) category.image = image;
    if (position !== undefined) category.position = Number(position);
    if (isActive !== undefined) category.isActive = isActive;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (userAppVisible !== undefined) category.userAppVisible = userAppVisible;
    if (Array.isArray(subcategories)) category.subcategories = subcategories;

    await category.save();

    await AuditLog.log({
      entity: "Category",
      entityId: category._id,
      action: "updated",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "category", oldValue: oldState, newValue: category },
      reason: reason || "Admin updated category configuration",
    });

    res.status(200).json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderAdminCategories = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, position }
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: "orders array is required" });
    }

    for (const item of orders) {
      await Category.findByIdAndUpdate(item.id, { position: Number(item.position) });
    }

    res.status(200).json({ success: true, message: "Categories reordered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// MENU & ITEM MASTER CONTROL (PRICE OVERRIDE, OOS, VARIATION, ADDONS)
// -------------------------------------------------------------

exports.getAdminProducts = async (req, res) => {
  try {
    const { restaurantId, categoryId, subcategory, search, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (restaurantId) filter.restaurant = restaurantId;
    if (categoryId) filter.category = categoryId;
    if (subcategory) filter.subcategory = subcategory;
    if (search) {
      filter.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("restaurant", "name")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formatted = products.map((p) => formatProductForUser(p));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      products: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdminProduct = async (req, res) => {
  try {
    const {
      restaurantId,
      categoryId,
      subcategory,
      name,
      description,
      image,
      basePrice,
      mrp,
      discountPercent,
      offerPrice,
      preparationTime,
      isVeg,
      variations,
      addOns,
    } = req.body;

    const product = await Product.create({
      restaurant: restaurantId,
      category: categoryId,
      subcategory: subcategory || "",
      name: typeof name === "string" ? { en: name } : name,
      description: typeof description === "string" ? { en: description } : description,
      image: image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
      basePrice: Number(basePrice || 0),
      mrp: Number(mrp || basePrice || 0),
      discountPercent: Number(discountPercent || 0),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      preparationTime: Number(preparationTime || 15),
      isVeg: isVeg !== false,
      available: true,
      isApproved: true,
      variations: Array.isArray(variations) ? variations : [],
      addOns: Array.isArray(addOns) ? addOns : [],
    });

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "created",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "product", oldValue: null, newValue: product },
      reason: "Admin created new menu product",
    });

    res.status(201).json({ success: true, message: "Product created successfully", product: formatProductForUser(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProductPriceOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOverridden, basePrice, mrp, discountPercent, discountAmount, offerPrice, reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const oldOverride = { ...product.adminPriceOverride };

    if (isOverridden === false) {
      // Clear override
      product.adminPriceOverride = { isOverridden: false };
    } else {
      const calcBase = basePrice !== undefined ? Number(basePrice) : (product.adminPriceOverride?.basePrice ?? product.basePrice);
      const calcMrp = mrp !== undefined ? Number(mrp) : (product.adminPriceOverride?.mrp ?? product.mrp ?? calcBase);
      const calcDisc = discountPercent !== undefined ? Number(discountPercent) : (product.adminPriceOverride?.discountPercent ?? product.discountPercent ?? 0);
      const calcDiscAmt = discountAmount !== undefined ? Number(discountAmount) : (calcMrp * (calcDisc / 100));
      const calcOffer = offerPrice !== undefined ? Number(offerPrice) : (calcMrp - calcDiscAmt);

      product.adminPriceOverride = {
        isOverridden: true,
        basePrice: calcBase,
        mrp: calcMrp,
        discountPercent: calcDisc,
        discountAmount: calcDiscAmt,
        offerPrice: calcOffer,
        reason: reason || "Admin price override applied",
        updatedBy: req.user?._id,
        updatedAt: new Date(),
      };
    }

    await product.save();

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "admin_override",
      userId: req.user?._id,
      userRole: "admin",
      changes: {
        field: "price_override",
        oldValue: oldOverride,
        newValue: product.adminPriceOverride,
      },
      reason: reason || "Admin price override modified",
      metadata: {
        originalBasePrice: product.basePrice,
        effectivePrice: product.adminPriceOverride?.basePrice ?? product.basePrice,
      },
    });

    res.status(200).json({
      success: true,
      message: "Price override updated successfully",
      product: formatProductForUser(product),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { outOfStock, available, isVeg, isFeatured, preparationTime, reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const oldStatus = {
      outOfStock: product.outOfStock,
      available: product.available,
      isVeg: product.isVeg,
      isFeatured: product.isFeatured,
      preparationTime: product.preparationTime,
    };

    if (outOfStock !== undefined) product.outOfStock = outOfStock;
    if (available !== undefined) product.available = available;
    if (isVeg !== undefined) product.isVeg = isVeg;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (preparationTime !== undefined) product.preparationTime = Number(preparationTime);

    await product.save();

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "status_change",
      userId: req.user?._id,
      userRole: "admin",
      changes: {
        field: "product_status",
        oldValue: oldStatus,
        newValue: {
          outOfStock: product.outOfStock,
          available: product.available,
          isVeg: product.isVeg,
          isFeatured: product.isFeatured,
          preparationTime: product.preparationTime,
        },
      },
      reason: reason || "Admin updated product status/availability",
    });

    res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      product: formatProductForUser(product),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdminProductFull = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, basePrice, mrp, discountPercent, subcategory, isVeg, variations, addOns } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (name) product.name = typeof name === "string" ? { en: name } : name;
    if (description !== undefined) product.description = typeof description === "string" ? { en: description } : description;
    if (image) product.image = image;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (mrp !== undefined) product.mrp = Number(mrp);
    if (discountPercent !== undefined) product.discountPercent = Number(discountPercent);
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (isVeg !== undefined) product.isVeg = isVeg;
    if (Array.isArray(variations)) product.variations = variations;
    if (Array.isArray(addOns)) product.addOns = addOns;

    await product.save();

    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "updated",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "full_product", oldValue: null, newValue: product },
      reason: "Admin updated product details",
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: formatProductForUser(product),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// AUDIT LOGS RETRIEVAL
// -------------------------------------------------------------

exports.getCmsAuditLogs = async (req, res) => {
  try {
    const { entity, limit = 100 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("userId", "name email role")
      .lean();

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
