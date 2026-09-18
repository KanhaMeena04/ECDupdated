const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Promocode = require('../models/Promocode');
const User = require('../models/User');

const categoriesData = [
  { slug: "pizza", name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
  { slug: "burgers", name: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" },
  { slug: "biryani", name: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600" },
  { slug: "cakes-desserts", name: "Cakes & Desserts", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600" },
  { slug: "north-indian", name: "North Indian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600" },
  { slug: "south-indian", name: "South Indian", image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600" },
  { slug: "chinese", name: "Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600" },
  { slug: "snacks", name: "Snacks", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600" },
  { slug: "beverages", name: "Beverages", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600" }
];

const bannersData = [
  {
    title: "50% OFF on Top Indori Kitchens",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
    type: "static",
    isActive: true,
    position: 1
  },
  {
    title: "Superfast Delivery in Vijay Nagar & Palasia",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    type: "static",
    isActive: true,
    position: 2
  },
  {
    title: "Fresh South Indian & Street Food Specials",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200",
    type: "static",
    isActive: true,
    position: 3
  }
];

const promocodesData = [
  {
    title: "Flat 50% OFF",
    description: "Get 50% off on your first food order in Indore",
    code: "WELCOME50",
    offerType: "percent",
    discountValue: 50,
    maxDiscountAmount: 100,
    minOrderValue: 199,
    availableFrom: new Date('2026-01-01'),
    expiryDate: new Date('2027-12-31'),
    status: "active"
  },
  {
    title: "Free Delivery",
    description: "Free delivery on all orders above ₹149",
    code: "FREEDEL",
    offerType: "free_delivery",
    discountValue: 40,
    minOrderValue: 149,
    availableFrom: new Date('2026-01-01'),
    expiryDate: new Date('2027-12-31'),
    status: "active"
  },
  {
    title: "Indore Special ₹100 OFF",
    description: "Save ₹100 on orders above ₹399",
    code: "INDORE100",
    offerType: "amount",
    discountValue: 100,
    minOrderValue: 399,
    availableFrom: new Date('2026-01-01'),
    expiryDate: new Date('2027-12-31'),
    status: "active"
  }
];

async function seedFullE2EData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecdkart';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Full E2E Seeding...");

    let owner = await User.findOne({ role: { $in: ["admin", "restaurant_owner", "vendor"] } });
    if (!owner) owner = await User.findOne({});
    if (!owner) {
      console.error("No user found!");
      process.exit(1);
    }

    // 1. Seed Categories
    console.log("Seeding Category collection...");
    const categoryMap = {};
    for (const catData of categoriesData) {
      let cat = await Category.findOne({ slug: catData.slug });
      if (!cat) {
        cat = await Category.create({
          restaurant: owner._id,
          name: { en: catData.name, de: "", ar: "" },
          slug: catData.slug,
          image: catData.image,
          isActive: true,
          userAppVisible: true
        });
      } else {
        cat.image = catData.image;
        cat.isActive = true;
        cat.userAppVisible = true;
        await cat.save();
      }
      categoryMap[catData.slug] = cat._id;
    }

    // 2. Seed Banners
    console.log("Seeding Banner collection...");
    await Banner.deleteMany({});
    await Banner.insertMany(bannersData);

    // 3. Seed Promocodes
    console.log("Seeding Promocode collection...");
    for (const pData of promocodesData) {
      await Promocode.findOneAndUpdate(
        { code: pData.code },
        pData,
        { upsert: true, new: true }
      );
    }

    // 4. Seed 3 Indore Restaurants & Products
    console.log("Seeding 3 Indore Restaurants & Products...");

    const restaurantsList = [
      {
        name: { en: "Indore Test Kitchen", de: "Indore Test Kitchen", ar: "" },
        description: { en: "Authentic Indori Poha, Sev, Thali and North Indian Specialties", de: "", ar: "" },
        email: "indore.test.kitchen@ecdkart.com",
        contactNumber: "9826011111",
        address: "Scheme 54, Vijay Nagar, Indore",
        city: "Indore",
        area: "Vijay Nagar",
        location: { type: "Point", coordinates: [75.8900, 22.7500] },
        deliveryTime: 20,
        geofenceRadius: 15,
        cuisine: ["Indori", "North Indian", "Snacks"],
        isActive: true,
        restaurantApproved: true,
        menuApproved: true,
        verificationStatus: "verified",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
        bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000",
        products: [
          {
            name: "Indori Jeeravan Poha",
            description: "Steamed flattened rice topped with ratlami sev, onions & fresh pomegranate",
            basePrice: 49,
            mrp: 89,
            catSlug: "snacks",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"
          },
          {
            name: "Crispy Sev Samosa (2 Pcs)",
            description: "Golden spiced potato samosa topped with Indori sev and sweet tamarind chutney",
            basePrice: 39,
            mrp: 69,
            catSlug: "snacks",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"
          },
          {
            name: "Special Malwa Thali",
            description: "Paneer butter masala, dal bafla, 4 butter chapati, rice, gulab jamun & salad",
            basePrice: 249,
            mrp: 349,
            catSlug: "north-indian",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600"
          },
          {
            name: "Desi Ghee Jalebi (250g)",
            description: "Hot crisp saffron jalebi fried in pure desi ghee",
            basePrice: 120,
            mrp: 180,
            catSlug: "cakes-desserts",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
          }
        ]
      },
      {
        name: { en: "Vijay Nagar Food House", de: "Vijay Nagar Food House", ar: "" },
        description: { en: "Delicious South Indian Dosas, Uttapam, and Fast Food", de: "", ar: "" },
        email: "vijaynagar.fh@ecdkart.com",
        contactNumber: "9826022222",
        address: "AB Road, Near C21 Mall, Vijay Nagar, Indore",
        city: "Indore",
        area: "Vijay Nagar",
        location: { type: "Point", coordinates: [75.8920, 22.7530] },
        deliveryTime: 25,
        geofenceRadius: 15,
        cuisine: ["South Indian", "Fast Food", "Chinese"],
        isActive: true,
        restaurantApproved: true,
        menuApproved: true,
        verificationStatus: "verified",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
        bannerImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
        products: [
          {
            name: "Butter Masala Dosa",
            description: "Crispy rice crepe roasted with butter & filled with spiced potato masala",
            basePrice: 129,
            mrp: 179,
            catSlug: "south-indian",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600"
          },
          {
            name: "Schezwan Veg Noodles",
            description: "Spicy wok-tossed noodles with crunchy bell peppers, cabbage & spring onions",
            basePrice: 149,
            mrp: 199,
            catSlug: "chinese",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600"
          },
          {
            name: "Double Cheese Loaded Burger",
            description: "Crispy veg patty with double cheddar slice, lettuce, tomato & chipotle mayo",
            basePrice: 139,
            mrp: 189,
            catSlug: "burgers",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
          },
          {
            name: "Cold Coffee with Ice Cream",
            description: "Thick creamy blended coffee topped with dark chocolate syrup & vanilla scoop",
            basePrice: 99,
            mrp: 149,
            catSlug: "beverages",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"
          }
        ]
      },
      {
        name: { en: "Palasia Family Restaurant", de: "Palasia Family Restaurant", ar: "" },
        description: { en: "Premium Veg Thali, Paneer Delights, and Desi Desserts", de: "", ar: "" },
        email: "palasia.family@ecdkart.com",
        contactNumber: "9826033333",
        address: "Greater Kailash Road, Old Palasia, Indore",
        city: "Indore",
        area: "Old Palasia",
        location: { type: "Point", coordinates: [75.8850, 22.7240] },
        deliveryTime: 30,
        geofenceRadius: 15,
        cuisine: ["North Indian", "Thali", "Sweets"],
        isActive: true,
        restaurantApproved: true,
        menuApproved: true,
        verificationStatus: "verified",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
        bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000",
        products: [
          {
            name: "Shahi Paneer Handi",
            description: "Cottage cheese cubes cooked in rich cashew gravy flavoured with cardamom & saffron",
            basePrice: 219,
            mrp: 299,
            catSlug: "north-indian",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600"
          },
          {
            name: "Hyderabadi Dum Veg Biryani",
            description: "Fragrant basmati rice dum cooked with marinated vegetables, mint & saffron",
            basePrice: 199,
            mrp: 279,
            catSlug: "biryani",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600"
          },
          {
            name: "Gourmet Cheese Pizza (8 inch)",
            description: "Hand-tossed crust topped with mozzarella, process cheese & oregano",
            basePrice: 249,
            mrp: 349,
            catSlug: "pizza",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600"
          },
          {
            name: "Molten Lava Chocolate Cake",
            description: "Warm gooey chocolate cake with molten core",
            basePrice: 119,
            mrp: 169,
            catSlug: "cakes-desserts",
            isVeg: true,
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
          }
        ]
      }
    ];

    for (const rData of restaurantsList) {
      let rest = await Restaurant.findOne({ "name.en": rData.name.en });
      const { products, ...restFields } = rData;

      if (rest) {
        Object.assign(rest, restFields, { owner: owner._id });
        await rest.save();
      } else {
        rest = await Restaurant.create({
          ...restFields,
          owner: owner._id,
        });
      }

      // Add products
      const prodIds = [];
      for (const p of products) {
        const catId = categoryMap[p.catSlug] || categoryMap["north-indian"];
        let prod = await Product.findOne({ restaurant: rest._id, "name.en": p.name });
        const prodPayload = {
          restaurant: rest._id,
          category: catId,
          name: { en: p.name, de: "", ar: "" },
          description: { en: p.description, de: "", ar: "" },
          basePrice: p.basePrice,
          mrp: p.mrp,
          sellingPrice: p.basePrice,
          discountPercent: Math.round(((p.mrp - p.basePrice) / p.mrp) * 100),
          image: p.image,
          preparationTime: 15,
          isVeg: p.isVeg,
          available: true,
          outOfStock: false,
          isFeatured: true,
          isApproved: true,
          adminApproved: true,
          inventory: { isAvailable: true, stockQuantity: 100 }
        };

        if (prod) {
          Object.assign(prod, prodPayload);
          await prod.save();
        } else {
          prod = await Product.create(prodPayload);
        }
        prodIds.push(prod._id);
      }

      rest.product = prodIds;
      await rest.save();
      console.log(`Updated ${rData.name.en} with ${prodIds.length} products.`);
    }

    // 5. Ensure 2dsphere index exists
    await Restaurant.collection.createIndex({ location: '2dsphere' });
    console.log("Verified 2dsphere index on location field.");

    console.log("\n=======================================================");
    console.log("SUCCESS: FULL E2E DATA SUCCESSFULLY SEEDED IN MONGODB!");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding Full E2E Data:", err);
    process.exit(1);
  }
}

seedFullE2EData();
