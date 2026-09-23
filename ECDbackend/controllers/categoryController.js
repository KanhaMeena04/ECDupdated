const Category = require("../models/Category");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");

// Helper slugify
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

// ------------------------------------------------------------------
// PUBLIC / CLIENT APIs
// ------------------------------------------------------------------

/**
 * GET /api/categories/tree
 * Returns full active category tree (Main categories + nested active subcategories)
 */
exports.getCategoriesTree = async (req, res) => {
  try {
    const mainCategories = await Category.find({
      type: "main",
      isActive: true,
      isVisible: { $ne: false },
      userAppVisible: { $ne: false },
    })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    const mainCategoryIds = mainCategories.map((c) => c._id);

    const subcategories = await Category.find({
      type: "subcategory",
      parentCategoryId: { $in: mainCategoryIds },
      isActive: true,
      isVisible: { $ne: false },
      userAppVisible: { $ne: false },
    })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    const subcategoryMap = {};
    subcategories.forEach((sub) => {
      const parentId = sub.parentCategoryId.toString();
      if (!subcategoryMap[parentId]) {
        subcategoryMap[parentId] = [];
      }
      subcategoryMap[parentId].push({
        _id: sub._id,
        id: sub._id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        image: sub.image,
        icon: sub.icon,
        position: sub.position,
        isActive: sub.isActive,
        isFeatured: sub.isFeatured,
      });
    });

    const tree = mainCategories.map((cat) => ({
      _id: cat._id,
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      position: cat.position,
      isActive: cat.isActive,
      isFeatured: cat.isFeatured,
      subcategories: subcategoryMap[cat._id.toString()] || [],
    }));

    return res.status(200).json({
      success: true,
      count: tree.length,
      data: tree,
    });
  } catch (error) {
    console.error("Error in getCategoriesTree:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/categories
 * Returns categories list based on filters
 */
exports.getCategories = async (req, res) => {
  try {
    const { type, parentCategoryId, search, isActive, isFeatured, userAppVisible, restaurantAppVisible } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (parentCategoryId) filter.parentCategoryId = parentCategoryId;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (userAppVisible !== undefined) filter.userAppVisible = userAppVisible === "true";
    if (restaurantAppVisible !== undefined) filter.restaurantAppVisible = restaurantAppVisible === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const categories = await Category.find(filter)
      .populate("parentCategoryId", "name slug")
      .sort({ position: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      categories: categories, // alias for frontend compatibility
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate("parentCategoryId", "name slug").lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let subcategories = [];
    if (category.type === "main") {
      subcategories = await Category.find({ parentCategoryId: category._id }).sort({ position: 1 }).lean();
    }

    return res.status(200).json({
      success: true,
      data: {
        ...category,
        subcategories,
      },
    });
  } catch (error) {
    console.error("Error in getCategoryById:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/categories/:id/subcategories
 */
exports.getSubcategoriesByParent = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategories = await Category.find({
      parentCategoryId: id,
      isActive: true,
      isVisible: { $ne: false },
    })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    console.error("Error in getSubcategoriesByParent:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------------
// ADMIN APIs
// ------------------------------------------------------------------

/**
 * GET /api/admin/categories
 * Detailed Admin view of categories with counts
 */
exports.getAdminCategories = async (req, res) => {
  try {
    const { type, parentCategoryId, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (parentCategoryId) filter.parentCategoryId = parentCategoryId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const categories = await Category.find(filter)
      .populate("parentCategoryId", "name slug")
      .sort({ position: 1, createdAt: -1 })
      .lean();

    // Get subcategory counts for main categories
    const mainCategoryIds = categories.filter((c) => c.type === "main").map((c) => c._id);
    const subCountAggregate = await Category.aggregate([
      { $match: { parentCategoryId: { $in: mainCategoryIds } } },
      { $group: { _id: "$parentCategoryId", count: { $sum: 1 } } },
    ]);

    const subCountMap = {};
    subCountAggregate.forEach((item) => {
      subCountMap[item._id.toString()] = item.count;
    });

    const enriched = categories.map((c) => ({
      ...c,
      subcategoryCount: c.type === "main" ? subCountMap[c._id.toString()] || 0 : 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      categories: enriched,
      data: enriched,
    });
  } catch (error) {
    console.error("Error in getAdminCategories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/categories
 * Create category or subcategory
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      slug: customSlug,
      type = "main",
      parentCategoryId,
      description,
      image,
      icon,
      position,
      isActive,
      isVisible,
      isFeatured,
      userAppVisible,
      restaurantAppVisible,
      seoTitle,
      seoDescription,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const generatedSlug = customSlug ? slugify(customSlug) : slugify(name);

    if (type === "subcategory") {
      if (!parentCategoryId) {
        return res.status(400).json({ success: false, message: "Parent Category is required for subcategories" });
      }
      const parent = await Category.findById(parentCategoryId);
      if (!parent || parent.type !== "main") {
        return res.status(400).json({ success: false, message: "Invalid Parent Category" });
      }

      // Check unique combination: parentCategoryId + slug
      const existingSub = await Category.findOne({
        type: "subcategory",
        parentCategoryId,
        slug: generatedSlug,
      });

      if (existingSub) {
        return res.status(400).json({
          success: false,
          message: `A subcategory with slug '${generatedSlug}' already exists under '${parent.name}'`,
        });
      }
    } else {
      // Main category slug check
      const existingMain = await Category.findOne({
        type: "main",
        slug: generatedSlug,
      });

      if (existingMain) {
        return res.status(400).json({
          success: false,
          message: `A main category with slug '${generatedSlug}' already exists`,
        });
      }
    }

    const category = await Category.create({
      name: name.trim(),
      slug: generatedSlug,
      type,
      parentCategoryId: type === "subcategory" ? parentCategoryId : null,
      description: description || "",
      image: image || null,
      icon: icon || null,
      position: Number(position || 0),
      isActive: isActive !== false,
      isVisible: isVisible !== false,
      isFeatured: isFeatured === true,
      userAppVisible: userAppVisible !== false,
      restaurantAppVisible: restaurantAppVisible !== false,
      seoTitle: seoTitle || "",
      seoDescription: seoDescription || "",
    });

    // Write AuditLog
    await AuditLog.log({
      entity: "Category",
      entityId: category._id,
      action: type === "subcategory" ? "SUBCATEGORY_CREATED" : "CATEGORY_CREATED",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "category", oldValue: null, newValue: category },
      reason: `Admin created ${type} category '${category.name}'`,
    });

    return res.status(201).json({
      success: true,
      message: `${type === "subcategory" ? "Subcategory" : "Category"} created successfully`,
      data: category,
      category,
    });
  } catch (error) {
    console.error("Error in createCategory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/categories/:id
 * Update category or subcategory
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug: customSlug,
      type,
      parentCategoryId,
      description,
      image,
      icon,
      position,
      isActive,
      isVisible,
      isFeatured,
      userAppVisible,
      restaurantAppVisible,
      seoTitle,
      seoDescription,
    } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const oldState = category.toObject();

    if (name) category.name = name.trim();
    if (customSlug || name) {
      category.slug = customSlug ? slugify(customSlug) : slugify(category.name);
    }

    if (type) category.type = type;

    if (category.type === "subcategory") {
      const targetParentId = parentCategoryId || category.parentCategoryId;
      if (!targetParentId) {
        return res.status(400).json({ success: false, message: "Parent Category is required for subcategories" });
      }

      const parent = await Category.findById(targetParentId);
      if (!parent || parent.type !== "main") {
        return res.status(400).json({ success: false, message: "Invalid Parent Category" });
      }
      category.parentCategoryId = targetParentId;

      // Unique check
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        type: "subcategory",
        parentCategoryId: targetParentId,
        slug: category.slug,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A subcategory with slug '${category.slug}' already exists under '${parent.name}'`,
        });
      }
    } else {
      category.parentCategoryId = null;

      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        type: "main",
        slug: category.slug,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A main category with slug '${category.slug}' already exists`,
        });
      }
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (position !== undefined) category.position = Number(position);
    if (isActive !== undefined) category.isActive = isActive;
    if (isVisible !== undefined) category.isVisible = isVisible;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (userAppVisible !== undefined) category.userAppVisible = userAppVisible;
    if (restaurantAppVisible !== undefined) category.restaurantAppVisible = restaurantAppVisible;
    if (seoTitle !== undefined) category.seoTitle = seoTitle;
    if (seoDescription !== undefined) category.seoDescription = seoDescription;

    await category.save();

    await AuditLog.log({
      entity: "Category",
      entityId: category._id,
      action: category.type === "subcategory" ? "SUBCATEGORY_UPDATED" : "CATEGORY_UPDATED",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "category", oldValue: oldState, newValue: category },
      reason: `Admin updated ${category.type} category '${category.name}'`,
    });

    return res.status(200).json({
      success: true,
      message: `${category.type === "subcategory" ? "Subcategory" : "Category"} updated successfully`,
      data: category,
      category,
    });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/admin/categories/:id/status
 */
exports.patchCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isVisible, isFeatured, userAppVisible, restaurantAppVisible } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const oldState = {
      isActive: category.isActive,
      isVisible: category.isVisible,
      isFeatured: category.isFeatured,
      userAppVisible: category.userAppVisible,
      restaurantAppVisible: category.restaurantAppVisible,
    };

    if (isActive !== undefined) category.isActive = isActive;
    if (isVisible !== undefined) category.isVisible = isVisible;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (userAppVisible !== undefined) category.userAppVisible = userAppVisible;
    if (restaurantAppVisible !== undefined) category.restaurantAppVisible = restaurantAppVisible;

    await category.save();

    await AuditLog.log({
      entity: "Category",
      entityId: category._id,
      action: category.type === "subcategory" ? "SUBCATEGORY_STATUS_CHANGED" : "CATEGORY_STATUS_CHANGED",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "status", oldValue: oldState, newValue: { isActive: category.isActive, isVisible: category.isVisible, isFeatured: category.isFeatured } },
      reason: `Admin changed status of category '${category.name}'`,
    });

    return res.status(200).json({
      success: true,
      message: "Category status updated",
      data: category,
      category,
    });
  } catch (error) {
    console.error("Error in patchCategoryStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/categories/reorder
 */
exports.reorderCategories = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, position }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "items array is required" });
    }

    for (const item of items) {
      if (item.id && item.position !== undefined) {
        await Category.findByIdAndUpdate(item.id, { position: Number(item.position) });
      }
    }

    await AuditLog.log({
      entity: "Category",
      entityId: null,
      action: "CATEGORY_REORDERED",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "reorder", oldValue: null, newValue: items },
      reason: "Admin reordered categories",
    });

    return res.status(200).json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error in reorderCategories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/categories/:id
 * Delete safety check (STEP 15): Block deletion if products are using this category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Safety check 1: Check products using this category or subcategory
    const productUsageCount = await Product.countDocuments({
      $or: [{ category: id }, { categoryId: id }, { subcategoryId: id }],
    });

    if (productUsageCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Category cannot be deleted because it is currently used by products.",
        usageCount: productUsageCount,
      });
    }

    // Safety check 2: If main category, check if subcategories exist
    if (category.type === "main") {
      const childCount = await Category.countDocuments({ parentCategoryId: id });
      if (childCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be deleted because it has active subcategories. Delete subcategories first or deactivate the category.",
          subcategoriesCount: childCount,
        });
      }
    }

    await Category.findByIdAndDelete(id);

    await AuditLog.log({
      entity: "Category",
      entityId: id,
      action: category.type === "subcategory" ? "SUBCATEGORY_DELETED" : "CATEGORY_DELETED",
      userId: req.user?._id,
      userRole: "admin",
      changes: { field: "category", oldValue: category, newValue: null },
      reason: `Admin deleted ${category.type} category '${category.name}'`,
    });

    return res.status(200).json({
      success: true,
      message: `${category.type === "subcategory" ? "Subcategory" : "Category"} deleted successfully`,
    });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
