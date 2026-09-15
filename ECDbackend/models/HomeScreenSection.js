const mongoose = require("mongoose");

const homeScreenSectionSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    sectionType: {
      type: String,
      enum: [
        "banner_carousel",
        "category_grid",
        "comparison_banner",
        "recommended_dishes",
        "restaurant_list",
        "promotional_card",
        "custom_banner",
      ],
      default: "restaurant_list",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    ctaText: {
      type: String,
      default: "",
    },
    ctaAction: {
      type: String,
      enum: ["none", "category", "restaurant", "product", "link", "screen"],
      default: "none",
    },
    ctaTarget: {
      type: String,
      default: "",
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeScreenSection", homeScreenSectionSchema);
