const HomeScreenSection = require("../models/HomeScreenSection");
const Banner = require("../models/Banner");

const DEFAULT_SECTIONS = [
  {
    sectionKey: "banners_carousel",
    title: "Special Offers & Discounts",
    subtitle: "Top deals curated for you",
    sectionType: "banner_carousel",
    priority: 10,
    isActive: true,
  },
  {
    sectionKey: "food_categories",
    title: "What's on your mind?",
    subtitle: "Explore by top food categories",
    sectionType: "category_grid",
    priority: 20,
    isActive: true,
  },
  {
    sectionKey: "ecdkart_comparison",
    title: "ECDkart vs OTHER APPS",
    subtitle: "40-60% LOWER PRICES - Save on every delivery",
    sectionType: "comparison_banner",
    priority: 30,
    isActive: true,
  },
  {
    sectionKey: "recommended_dishes",
    title: "Recommended for You",
    subtitle: "Based on top ratings, offers & popular orders",
    sectionType: "recommended_dishes",
    priority: 40,
    isActive: true,
  },
  {
    sectionKey: "explore_restaurants",
    title: "Explore Restaurants",
    subtitle: "Delicious meals delivered fast from nearby kitchens",
    sectionType: "restaurant_list",
    priority: 50,
    isActive: true,
  },
];

// Helper to ensure default sections exist in DB
const ensureDefaultSectionsExist = async () => {
  try {
    const count = await HomeScreenSection.countDocuments();
    if (count === 0) {
      await HomeScreenSection.insertMany(DEFAULT_SECTIONS);
    }
  } catch (err) {
    console.error("Error seeding default home sections:", err);
  }
};

// Public Endpoint for User App
exports.getPublicHomeScreenSections = async (req, res) => {
  try {
    await ensureDefaultSectionsExist();
    const now = new Date();
    
    const sections = await HomeScreenSection.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ priority: 1, createdAt: 1 })
      .lean();

    const banners = await Banner.find({ isActive: true }).sort({ position: 1 }).lean();

    res.status(200).json({
      success: true,
      sections,
      banners,
    });
  } catch (error) {
    console.error("getPublicHomeScreenSections error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch home screen CMS configuration",
      error: error.message,
    });
  }
};

// Admin Endpoints
exports.getAllHomeScreenSectionsAdmin = async (req, res) => {
  try {
    await ensureDefaultSectionsExist();
    const sections = await HomeScreenSection.find().sort({ priority: 1, createdAt: 1 });
    res.status(200).json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHomeScreenSection = async (req, res) => {
  try {
    const { sectionKey, title, subtitle, sectionType, imageUrl, ctaText, ctaAction, ctaTarget, priority, isActive, startDate, endDate, metadata } = req.body;
    
    if (!sectionKey || !title) {
      return res.status(400).json({ success: false, message: "Section key and title are required" });
    }

    const existing = await HomeScreenSection.findOne({ sectionKey });
    if (existing) {
      return res.status(400).json({ success: false, message: "A section with this key already exists" });
    }

    const section = await HomeScreenSection.create({
      sectionKey,
      title,
      subtitle: subtitle || "",
      sectionType: sectionType || "restaurant_list",
      imageUrl: imageUrl || "",
      ctaText: ctaText || "",
      ctaAction: ctaAction || "none",
      ctaTarget: ctaTarget || "",
      priority: priority !== undefined ? priority : 100,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null,
      metadata: metadata || {},
    });

    res.status(201).json({ success: true, message: "Section created successfully", section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateHomeScreenSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await HomeScreenSection.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    res.status(200).json({ success: true, message: "Section updated successfully", section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleHomeScreenSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await HomeScreenSection.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    section.isActive = !section.isActive;
    await section.save();

    res.status(200).json({ success: true, message: `Section ${section.isActive ? 'enabled' : 'disabled'} successfully`, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reorderHomeScreenSections = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, priority }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Items array required" });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { priority: item.priority } },
      },
    }));

    await HomeScreenSection.bulkWrite(bulkOps);
    const updatedSections = await HomeScreenSection.find().sort({ priority: 1 });

    res.status(200).json({ success: true, message: "Sections reordered successfully", sections: updatedSections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteHomeScreenSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await HomeScreenSection.findByIdAndDelete(id);
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    res.status(200).json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
