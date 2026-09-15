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
