const mongoose = require("mongoose");
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
    sectionKey: "special_dishes",
    title: "Special Dishes",
    subtitle: "Chef's special picks & exclusive signature recipes",
    sectionType: "special_dishes",
    priority: 45,
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
    if (mongoose.connection.readyState !== 1) {
      return; // Skip if database is currently disconnected or reconnecting
    }
    const count = await HomeScreenSection.countDocuments();
    if (count === 0) {
      await HomeScreenSection.insertMany(DEFAULT_SECTIONS);
    }
  } catch (err) {
    console.warn("Seeding default home sections skipped (DB reconnecting):", err.message);
  }
};

const notifyLayoutUpdated = () => {
  try {
    const socketService = require('../services/socketService');
    if (socketService && socketService.emitToAll) {
      socketService.emitToAll('home_cms:updated', { timestamp: new Date() });
    }
  } catch (err) {
    // ignore socket emit errors
  }
};

// Public Endpoint for User App
exports.getPublicHomeScreenSections = async (req, res) => {
  try {
    await ensureDefaultSectionsExist();
    const now = new Date();
    
    // Return all configured sections so client knows which are active vs inactive
    const sections = await HomeScreenSection.find({
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

    notifyLayoutUpdated();
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

    notifyLayoutUpdated();
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

    notifyLayoutUpdated();
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

    notifyLayoutUpdated();
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

    notifyLayoutUpdated();
    res.status(200).json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dynamic Recommended Dishes across nearby restaurants with personalization and shuffle
exports.getRecommendedDishes = async (req, res) => {
  try {
    const Product = require("../models/Product");
    const Restaurant = require("../models/Restaurant");
    const Order = require("../models/Order");
    const { isRestaurantOpenNow } = require("../utils/restaurantAvailability");

    const restaurants = await Restaurant.find({
      isActive: true,
      restaurantApproved: { $ne: false },
      isTemporarilyClosed: { $ne: true }
    }).select("name image address city area location deliveryTime timing").lean();

    const openRestaurants = restaurants.filter(r => isRestaurantOpenNow(r));
    const targetRestaurants = openRestaurants.length > 0 ? openRestaurants : restaurants;
    if (targetRestaurants.length === 0) {
      return res.status(200).json({ success: true, count: 0, dishes: [] });
    }

    const restMap = new Map();
    targetRestaurants.forEach(r => restMap.set(r._id.toString(), r));
    const restIds = targetRestaurants.map(r => r._id);

    // Personalization: check recent orders if user is authenticated
    let preferredCategories = [];
    let isVegOnly = false;
    if (req.user) {
      if (req.user.foodPreference === 'veg') isVegOnly = true;
      try {
        const recentOrders = await Order.find({ user: req.user._id, status: { $in: ['delivered', 'completed'] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate({ path: 'items.product', select: 'category categoryId foodType isVeg' })
          .lean();
        
        recentOrders.forEach(ord => {
          (ord.items || []).forEach(it => {
            if (it.product) {
              if (it.product.category) preferredCategories.push(it.product.category.toString());
              if (it.product.categoryId) preferredCategories.push(it.product.categoryId.toString());
            }
          });
        });
      } catch (err) {
        // ignore order fetch error
      }
    }

    const queryFilter = {
      restaurant: { $in: restIds },
      isApproved: true,
      approvalStatus: { $ne: "rejected" },
      isRejected: { $ne: true },
      available: { $ne: false }
    };
    if (isVegOnly) {
      queryFilter.isVeg = true;
    }

    const products = await Product.find(queryFilter)
      .populate("category", "name slug")
      .populate("categoryId", "name slug")
      .lean();

    if (!products.length) {
      return res.status(200).json({ success: true, count: 0, dishes: [] });
    }

    // Format dishes cleanly without injecting hardcoded dummy fallback images
    const formattedDishes = products.map(p => {
      const rest = restMap.get(p.restaurant.toString()) || {};
      const restName = typeof rest.name === 'object' ? (rest.name?.en || Object.values(rest.name)[0] || 'Restaurant') : (rest.name || 'Restaurant');
      const catObj = p.categoryId || p.category;
      const catName = catObj ? (typeof catObj === 'string' ? catObj : (catObj.name?.en || catObj.name || 'Main Course')) : 'Main Course';
      const pName = typeof p.name === 'object' ? (p.name?.en || Object.values(p.name)[0] || 'Dish') : (p.name || 'Dish');
      const pDesc = typeof p.description === 'object' ? (p.description?.en || Object.values(p.description)[0] || '') : (p.description || '');

      const sellPrice = p.pricing?.b2c?.sellingPrice ?? p.sellingPrice ?? p.basePrice ?? 0;
      const mrpPrice = p.pricing?.b2c?.mrp ?? p.mrp ?? sellPrice;
      const basePrice = p.basePrice ?? sellPrice;

      const rawImg = (p.image || "").trim();

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        name: pName,
        description: pDesc,
        price: sellPrice,
        sellingPrice: sellPrice,
        mrp: mrpPrice,
        basePrice: basePrice,
        discountPercent: mrpPrice > sellPrice ? Math.round(((mrpPrice - sellPrice) / mrpPrice) * 100) : 0,
        imageUrl: rawImg,
        image: rawImg,
        foodType: p.foodType || (p.isVeg ? 'veg' : 'non-veg'),
        isVeg: p.isVeg !== false,
        category: catName,
        categoryId: catObj?._id ? catObj._id.toString() : null,
        portionType: p.portionType || 'none',
        portions: p.portions || null,
        variations: p.variations || [],
        addOns: p.addOns || [],
        rating: 4.5,
        restaurantId: rest._id ? rest._id.toString() : p.restaurant.toString(),
        restaurantName: restName,
        restaurantAddress: rest.address || '',
        deliveryTime: rest.deliveryTime || 25,
        isPreferred: preferredCategories.length > 0 && (
          (p.category && preferredCategories.includes(p.category.toString())) ||
          (p.categoryId && preferredCategories.includes(p.categoryId.toString()))
        )
      };
    });

    // Score & Shuffle: Put preferred categories slightly higher, then random shuffle
    formattedDishes.sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return 0.5 - Math.random();
    });

    const resultDishes = formattedDishes.slice(0, 24);

    return res.status(200).json({
      success: true,
      count: resultDishes.length,
      dishes: resultDishes
    });
  } catch (error) {
    console.error("getRecommendedDishes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Dynamic Special Dishes from Admin CMS
exports.getSpecialDishes = async (req, res) => {
  try {
    const Product = require("../models/Product");
    const Restaurant = require("../models/Restaurant");
    const HomeScreenSection = require("../models/HomeScreenSection");
    const { isRestaurantOpenNow } = require("../utils/restaurantAvailability");

    const specialSec = await HomeScreenSection.findOne({ sectionKey: "special_dishes", isActive: true });

    const restaurants = await Restaurant.find({
      isActive: true,
      restaurantApproved: { $ne: false },
      isTemporarilyClosed: { $ne: true }
    }).select("name image address city area location deliveryTime timing").lean();

    const openRestaurants = restaurants.filter(r => isRestaurantOpenNow(r));
    const targetRestaurants = openRestaurants.length > 0 ? openRestaurants : restaurants;
    if (targetRestaurants.length === 0) {
      return res.status(200).json({ success: true, count: 0, dishes: [] });
    }

    const restMap = new Map();
    targetRestaurants.forEach(r => restMap.set(r._id.toString(), r));
    const restIds = targetRestaurants.map(r => r._id);

    const metadataDishIds = (specialSec?.metadata?.dishIds || specialSec?.metadata?.itemIds || []).filter(Boolean);

    const queryFilter = {
      restaurant: { $in: restIds },
      isApproved: true,
      approvalStatus: { $ne: "rejected" },
      isRejected: { $ne: true },
      available: { $ne: false }
    };

    if (metadataDishIds.length > 0) {
      queryFilter._id = { $in: metadataDishIds };
    } else {
      queryFilter.$or = [
        { isFeatured: true },
        { seasonal: true },
        { discountPercent: { $gt: 10 } },
        { 'adminPriceOverride.isOverridden': true }
      ];
    }

    let products = await Product.find(queryFilter)
      .populate("category", "name slug")
      .populate("categoryId", "name slug")
      .lean();

    if (!products.length) {
      delete queryFilter.$or;
      products = await Product.find(queryFilter)
        .populate("category", "name slug")
        .populate("categoryId", "name slug")
        .limit(25)
        .lean();
    }

    const formattedDishes = products.map(p => {
      const rest = restMap.get(p.restaurant.toString()) || {};
      const restName = typeof rest.name === 'object' ? (rest.name?.en || Object.values(rest.name)[0] || 'Restaurant') : (rest.name || 'Restaurant');
      const catObj = p.categoryId || p.category;
      const catName = catObj ? (typeof catObj === 'string' ? catObj : (catObj.name?.en || catObj.name || 'Special')) : 'Special';
      const pName = typeof p.name === 'object' ? (p.name?.en || Object.values(p.name)[0] || 'Dish') : (p.name || 'Dish');
      const pDesc = typeof p.description === 'object' ? (p.description?.en || Object.values(p.description)[0] || '') : (p.description || '');

      const sellPrice = p.pricing?.b2c?.sellingPrice ?? p.sellingPrice ?? p.basePrice ?? 0;
      const mrpPrice = p.pricing?.b2c?.mrp ?? p.mrp ?? sellPrice;
      const basePrice = p.basePrice ?? sellPrice;

      const rawImg = (p.image || "").trim();

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        name: pName,
        description: pDesc,
        price: sellPrice,
        sellingPrice: sellPrice,
        mrp: mrpPrice,
        basePrice: basePrice,
        discountPercent: mrpPrice > sellPrice ? Math.round(((mrpPrice - sellPrice) / mrpPrice) * 100) : 0,
        imageUrl: rawImg,
        image: rawImg,
        foodType: p.foodType || (p.isVeg ? 'veg' : 'non-veg'),
        isVeg: p.isVeg !== false,
        category: catName,
        categoryId: catObj?._id ? catObj._id.toString() : null,
        portionType: p.portionType || 'none',
        portions: p.portions || null,
        variations: p.variations || [],
        addOns: p.addOns || [],
        rating: 4.8,
        restaurantId: rest._id ? rest._id.toString() : p.restaurant.toString(),
        restaurantName: restName,
        restaurantAddress: rest.address || '',
        deliveryTime: rest.deliveryTime || 20,
        badgeText: p.seasonTag || 'CHEF SPECIAL'
      };
    });

    formattedDishes.sort(() => 0.5 - Math.random());
    const resultDishes = formattedDishes.slice(0, 24);

    return res.status(200).json({
      success: true,
      count: resultDishes.length,
      dishes: resultDishes,
      section: specialSec || null
    });
  } catch (error) {
    console.error("getSpecialDishes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

