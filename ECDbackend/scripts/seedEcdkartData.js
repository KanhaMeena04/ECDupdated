const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// Configure Cloudflare primary DNS and Google fallback DNS for reliable MongoDB SRV lookups
const primaryDNS = ['1.1.1.1', '1.0.0.1'];
const fallbackDNS = ['8.8.4.4', '8.8.8.8'];
dns.setServers(primaryDNS);

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Product = require('../models/Product');
const HomeScreenSection = require('../models/HomeScreenSection');
const Banner = require('../models/Banner');
const Promocode = require('../models/Promocode');
const AdminSetting = require('../models/AdminSetting');
const Rider = require('../models/Rider');

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";

async function seedData() {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL SAFETY GUARD: seedEcdkartData.js MUST NOT be executed in production environment (NODE_ENV=production)!");
    return;
  }
  try {
    console.log("🌱 Connecting to MongoDB for local seed...");
    const options = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };
    try {
      await mongoose.connect(mongoURI, options);
    } catch (firstErr) {
      console.log("🔄 Switching to fallback DNS (Google)...");
      dns.setServers(fallbackDNS);
      await mongoose.connect(mongoURI, options);
    }
    console.log("✅ MongoDB Connected for Seeding.");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("admin123", salt);

    // 1. Seed / Ensure Admin, Owner, Rider and Customer Users
    console.log("👤 Seeding Users...");
    const adminUser = await User.findOneAndUpdate(
      { email: "admin@gmail.com" },
      {
        $set: {
          name: "Super Admin",
          mobile: "+919999999999",
          password: defaultPassword,
          role: "admin",
          isVerified: true,
          isDeleted: false,
          isBlocked: false,
        }
      },
      { upsert: true, new: true }
    );

    const ownerUser1 = await User.findOneAndUpdate(
      { email: "owner1@ecdkart.com" },
      {
        $set: {
          name: "Rajesh Gourmet",
          mobile: "+919876543210",
          password: defaultPassword,
          role: "restaurant_owner",
          isVerified: true,
          isDeleted: false,
        }
      },
      { upsert: true, new: true }
    );

    const ownerUser2 = await User.findOneAndUpdate(
      { email: "owner2@ecdkart.com" },
      {
        $set: {
          name: "Vikram Pizza",
          mobile: "+919876543211",
          password: defaultPassword,
          role: "restaurant_owner",
          isVerified: true,
          isDeleted: false,
        }
      },
      { upsert: true, new: true }
    );

    const riderUser = await User.findOneAndUpdate(
      { email: "rider1@ecdkart.com" },
      {
        $set: {
          name: "Amit Rider",
          mobile: "+919876543212",
          password: defaultPassword,
          role: "rider",
          isVerified: true,
          isDeleted: false,
        }
      },
      { upsert: true, new: true }
    );

    await Rider.findOneAndUpdate(
      { user: riderUser._id },
      {
        $set: {
          user: riderUser._id,
          workCity: "Sohna",
          status: "active",
          isOnline: true,
          vehicle: { type: "bike", number: "HR26AB1234", vehicleVerified: true }
        }
      },
      { upsert: true, new: true }
    );

    const customerUser = await User.findOneAndUpdate(
      { email: "customer@ecdkart.com" },
      {
        $set: {
          name: "Kanha Customer",
          mobile: "+919876543213",
          password: defaultPassword,
          role: "customer",
          isVerified: true,
          isDeleted: false,
          savedAddresses: [
            {
              label: "Home",
              addressLine: "Flat 101, Green Heights, Sohna",
              city: "Sohna",
              zipCode: "122103",
              location: { type: "Point", coordinates: [77.080, 28.245] },
              isDefault: true
            }
          ]
        }
      },
      { upsert: true, new: true }
    );

    // 2. Seed Restaurants
    console.log("🏪 Seeding Restaurants...");
    const restaurantsData = [
      {
        slug: "the-gourmet-kitchen",
        name: { en: "The Gourmet Kitchen", de: "The Gourmet Kitchen", ar: "ذا جورميه كيتشن" },
        description: { en: "Multi-Cuisine Delights, Fast Food, & Authentic North Indian Thalis", de: "", ar: "" },
        owner: ownerUser1._id,
        email: "gourmet@ecdkart.com",
        contactNumber: "+919876543210",
        address: "Shop 12, Main Market, Sohna",
        city: "Sohna",
        area: "Main Market",
        location: { type: "Point", coordinates: [77.081, 28.248] },
        deliveryTime: 25,
        baseDeliveryFee: 30,
        packagingCharge: 10,
        adminCommission: 15,
        cuisine: ["North Indian", "Fast Food", "Chinese", "Desserts"],
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
        bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
        rating: 4.5,
        totalReviews: 128,
        isActive: true,
        isOnline: true,
        restaurantApproved: true,
        menuApproved: true,
      },
      {
        slug: "pizza-perfection",
        name: { en: "Pizza Perfection", de: "Pizza Perfection", ar: "بيتزا بيرفيكشن" },
        description: { en: "Wood-fired Cheeseburst Pizzas, Garlic Bread, & Italian Pastas", de: "", ar: "" },
        owner: ownerUser2._id,
        email: "pizza@ecdkart.com",
        contactNumber: "+919876543211",
        address: "Plot 45, Sector 4, Sohna",
        city: "Sohna",
        area: "Sector 4",
        location: { type: "Point", coordinates: [77.085, 28.250] },
        deliveryTime: 20,
        baseDeliveryFee: 35,
        packagingCharge: 15,
        adminCommission: 18,
        cuisine: ["Italian", "Pizza", "Pasta", "Beverages"],
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
        bannerImage: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800",
        rating: 4.6,
        totalReviews: 210,
        isActive: true,
        isOnline: true,
        restaurantApproved: true,
        menuApproved: true,
      },
      {
        slug: "sohna-sweets-snacks",
        name: { en: "Sohna Sweets & Snacks", de: "Sohna Sweets", ar: "حلويات سوهنا" },
        description: { en: "Fresh Indori Poha, Hot Samosa, Jalebi, & Traditional Indian Sweets", de: "", ar: "" },
        owner: ownerUser1._id,
        email: "sweets@ecdkart.com",
        contactNumber: "+919876543212",
        address: "Clock Tower Chowk, Sohna",
        city: "Sohna",
        area: "Clock Tower",
        location: { type: "Point", coordinates: [77.082, 28.249] },
        deliveryTime: 15,
        baseDeliveryFee: 25,
        packagingCharge: 5,
        adminCommission: 12,
        cuisine: ["Sweets", "Street Food", "Breakfast", "Snacks"],
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
        bannerImage: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
        rating: 4.4,
        totalReviews: 95,
        isActive: true,
        isOnline: true,
        restaurantApproved: true,
        menuApproved: true,
      }
    ];

    const seededRestaurants = {};
    for (const rest of restaurantsData) {
      const doc = await Restaurant.findOneAndUpdate(
        { email: rest.email },
        { $set: rest },
        { upsert: true, new: true }
      );
      seededRestaurants[rest.slug] = doc;
    }

    // 3. Seed Categories
    console.log("📁 Seeding Categories...");
    const categoriesData = [
      { slug: "pizza", name: "Pizza", image: "assets/static/c3.png", position: 1, isFeatured: true },
      { slug: "burgers", name: "Burgers", image: "assets/static/c2.png", position: 2, isFeatured: true },
      { slug: "biryani", name: "Biryani", image: "assets/static/c5.png", position: 3, isFeatured: true },
      { slug: "cakes", name: "Cakes & Desserts", image: "assets/static/c1.png", position: 4, isFeatured: true },
      { slug: "chicken", name: "Chicken Specialties", image: "assets/static/c4.png", position: 5, isFeatured: true },
      { slug: "sandwich", name: "Sandwich & Snacks", image: "assets/static/c6.png", position: 6, isFeatured: true },
      { slug: "chinese", name: "Noodles & Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400", position: 7, isFeatured: false },
      { slug: "beverages", name: "Beverages & Shakes", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400", position: 8, isFeatured: false },
    ];

    const seededCategories = {};
    for (const cat of categoriesData) {
      const doc = await Category.findOneAndUpdate(
        { "name.en": cat.name, restaurant: seededRestaurants["the-gourmet-kitchen"]._id },
        {
          $set: {
            restaurant: seededRestaurants["the-gourmet-kitchen"]._id,
            name: { en: cat.name },
            image: cat.image,
            position: cat.position,
            isFeatured: cat.isFeatured,
            userAppVisible: true,
            isActive: true,
          }
        },
        { upsert: true, new: true }
      );
      seededCategories[cat.slug] = doc;
    }

    // 4. Seed Products
    console.log("🍲 Seeding Products...");
    const gourmetRest = seededRestaurants["the-gourmet-kitchen"];
    const pizzaRest = seededRestaurants["pizza-perfection"];
    const sweetsRest = seededRestaurants["sohna-sweets-snacks"];

    const productsData = [
      // Gourmet Kitchen Products
      {
        restaurant: gourmetRest._id,
        category: seededCategories["pizza"]._id,
        name: { en: "Margherita Pizza", de: "Margherita Pizza", ar: "بيتزا مارجريتا" },
        description: { en: "Classic mozzarella cheese pizza with rich tomato sauce & fresh basil leaves", de: "", ar: "" },
        image: "assets/static/pizza.jpg",
        basePrice: 299,
        mrp: 399,
        discountPercent: 25,
        sellingPrice: 299,
        preparationTime: 20,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },
      {
        restaurant: gourmetRest._id,
        category: seededCategories["chinese"]._id,
        name: { en: "Schezwan Hakka Noodles", de: "Schezwan Noodles", ar: "نودلز سشوان" },
        description: { en: "Indo-Chinese style wok-tossed spicy noodles with bell peppers & spring onions", de: "", ar: "" },
        image: "assets/static/b3.jpg",
        basePrice: 179,
        mrp: 229,
        discountPercent: 22,
        sellingPrice: 179,
        preparationTime: 15,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },
      {
        restaurant: gourmetRest._id,
        category: seededCategories["cakes"]._id,
        name: { en: "Chocolate Lava Cake", de: "Choco Lava Cake", ar: "كيك الشوكولاتة" },
        description: { en: "Warm fudgy chocolate cake filled with molten chocolate lava core", de: "", ar: "" },
        image: "assets/static/cake5.jpg",
        basePrice: 149,
        mrp: 189,
        discountPercent: 21,
        sellingPrice: 149,
        preparationTime: 10,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },

      // Pizza Perfection Products
      {
        restaurant: pizzaRest._id,
        category: seededCategories["pizza"]._id,
        name: { en: "Double Cheese Burst Pizza", de: "Double Cheese Burst", ar: "بيتزا الجبن المزدوج" },
        description: { en: "Loaded with double layer of liquid cheese, cheddar, & herbs", de: "", ar: "" },
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
        basePrice: 349,
        mrp: 449,
        discountPercent: 22,
        sellingPrice: 349,
        preparationTime: 20,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },
      {
        restaurant: pizzaRest._id,
        category: seededCategories["burgers"]._id,
        name: { en: "Crispy Chicken Burger", de: "Chicken Burger", ar: "برجر دجاج مقرمش" },
        description: { en: "Juicy fried chicken patty with iceberg lettuce, tomato & mayo in sesame bun", de: "", ar: "" },
        image: "assets/static/b2.jpg",
        basePrice: 199,
        mrp: 249,
        discountPercent: 20,
        sellingPrice: 199,
        preparationTime: 15,
        isVeg: false,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },

      // Sohna Sweets & Snacks Products
      {
        restaurant: sweetsRest._id,
        category: seededCategories["sandwich"]._id,
        name: { en: "Indori Poha", de: "Indori Poha", ar: "بوهة إندوري" },
        description: { en: "Authentic steamed flattened rice garnished with sev, pomegranate, & jeeravan masala", de: "", ar: "" },
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
        basePrice: 25,
        mrp: 45,
        discountPercent: 44,
        sellingPrice: 25,
        preparationTime: 8,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },
      {
        restaurant: sweetsRest._id,
        category: seededCategories["sandwich"]._id,
        name: { en: "Hot Crispy Samosa (2 Pcs)", de: "Hot Samosa", ar: "سمبوسة حارة" },
        description: { en: "Golden fried pastry stuffed with spiced potatoes & peas, served with mint chutney", de: "", ar: "" },
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
        basePrice: 30,
        mrp: 40,
        discountPercent: 25,
        sellingPrice: 30,
        preparationTime: 5,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      },
      {
        restaurant: sweetsRest._id,
        category: seededCategories["cakes"]._id,
        name: { en: "Kesari Jalebi (250g)", de: "Kesari Jalebi", ar: "زلابية بالزعفران" },
        description: { en: "Crispy saffron syrup dipped jalebi made fresh in pure desi ghee", de: "", ar: "" },
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600",
        basePrice: 70,
        mrp: 90,
        discountPercent: 22,
        sellingPrice: 70,
        preparationTime: 10,
        isVeg: true,
        available: true,
        outOfStock: false,
        isFeatured: true,
        isApproved: true,
      }
    ];

    for (const prod of productsData) {
      await Product.findOneAndUpdate(
        { "name.en": prod.name.en, restaurant: prod.restaurant },
        { $set: prod },
        { upsert: true, new: true }
      );
    }

    // 5. Seed HomeScreenSections
    console.log("📱 Seeding Home Screen Sections...");
    const homeSectionsData = [
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
        subtitle: "Delicious meals delivered fast from nearby kitchens in Sohna",
        sectionType: "restaurant_list",
        priority: 50,
        isActive: true,
      },
    ];

    for (const sec of homeSectionsData) {
      await HomeScreenSection.findOneAndUpdate(
        { sectionKey: sec.sectionKey },
        { $set: sec },
        { upsert: true, new: true }
      );
    }

    // 6. Seed Banners
    console.log("🎨 Seeding Banners...");
    const bannersData = [
      {
        title: "20% OFF Lower Prices Every Day",
        subtitle: "Save up to 40-60% compared to other apps",
        imageUrl: "assets/static/bb.png",
        targetScreen: "restaurant_list",
        position: 1,
        isActive: true,
      },
      {
        title: "Fresh Grocery & Daily Essentials",
        subtitle: "Superfast delivery in Sohna",
        imageUrl: "assets/static/grocery.jpg",
        targetScreen: "category",
        position: 2,
        isActive: true,
      }
    ];

    for (const ban of bannersData) {
      await Banner.findOneAndUpdate(
        { title: ban.title },
        { $set: ban },
        { upsert: true, new: true }
      );
    }

    // 7. Seed Promocodes / Coupons
    console.log("🎟️ Seeding Promocodes...");
    const couponsData = [
      {
        code: "WELCOME50",
        offerType: "percent",
        discountValue: 50,
        maxDiscountAmount: 100,
        minOrderValue: 199,
        availableFrom: new Date("2026-01-01"),
        expiryDate: new Date("2027-12-31"),
        status: "active",
      },
      {
        code: "ECD20",
        offerType: "percent",
        discountValue: 20,
        maxDiscountAmount: 150,
        minOrderValue: 299,
        availableFrom: new Date("2026-01-01"),
        expiryDate: new Date("2027-12-31"),
        status: "active",
      },
      {
        code: "FREEDEL",
        offerType: "free_delivery",
        discountValue: 0,
        minOrderValue: 300,
        availableFrom: new Date("2026-01-01"),
        expiryDate: new Date("2027-12-31"),
        status: "active",
      }
    ];

    for (const promo of couponsData) {
      await Promocode.findOneAndUpdate(
        { code: promo.code },
        { $set: promo },
        { upsert: true, new: true }
      );
    }

    // 8. Seed Admin Settings
    console.log("⚙️ Seeding Central Admin Settings...");
    await AdminSetting.findOneAndUpdate(
      {},
      {
        $set: {
          deliveryFeeConfig: {
            baseFee: 30,
            baseDistanceKm: 3,
            maxDeliveryRadiusKm: 15,
            isFreeDeliveryEnabled: true,
            freeDeliveryThreshold: 500,
            slabs: [
              { minDistanceKm: 0, maxDistanceKm: 3, fee: 30, perKmFee: 0, isActive: true },
              { minDistanceKm: 3, maxDistanceKm: 5, fee: 40, perKmFee: 0, isActive: true },
              { minDistanceKm: 5, maxDistanceKm: 8, fee: 60, perKmFee: 0, isActive: true },
              { minDistanceKm: 8, maxDistanceKm: 12, fee: 80, perKmFee: 0, isActive: true },
            ]
          },
          surgeConfig: {
            peakHour: { enabled: false, startTime: "19:00", endTime: "22:00", fee: 15 },
            nightCharge: { enabled: false, startTime: "23:00", endTime: "05:00", fee: 20 },
            rainCharge: { enabled: false, fee: 25 },
            highDemandCharge: { enabled: false, fee: 20 }
          },
          commissionConfig: {
            globalCommissionPercent: 20,
            categoryCommissions: []
          },
          platformFeeConfig: {
            enabled: true,
            type: "fixed",
            fee: 5,
            minFee: 2,
            maxFee: 20
          },
          packagingFeeConfig: {
            enabled: true,
            globalPackagingFee: 10
          }
        }
      },
      { upsert: true, new: true }
    );

    console.log("🎉 Seeding Completed Successfully! All demo data is live in local MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seedData();
