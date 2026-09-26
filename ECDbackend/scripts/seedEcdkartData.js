const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const dns = require('dns');

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
  try {
    console.log("🌱 Connecting to MongoDB for local seed...");
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 5000,
    };
    await mongoose.connect(mongoURI, options);
    console.log("✅ MongoDB Connected for Seeding.");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("admin123", salt);

    // 1. Seed Users (Admin + 14 Restaurant Owners + Rider + Customer)
    console.log("👤 Seeding Users for 14 Restaurants...");
    await User.findOneAndUpdate(
      { email: "admin@gmail.com" },
      {
        $set: {
          name: "Super Admin",
          mobile: "+919999999999",
          password: defaultPassword,
          role: "admin",
          pin: "1234",
          isVerified: true,
          isDeleted: false,
          isBlocked: false,
        }
      },
      { upsert: true, new: true }
    );

    const rawRestaurantsList = [
      { slug: "the-gourmet-kitchen", name: "The Gourmet Kitchen", ownerName: "Rajesh Gourmet", email: "gourmet@ecdkart.com", mobile: "+919876543210", address: "Shop 12, Main Market, Sohna", rating: 4.5, cuisine: ["North Indian", "Fast Food", "Chinese"] },
      { slug: "pizza-perfection", name: "Pizza Perfection", ownerName: "Vikram Pizza", email: "pizza@ecdkart.com", mobile: "+919876543211", address: "Plot 45, Sector 4, Sohna", rating: 4.6, cuisine: ["Italian", "Pizza", "Pasta"] },
      { slug: "sohna-sweets-snacks", name: "Sohna Sweets & Snacks", ownerName: "Ramesh Sweets", email: "sweets@ecdkart.com", mobile: "+919876543212", address: "Clock Tower Chowk, Sohna", rating: 4.4, cuisine: ["Sweets", "Street Food", "Snacks"] },
      { slug: "royal-biryani-house", name: "Royal Biryani House", ownerName: "Salman Khan", email: "biryani@ecdkart.com", mobile: "+919876543213", address: "88 Royal Plaza, Sohna Road", rating: 4.7, cuisine: ["Hyderabadi Biryani", "Mughlai"] },
      { slug: "chinese-wok-noodles", name: "Chinese Wok & Noodles", ownerName: "Chen Wei", email: "chinesewok@ecdkart.com", mobile: "+919876543214", address: "Food Court Block B, Sohna Market", rating: 4.3, cuisine: ["Asian", "Chinese", "Dimsum"] },
      { slug: "burger-king-delight", name: "Burger King Delight", ownerName: "Sunita Sharma", email: "burgerking@ecdkart.com", mobile: "+919876543215", address: "Shop 3, City Center Mall, Sohna", rating: 4.2, cuisine: ["Burgers", "American", "Fries"] },
      { slug: "tandoori-nights-barbecue", name: "Tandoori Nights & Barbecue", ownerName: "Harpreet Singh", email: "tandoori@ecdkart.com", mobile: "+919876543216", address: "GT Road Near Highway Toll, Sohna", rating: 4.8, cuisine: ["Kebabs", "North Indian", "Barbecue"] },
      { slug: "south-indian-cafe", name: "South Indian Cafe", ownerName: "Venkatesh Iyer", email: "southindian@ecdkart.com", mobile: "+919876543217", address: "14 Temple Street, Sohna", rating: 4.5, cuisine: ["Dosa", "Idli", "South Indian"] },
      { slug: "indori-chaska-poha", name: "Indori Chaska & Poha", ownerName: "Anand Sharma", email: "indori@ecdkart.com", mobile: "+919876543218", address: "Chappan Gali, Sohna", rating: 4.6, cuisine: ["Indori Snacks", "Poha", "Jalebi"] },
      { slug: "punjabi-rasoi", name: "Punjabi Rasoi", ownerName: "Gurmeet Singh", email: "punjabi@ecdkart.com", mobile: "+919876543219", address: "Highway Hub Complex, Sohna", rating: 4.4, cuisine: ["Punjabi", "Parathas", "Lassi"] },
      { slug: "baskin-ice-cream-parlour", name: "Baskin & Ice Cream Parlour", ownerName: "Priya Verma", email: "icecream@ecdkart.com", mobile: "+919876543220", address: "Corner Arcade, Sector 2, Sohna", rating: 4.9, cuisine: ["Desserts", "Ice Cream", "Shakes"] },
      { slug: "momos-corner-cafe", name: "Momos Corner & Cafe", ownerName: "Tenzin Norbu", email: "momos@ecdkart.com", mobile: "+919876543221", address: "Student Hub Market, Sohna", rating: 4.1, cuisine: ["Tibetan", "Momos", "Thukpa"] },
      { slug: "health-salad-hub", name: "Health & Salad Hub", ownerName: "Ananya Roy", email: "health@ecdkart.com", mobile: "+919876543222", address: "Fitness Center Complex, Sohna", rating: 4.5, cuisine: ["Healthy", "Salads", "Juices"] },
      { slug: "chai-sutta-snacks-bar", name: "Chai Sutta & Snacks Bar", ownerName: "Mohit Gupta", email: "chaisutta@ecdkart.com", mobile: "+919876543223", address: "University Gate 1, Sohna", rating: 4.7, cuisine: ["Tea", "Coffee", "Fast Food"] },
    ];

    const ownerUserDocs = {};
    for (const r of rawRestaurantsList) {
      const u = await User.findOneAndUpdate(
        { email: r.email },
        {
          $set: {
            name: r.ownerName,
            mobile: r.mobile,
            password: defaultPassword,
            pin: "1234",
            role: "restaurant_owner",
            isVerified: true,
            isDeleted: false,
          }
        },
        { upsert: true, new: true }
      );
      ownerUserDocs[r.slug] = u;
    }

    const riderUser = await User.findOneAndUpdate(
      { email: "rider1@ecdkart.com" },
      {
        $set: {
          name: "Amit Rider",
          mobile: "+919876543299",
          password: defaultPassword,
          pin: "1234",
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
          mobile: "+919876543298",
          password: defaultPassword,
          pin: "1234",
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

    // 2. Seed All 14 Restaurants
    console.log("🏪 Seeding All 14 Restaurants...");
    const seededRestaurants = {};
    for (const r of rawRestaurantsList) {
      const ownerDoc = ownerUserDocs[r.slug];
      const restPayload = {
        slug: r.slug,
        name: { en: r.name, de: r.name, ar: r.name },
        description: { en: `${r.name} serving delicious ${r.cuisine.join(', ')} in Sohna.`, de: "", ar: "" },
        owner: ownerDoc._id,
        email: r.email,
        contactNumber: r.mobile,
        address: r.address,
        city: "Sohna",
        area: "Central",
        location: { type: "Point", coordinates: [77.081, 28.248] },
        deliveryTime: 25,
        baseDeliveryFee: 30,
        packagingCharge: 10,
        adminCommission: 10,
        cuisine: r.cuisine,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
        bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
        rating: r.rating,
        totalReviews: 85,
        isActive: true,
        isOnline: true,
        restaurantApproved: true,
        menuApproved: true,
        verificationStatus: "verified",
      };
      const doc = await Restaurant.findOneAndUpdate(
        { email: r.email },
        { $set: restPayload },
        { upsert: true, new: true }
      );
      seededRestaurants[r.slug] = doc;
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
