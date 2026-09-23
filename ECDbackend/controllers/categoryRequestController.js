const CategoryRequest = require("../models/CategoryRequest");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const AuditLog = require("../models/AuditLog");
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

/**
 * POST /api/vendor/category-requests
 * Restaurant submits a request for a new Category or Subcategory
 */
exports.submitCategoryRequest = async (req, res) => {
  try {
    const { name, type = "main", parentCategoryId, description, reason } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found for this user" });
    }

    if (type === "subcategory") {
      if (!parentCategoryId) {
        return res.status(400).json({ success: false, message: "Parent category is required for subcategory request" });
      }
      const parent = await Category.findById(parentCategoryId);
      if (!parent || parent.type !== "main") {
        return res.status(400).json({ success: false, message: "Invalid parent category" });
      }
    }

    const request = await CategoryRequest.create({
      restaurant: restaurant._id,
      requestedBy: req.user._id,
      name: name.trim(),
      type,
      parentCategoryId: type === "subcategory" ? parentCategoryId : null,
      description: description || "",
      reason: reason || "",
      status: "pending",
    });

    await AuditLog.log({
      entity: "CategoryRequest",
      entityId: request._id,
      action: "CATEGORY_REQUEST_CREATED",
      userId: req.user._id,
      userRole: "restaurant_owner",
      reason: `Restaurant ${restaurant.name?.en || restaurant.name || ''} requested ${type} category '${name}'`,
    });

    return res.status(201).json({
      success: true,
      message: "Category request submitted for Admin review",
      data: request,
    });
  } catch (error) {
    console.error("Error in submitCategoryRequest:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/category-requests
 * Admin views pending / all category requests
 */
exports.getAdminCategoryRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await CategoryRequest.find(filter)
      .populate("restaurant", "name owner")
      .populate("requestedBy", "name email")
      .populate("parentCategoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error in getAdminCategoryRequests:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/category-requests/:id/approve
 * Admin approves restaurant category request -> creates central Category
 */
exports.approveCategoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name: customName, parentCategoryId: customParent } = req.body;

    const categoryReq = await CategoryRequest.findById(id);
    if (!categoryReq) {
      return res.status(404).json({ success: false, message: "Category request not found" });
    }

    if (categoryReq.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${categoryReq.status}` });
    }

    const finalName = (customName || categoryReq.name).trim();
    const finalParent = categoryReq.type === "subcategory" ? (customParent || categoryReq.parentCategoryId) : null;
    const generatedSlug = slugify(finalName);

    // Create central category in Master
    const newCategory = await Category.create({
      name: finalName,
      slug: generatedSlug,
      type: categoryReq.type,
      parentCategoryId: finalParent,
      description: categoryReq.description,
      source: "admin",
      approvalStatus: "approved",
      isActive: true,
      userAppVisible: true,
      restaurantAppVisible: true,
      createdBy: req.user._id,
    });

    categoryReq.status = "approved";
    categoryReq.reviewedBy = req.user._id;
    categoryReq.reviewedAt = new Date();
    categoryReq.createdCategory = newCategory._id;
    await categoryReq.save();

    await AuditLog.log({
      entity: "CategoryRequest",
      entityId: categoryReq._id,
      action: "CATEGORY_REQUEST_APPROVED",
      userId: req.user._id,
      userRole: "admin",
      reason: `Admin approved category request '${finalName}'`,
    });

    return res.status(200).json({
      success: true,
      message: "Category request approved and added to Central Category Master",
      data: categoryReq,
      category: newCategory,
    });
  } catch (error) {
    console.error("Error in approveCategoryRequest:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/category-requests/:id/reject
 * Admin rejects restaurant category request
 */
exports.rejectCategoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const categoryReq = await CategoryRequest.findById(id);
    if (!categoryReq) {
      return res.status(404).json({ success: false, message: "Category request not found" });
    }

    if (categoryReq.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${categoryReq.status}` });
    }

    categoryReq.status = "rejected";
    categoryReq.rejectionReason = rejectionReason.trim();
    categoryReq.reviewedBy = req.user._id;
    categoryReq.reviewedAt = new Date();
    await categoryReq.save();

    await AuditLog.log({
      entity: "CategoryRequest",
      entityId: categoryReq._id,
      action: "CATEGORY_REQUEST_REJECTED",
      userId: req.user._id,
      userRole: "admin",
      reason: `Admin rejected category request: ${rejectionReason}`,
    });

    return res.status(200).json({
      success: true,
      message: "Category request rejected",
      data: categoryReq,
    });
  } catch (error) {
    console.error("Error in rejectCategoryRequest:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
