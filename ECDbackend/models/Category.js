const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["main", "subcategory"],
      default: "main",
      required: true,
    },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    startingPrice: {
      type: Number,
      default: 28,
    },
    icon: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    userAppVisible: {
      type: Boolean,
      default: true,
    },
    restaurantAppVisible: {
      type: Boolean,
      default: true,
    },
    seoTitle: {
      type: String,
      default: "",
    },
    seoDescription: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["admin", "restaurant"],
      default: "admin",
    },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending", "rejected", "disabled"],
      default: "approved",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Legacy support field for embedded subcategories
    subcategories: [
      {
        name: { type: String },
        image: { type: String },
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
categorySchema.index({ type: 1, position: 1 });
categorySchema.index({ parentCategoryId: 1, position: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategoryId: 1, slug: 1 });

module.exports = mongoose.model("Category", categorySchema);
