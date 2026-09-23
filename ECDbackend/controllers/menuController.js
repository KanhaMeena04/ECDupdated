const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const { formatProductForUser } = require("../utils/responseFormatter");
const { getFileUrl } = require("../utils/upload");
const parseIfString = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};
const normalizeTranslation = (value) => {
  if (!value) return null;
  if (typeof value === "string") return { en: value };
  if (typeof value === "object") {
    if (value.en) return value;
    const fallback = value.de || value.ar;
    if (fallback) return { ...value, en: fallback };
  }
  return null;
};
const normalizeNamedList = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map((item) => {
    if (!item) return item;
    if (typeof item.name === "string") {
      return { ...item, name: { en: item.name } };
    }
    if (item.name && typeof item.name === "object" && !item.name.en) {
      const fallback = item.name.de || item.name.ar;
      if (fallback) return { ...item, name: { ...item.name, en: fallback } };
    }
    return item;
  });
};
const getOwnerRestaurant = async (userId) => {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) {
    throw new Error("Restaurant not found for this user");
  }
  if (!restaurant.restaurantApproved) {
    throw new Error("Your restaurant is not approved yet.");
  }
  return restaurant;
};
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.files && req.files.image ? req.files.image[0] : null;
    const image = file
      ? require("../utils/upload").getFileUrl(file)
      : req.body.image;
    const restaurant = await getOwnerRestaurant(req.user._id);
    const normalizedName = normalizeTranslation(name);
    if (!normalizedName || !normalizedName.en) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await Category.create({
      restaurant: restaurant._id,
      name: normalizedName,
      image,
    });
    res.status(201).json({ 
      message: "Category added successfully",
      category
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.addFoodItem = async (req, res) => {
  try {
    const file = req.files && req.files.image ? req.files.image[0] : null;
    const {
      categoryId,
      subcategoryId,
      name,
      description,
      basePrice,
      mrp,
      sellingPrice,
      b2cMrp,
      b2cSellingPrice,
      b2bPrice,
      b2bSellingPrice,
      foodType,
      isVeg,
      preparationTime,
      variations,
      addOns,
    } = req.body;
    const image = file ? getFileUrl(file) : req.body.image;
    const parsedVariations = parseIfString(variations);
    const parsedAddOns = parseIfString(addOns);
    if (req.files && req.files.addOnImages && Array.isArray(parsedAddOns)) {
      req.files.addOnImages.forEach((fileItem, index) => {
        if (parsedAddOns[index]) {
          parsedAddOns[index].image = getFileUrl(fileItem);
        }
      });
    }
    const restaurant = await getOwnerRestaurant(req.user._id);

    // Validate main category from Category Master
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }
    const category = await Category.findById(categoryId);
    if (!category || category.isActive === false) {
      return res.status(404).json({ message: "Category not found or inactive" });
    }

    // Validate subcategory if provided
    let validSubcategory = null;
    if (subcategoryId) {
      validSubcategory = await Category.findById(subcategoryId);
      if (!validSubcategory || validSubcategory.isActive === false) {
        return res.status(404).json({ message: "Subcategory not found or inactive" });
      }
      if (validSubcategory.parentCategoryId && validSubcategory.parentCategoryId.toString() !== category._id.toString()) {
        return res.status(400).json({ message: "Selected subcategory does not belong to selected category." });
      }
    }

    const normalizedName = normalizeTranslation(name);
    if (!normalizedName || !normalizedName.en) {
      return res.status(400).json({ message: "Product name is required" });
    }

    // Calculate B2C and B2B pricing
    const finalB2cSelling = Number(b2cSellingPrice ?? sellingPrice ?? basePrice ?? 0);
    const finalB2cMrp = Number(b2cMrp ?? mrp ?? finalB2cSelling);
    const finalB2bSelling = Number(b2bSellingPrice ?? b2bPrice ?? finalB2cSelling);

    if (finalB2cSelling < 0 || finalB2cMrp < 0 || finalB2bSelling < 0) {
      return res.status(400).json({ message: "Prices cannot be negative" });
    }

    const b2cDiscount = finalB2cMrp > 0 ? Math.max(0, Math.round(((finalB2cMrp - finalB2cSelling) / finalB2cMrp) * 100 * 100) / 100) : 0;
    const b2bDiscount = finalB2cMrp > 0 ? Math.max(0, Math.round(((finalB2cMrp - finalB2bSelling) / finalB2cMrp) * 100 * 100) / 100) : 0;

    const pricingObj = {
      b2c: {
        mrp: finalB2cMrp,
        sellingPrice: finalB2cSelling,
        discountPercent: b2cDiscount
      },
      b2b: {
        sellingPrice: finalB2bSelling,
        discountPercent: b2bDiscount
      }
    };

    const resolvedFoodType = foodType || (isVeg === false || isVeg === "false" ? "non-veg" : "veg");

    let normalizedVariations = normalizeNamedList(parsedVariations || variations) || [];
    if (Array.isArray(normalizedVariations)) {
      normalizedVariations = normalizedVariations.filter((variation) => {
        if (!variation) return false;
        const varName = variation.name;
        if (!varName) return false;
        if (typeof varName === 'string' && !varName.trim()) return false;
        if (typeof varName === 'object' && !varName.en && !varName.de && !varName.ar) return false;
        if (typeof variation.price !== 'number' || variation.price < 0) return false;
        return true;
      });
    }
    let normalizedAddOns = normalizeNamedList(parsedAddOns || addOns) || [];
    if (Array.isArray(normalizedAddOns)) {
      normalizedAddOns = normalizedAddOns.filter((addOn) => {
        if (!addOn) return false;
        const addOnName = addOn.name;
        if (!addOnName) return false;
        if (typeof addOnName === 'string' && !addOnName.trim()) return false;
        if (typeof addOnName === 'object' && !addOnName.en && !addOnName.de && !addOnName.ar) return false;
        if (typeof addOn.price !== 'number' || addOn.price < 0) return false;
        return true;
      });
    }

    const product = await Product.create({
      restaurant: restaurant._id,
      category: category._id,
      categoryId: category._id,
      subcategoryId: validSubcategory ? validSubcategory._id : null,
      subcategory: validSubcategory ? validSubcategory.name : "",
      name: normalizedName,
      description: normalizeTranslation(description),
      basePrice: finalB2cSelling,
      mrp: finalB2cMrp,
      sellingPrice: finalB2cSelling,
      pricing: pricingObj,
      foodType: resolvedFoodType,
      isVeg: resolvedFoodType === "veg",
      preparationTime: Number(preparationTime || 15),
      image,
      variations: normalizedVariations,
      addOns: normalizedAddOns,
      approvalStatus: "pending",
      isApproved: false,
      isPublished: false,
    });

    await Restaurant.findByIdAndUpdate(
      restaurant._id,
      { $addToSet: { product: product._id } },
      { new: true }
    );

    const AuditLog = require("../models/AuditLog");
    await AuditLog.log({
      entity: "Product",
      entityId: product._id,
      action: "MENU_ITEM_CREATED",
      userId: req.user._id,
      userRole: "restaurant_owner",
      reason: `Restaurant submitted menu item '${product.name?.en || product.name}' for approval`,
    });

    res.status(201).json({ 
      message: "Food Item added successfully. Awaiting admin approval.",
      product,
      status: "pending_approval"
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    let restaurant;
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      restaurant = await Restaurant.findById(restaurantId).select(
        "name restaurantApproved isActive menuApproved"
      );
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId }).select(
        "name restaurantApproved isActive menuApproved"
      );
    }
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    if (!restaurant.restaurantApproved || !restaurant.isActive || !restaurant.menuApproved) {
      return res.status(403).json({ message: "Restaurant menu is not active or approved" });
    }

    // Filter products: approved, published, active, not out of stock
    const products = await Product.find({
      restaurant: restaurant._id,
      isApproved: true,
      isPublished: { $ne: false },
      isRejected: { $ne: true },
      available: true,
      outOfStock: { $ne: true }
    })
      .populate("category", "name slug isActive userAppVisible")
      .populate("categoryId", "name slug isActive userAppVisible")
      .populate("subcategoryId", "name slug isActive userAppVisible")
      .lean();

    // Check if authenticated user is authorized for B2B pricing
    const isB2BUser = req.user && (req.user.userType === "b2b" || req.user.userType === "corporate" || req.user.role === "b2b");

    const items = [];
    const menu = {};
    const menuByCategoryId = {};

    products.forEach((p) => {
      const catObj = p.categoryId || p.category;
      if (!catObj || catObj.isActive === false || catObj.userAppVisible === false) {
        return; // Skip if main category is inactive
      }

      const subcatObj = p.subcategoryId;
      if (subcatObj && (subcatObj.isActive === false || subcatObj.userAppVisible === false)) {
        return; // Skip if subcategory is inactive
      }

      const catName = catObj.name?.en || catObj.name || "Uncategorized";
      const b2cSelling = p.pricing?.b2c?.sellingPrice ?? p.sellingPrice ?? p.basePrice ?? 0;
      const b2cMrp = p.pricing?.b2c?.mrp ?? p.mrp ?? b2cSelling;
      const b2bSelling = p.pricing?.b2b?.sellingPrice ?? b2cSelling;

      const formattedItem = {
        _id: p._id,
        id: p._id,
        categoryId: catObj._id,
        subcategoryId: subcatObj ? subcatObj._id : null,
        name: p.name?.en || p.name || "",
        description: p.description ? p.description.en || p.description : "",
        image: p.image,
        basePrice: b2cSelling,
        b2cPrice: b2cSelling,
        sellingPrice: b2cSelling,
        mrp: b2cMrp,
        foodType: p.foodType || (p.isVeg ? "veg" : "non-veg"),
        isVeg: p.isVeg !== false,
        preparationTime: p.preparationTime || 15,
        variations: p.variations || [],
        addOns: p.addOns || [],
        available: p.available !== false,
        category: {
          id: catObj._id,
          _id: catObj._id,
          name: catName,
          slug: catObj.slug
        },
        subcategory: subcatObj ? {
          id: subcatObj._id,
          _id: subcatObj._id,
          name: subcatObj.name?.en || subcatObj.name || "",
          slug: subcatObj.slug
        } : null,
        restaurant: {
          id: restaurant._id,
          _id: restaurant._id,
          name: restaurant.name?.en || restaurant.name || ""
        }
      };

      if (isB2BUser) {
        formattedItem.b2bPrice = b2bSelling;
        formattedItem.pricing = {
          b2c: { mrp: b2cMrp, sellingPrice: b2cSelling },
          b2b: { sellingPrice: b2bSelling }
        };
      } else {
        formattedItem.pricing = {
          b2c: { mrp: b2cMrp, sellingPrice: b2cSelling }
        };
      }

      items.push(formattedItem);

      if (!menu[catName]) menu[catName] = [];
      menu[catName].push(formattedItem);

      const categoryKey = catObj._id.toString();
      if (!menuByCategoryId[categoryKey]) {
        menuByCategoryId[categoryKey] = {
          category: {
            _id: catObj._id,
            id: catObj._id,
            name: catName,
            image: catObj.image,
          },
          items: [],
        };
      }
      menuByCategoryId[categoryKey].items.push(formattedItem);
    });

    res.json({
      success: true,
      count: items.length,
      items,
      menu,
      menuByCategoryId,
      restaurant: {
        _id: restaurant._id,
        id: restaurant._id,
        name: restaurant.name?.en || restaurant.name || ""
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const results = [];
    let hasPendingUpdates = false;
    for (const u of updates) {
      if (!u.productId) {
        results.push({ productId: null, status: "invalid_payload" });
        continue;
      }
      const product = await Product.findOne({
        _id: u.productId,
        restaurant: restaurant._id,
      });
      if (!product) {
        results.push({ productId: u.productId, status: "not_found" });
        continue;
      }
      if (u.available !== undefined) {
        product.available =
          u.available === "true"
            ? true
            : u.available === "false"
              ? false
              : !!u.available;
      }
      const pendingFields = [
        "basePrice",
        "seasonal",
        "seasonTag",
        "name",
        "description",
        "addOns",
        "variations",
        "image",
        "category",
        "isVeg",
      ];
      if (product.isApproved) {
        const pendingUpdate = { ...(product.pendingUpdate || {}) };
        pendingFields.forEach((field) => {
          if (u[field] !== undefined) {
            if (field === "name") {
              const normalized = normalizeTranslation(u.name);
              if (normalized && normalized.en) {
                pendingUpdate.name = normalized;
              }
            } else if (field === "description") {
              const normalized = normalizeTranslation(u.description);
              if (normalized) {
                pendingUpdate.description = normalized;
              }
            } else if (field === "variations") {
              let normalizedVars = normalizeNamedList(u.variations) || [];
              if (Array.isArray(normalizedVars)) {
                normalizedVars = normalizedVars.filter((variation) => {
                  if (!variation) return false;
                  const varName = variation.name;
                  if (!varName) return false;
                  if (typeof varName === 'string' && !varName.trim()) return false;
                  if (typeof varName === 'object' && !varName.en && !varName.de && !varName.ar) return false;
                  if (typeof variation.price !== 'number' || variation.price < 0) return false;
                  return true;
                });
              }
              pendingUpdate.variations = normalizedVars;
            } else if (field === "addOns") {
              let normalizedAddOns = normalizeNamedList(u.addOns) || [];
              if (Array.isArray(normalizedAddOns)) {
                normalizedAddOns = normalizedAddOns.filter((addOn) => {
                  if (!addOn) return false;
                  const addOnName = addOn.name;
                  if (!addOnName) return false;
                  if (typeof addOnName === 'string' && !addOnName.trim()) return false;
                  if (typeof addOnName === 'object' && !addOnName.en && !addOnName.de && !addOnName.ar) return false;
                  if (typeof addOn.price !== 'number' || addOn.price < 0) return false;
                  return true;
                });
              }
              pendingUpdate.addOns = normalizedAddOns;
            } else {
              pendingUpdate[field] = u[field];
            }
          }
        });
        if (Object.keys(pendingUpdate).length > 0) {
          product.pendingUpdate = pendingUpdate;
          product.pendingUpdateAt = new Date();
          hasPendingUpdates = true;
        }
        await product.save();
        results.push({ productId: product._id, status: "pending_approval" });
      } else {
        pendingFields.forEach((field) => {
          if (u[field] === undefined) return;
          if (field === "name") {
            const normalized = normalizeTranslation(u.name);
            if (!normalized || !normalized.en) return;
            product.name = normalized;
          } else if (field === "description") {
            product.description = normalizeTranslation(u.description);
          } else if (field === "variations") {
            let normalizedVars = normalizeNamedList(u.variations) || [];
            if (Array.isArray(normalizedVars)) {
              normalizedVars = normalizedVars.filter((variation) => {
                if (!variation) return false;
                const varName = variation.name;
                if (!varName) return false;
                if (typeof varName === 'string' && !varName.trim()) return false;
                if (typeof varName === 'object' && !varName.en && !varName.de && !varName.ar) return false;
                if (typeof variation.price !== 'number' || variation.price < 0) return false;
                return true;
              });
            }
            product.variations = normalizedVars;
          } else if (field === "addOns") {
            let normalizedAddOns = normalizeNamedList(u.addOns) || [];
            if (Array.isArray(normalizedAddOns)) {
              normalizedAddOns = normalizedAddOns.filter((addOn) => {
                if (!addOn) return false;
                const addOnName = addOn.name;
                if (!addOnName) return false;
                if (typeof addOnName === 'string' && !addOnName.trim()) return false;
                if (typeof addOnName === 'object' && !addOnName.en && !addOnName.de && !addOnName.ar) return false;
                if (typeof addOn.price !== 'number' || addOn.price < 0) return false;
                return true;
              });
            }
            product.addOns = normalizedAddOns;
          } else {
            product[field] = u[field];
          }
        });
        await product.save();
        results.push({ productId: product._id, status: "updated" });
      }
    }
    res.status(200).json({ message: "Bulk update completed", results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.toggleProductAvailability = async (req, res) => {
  try {
    const productId = req.params.id;
    const { available } = req.body;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const product = await Product.findOne({
      _id: productId,
      restaurant: restaurant._id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.available = !!available;
    await product.save();
    res.status(200).json({ message: "Product availability updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { updates, percentage, productIds } = req.body;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const results = [];
    let hasPendingUpdates = false;
    if (Array.isArray(updates) && updates.length > 0) {
      for (const u of updates) {
        if (!u.productId || typeof u.newPrice !== "number") {
          results.push({
            productId: u.productId || null,
            status: "invalid_payload",
          });
          continue;
        }
        const product = await Product.findOne({
          _id: u.productId,
          restaurant: restaurant._id,
        });
        if (!product) {
          results.push({ productId: u.productId, status: "not_found" });
          continue;
        }
        if (product.isApproved) {
          const pendingUpdate = { ...(product.pendingUpdate || {}) };
          pendingUpdate.basePrice = u.newPrice;
          product.pendingUpdate = pendingUpdate;
          product.pendingUpdateAt = new Date();
          await product.save();
          hasPendingUpdates = true;
          results.push({ productId: product._id, status: "pending_approval" });
        } else {
          product.basePrice = u.newPrice;
          await product.save();
          results.push({ productId: product._id, status: "price_updated" });
        }
      }
      return res.status(200).json({ message: "Bulk prices updated", results });
    }
    if (typeof percentage === "number") {
      const query = { restaurant: restaurant._id };
      if (Array.isArray(productIds) && productIds.length > 0)
        query._id = { $in: productIds };
      const products = await Product.find(query);
      for (const p of products) {
        const nextPrice =
          Math.round(p.basePrice * (1 + percentage / 100) * 100) / 100;
        if (p.isApproved) {
          const pendingUpdate = { ...(p.pendingUpdate || {}) };
          pendingUpdate.basePrice = nextPrice;
          p.pendingUpdate = pendingUpdate;
          p.pendingUpdateAt = new Date();
          await p.save();
          hasPendingUpdates = true;
          results.push({ productId: p._id, newPrice: nextPrice, status: "pending_approval" });
        } else {
          p.basePrice = nextPrice;
          await p.save();
          results.push({ productId: p._id, newPrice: p.basePrice });
        }
      }
      return res
        .status(200)
        .json({ message: "Bulk percentage price update applied", results });
    }
    res
      .status(400)
      .json({
        message: "Invalid payload. Provide either updates or percentage.",
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const product = await Product.findOne({
      _id: productId,
      restaurant: restaurant._id,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const file = req.files && req.files.image ? req.files.image[0] : null;
    const updates = { ...req.body };
    if (file) updates.image = getFileUrl(file);
    if (updates.variations !== undefined) {
      updates.variations = parseIfString(updates.variations);
    }
    if (updates.addOns !== undefined) {
      updates.addOns = parseIfString(updates.addOns);
    }
    if (req.files && req.files.addOnImages && Array.isArray(updates.addOns)) {
      req.files.addOnImages.forEach((fileItem, index) => {
        if (updates.addOns[index]) {
          updates.addOns[index].image = getFileUrl(fileItem);
        }
      });
    }
    const allowed = [
      "basePrice",
      "name",
      "description",
      "image",
      "variations",
      "addOns",
      "seasonal",
      "seasonTag",
      "available",
      "category",
    ];
    let hasPendingUpdate = false;
    if (product.isApproved) {
      if (updates.available !== undefined) {
        product.available =
          updates.available === "true"
            ? true
            : updates.available === "false"
              ? false
              : !!updates.available;
      }
      const pendingUpdate = { ...(product.pendingUpdate || {}) };
      const pendingFields = allowed.filter((field) => field !== "available");
      pendingFields.forEach((field) => {
        if (updates[field] !== undefined) {
          if (field === "name") {
            const normalized = normalizeTranslation(updates.name);
            if (normalized && normalized.en) {
              pendingUpdate.name = normalized;
            }
          } else if (field === "description") {
            const normalized = normalizeTranslation(updates.description);
            if (normalized) {
              pendingUpdate.description = normalized;
            }
          } else if (field === "variations") {
            pendingUpdate.variations = normalizeNamedList(updates.variations);
          } else if (field === "addOns") {
            pendingUpdate.addOns = normalizeNamedList(updates.addOns);
          } else {
            pendingUpdate[field] = updates[field];
          }
        }
      });
      if (Object.keys(pendingUpdate).length > 0) {
        product.pendingUpdate = pendingUpdate;
        product.pendingUpdateAt = new Date();
        hasPendingUpdate = true;
      }
    } else {
      allowed.forEach((field) => {
        if (updates[field] === undefined) return;
        if (field === "name") {
          const normalized = normalizeTranslation(updates.name);
          if (!normalized || !normalized.en) return;
          product.name = normalized;
        } else if (field === "description") {
          product.description = normalizeTranslation(updates.description);
        } else if (field === "variations") {
          product.variations = normalizeNamedList(updates.variations);
        } else if (field === "addOns") {
          product.addOns = normalizeNamedList(updates.addOns);
        } else {
          product[field] = updates[field];
        }
      });
    }
    await product.save();
    if (hasPendingUpdate) {
      return res.status(200).json({ 
        message: "Product updated and sent for admin approval. Current menu unaffected.",
        product,
        status: "pending_approval"
      });
    }
    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const product = await Product.findOneAndDelete({
      _id: productId,
      restaurant: restaurant._id,
    });
    if (!product)
      return res
        .status(404)
        .json({ message: "Product not found or not yours" });
    await Restaurant.findByIdAndUpdate(
      restaurant._id,
      { $pull: { product: productId } }, // $pull removes the ID
      { new: true }
    );
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const category = await Category.findOne({
      _id: categoryId,
      restaurant: restaurant._id,
    });
    if (!category)
      return res
        .status(404)
        .json({ message: "Category not found or not yours" });
    const file = req.file; // optional
    const { name } = req.body;
    const image = file
      ? require("../utils/upload").getFileUrl(file)
      : req.body.image;
    if (name !== undefined) {
      const normalizedName = normalizeTranslation(name);
      if (!normalizedName || !normalizedName.en) {
        return res.status(400).json({ message: "Category name is required" });
      }
      category.name = normalizedName;
    }
    if (image !== undefined) category.image = image;
    await category.save();
    res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const existingProducts = await Product.findOne({
      category: categoryId,
      restaurant: restaurant._id,
    });
    if (existingProducts)
      return res
        .status(400)
        .json({ message: "Category has products. Remove them first." });
    await Category.findOneAndDelete({
      _id: categoryId,
      restaurant: restaurant._id,
    });
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getSeasonalMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { tag } = req.query;
    const query = { restaurant: restaurantId, seasonal: true, available: true };
    if (tag) query.seasonTag = tag;
    const products = await Product.find(query);
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
