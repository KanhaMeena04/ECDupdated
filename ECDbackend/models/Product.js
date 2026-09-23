const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subcategory: { type: String, default: '' },
    name: {
      en: { type: String, required: true },
      de: { type: String },
      ar: { type: String },
    },
    description: {
      en: { type: String },
      de: { type: String },
      ar: { type: String },
    },
    image: { type: String },
    basePrice: { type: Number, required: true },
    mrp: { type: Number },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    offerPrice: { type: Number },
    sellingPrice: { type: Number },
    preparationTime: { type: Number, default: 15 },
    outOfStock: { type: Boolean, default: false },
    subcategory: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    adminPriceOverride: {
      isOverridden: { type: Boolean, default: false },
      basePrice: { type: Number },
      mrp: { type: Number },
      discountPercent: { type: Number },
      discountAmount: { type: Number },
      offerPrice: { type: Number },
      reason: { type: String },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date }
    },
    pricing: {
      b2c: {
        mrp: { type: Number },
        sellingPrice: { type: Number },
        discountPercent: { type: Number, default: 0 }
      },
      b2b: {
        sellingPrice: { type: Number },
        discountPercent: { type: Number, default: 0 }
      }
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'egg'],
      default: 'veg'
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending'
    },
    isPublished: { type: Boolean, default: false },
    changeRequest: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isVeg: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false }, // Admin approval flag - default pending
    isRejected: { type: Boolean, default: false }, // Reject flag to hide from pending
    rejectedAt: { type: Date },
    seasonal: { type: Boolean, default: false }, // Mark item as part of seasonal menu
    seasonTag: { type: String }, // e.g., "Summer Specials",
    approvedAt: { type: Date },
    approvalNotes: { type: String },
    pendingUpdate: {
      type: {
        name: { en: String, de: String, ar: String },
        description: { en: String, de: String, ar: String },
        image: { type: String },
        basePrice: { type: Number },
        isVeg: { type: Boolean },
        seasonal: { type: Boolean },
        seasonTag: { type: String },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        variations: [
          {
            name: {
              en: { type: String, required: true },
              de: { type: String },
              ar: { type: String },
            },
            price: { type: Number, required: true, min: 0 },
          },
        ],
        addOns: [
          {
            name: {
              en: { type: String, required: true },
              de: { type: String },
              ar: { type: String },
            },
            price: { type: Number, required: true, min: 0 },
            image: { type: String },
          },
        ],
      },
      default: undefined,
    },
    pendingUpdateAt: { type: Date },
    variations: [
      {
        name: {
          en: { type: String, required: true },
          de: { type: String },
          ar: { type: String },
        },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    addOns: [
      {
        name: {
          en: { type: String, required: true },
          de: { type: String },
          ar: { type: String },
        },
        price: { type: Number, required: true, min: 0 },
        image: { type: String },
      },
    ],
  },
  { timestamps: true, minimize: true }
);
module.exports = mongoose.model("Product", productSchema);
