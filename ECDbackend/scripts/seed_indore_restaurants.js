const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

const indoreRestaurants = [
  {
    name: { en: "Indore Test Kitchen", de: "Indore Test Kitchen", ar: "" },
    description: { en: "Authentic Indori Poha, Sev, Thali and North Indian Specialties", de: "", ar: "" },
    email: "indore.test.kitchen@ecdkart.com",
    contactNumber: "9826011111",
    address: "Scheme 54, Vijay Nagar, Indore",
    city: "Indore",
    area: "Vijay Nagar",
    location: { type: "Point", coordinates: [75.8900, 22.7500] }, // [lng, lat]
    deliveryTime: 20,
    geofenceRadius: 15,
    cuisine: ["Indori", "North Indian", "Snacks"],
    isActive: true,
    restaurantApproved: true,
    menuApproved: true,
    verificationStatus: "verified",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
    bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000",
  },
  {
    name: { en: "Vijay Nagar Food House", de: "Vijay Nagar Food House", ar: "" },
    description: { en: "Delicious South Indian Dosas, Uttapam, and Fast Food", de: "", ar: "" },
    email: "vijaynagar.fh@ecdkart.com",
    contactNumber: "9826022222",
    address: "AB Road, Near C21 Mall, Vijay Nagar, Indore",
    city: "Indore",
    area: "Vijay Nagar",
    location: { type: "Point", coordinates: [75.8920, 22.7530] }, // [lng, lat]
    deliveryTime: 25,
    geofenceRadius: 15,
    cuisine: ["South Indian", "Fast Food", "Chinese"],
    isActive: true,
    restaurantApproved: true,
    menuApproved: true,
    verificationStatus: "verified",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
    bannerImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
  },
  {
    name: { en: "Palasia Family Restaurant", de: "Palasia Family Restaurant", ar: "" },
    description: { en: "Premium Veg Thali, Paneer Delights, and Desi Desserts", de: "", ar: "" },
    email: "palasia.family@ecdkart.com",
    contactNumber: "9826033333",
    address: "Greater Kailash Road, Old Palasia, Indore",
    city: "Indore",
    area: "Old Palasia",
    location: { type: "Point", coordinates: [75.8850, 22.7240] }, // [lng, lat]
    deliveryTime: 30,
    geofenceRadius: 15,
    cuisine: ["North Indian", "Thali", "Sweets"],
    isActive: true,
    restaurantApproved: true,
    menuApproved: true,
    verificationStatus: "verified",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000",
  }
];

async function seedIndoreRestaurants() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecdkart';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Indore seeding...");

    let owner = await User.findOne({ role: { $in: ["admin", "restaurant_owner", "vendor"] } });
    if (!owner) {
      owner = await User.findOne({});
    }

    if (!owner) {
      console.error("No user found to assign as owner for restaurants!");
      process.exit(1);
    }

    let category = await Category.findOne({});
    if (!category) {
      category = await Category.create({
        name: { en: "General", de: "", ar: "" },
        slug: "general",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
        isActive: true,
      });
    }

    console.log(`Using owner: ${owner.email} (${owner._id}), category: ${category._id}`);

    for (const restData of indoreRestaurants) {
      let rest = await Restaurant.findOne({ "name.en": restData.name.en });
      if (rest) {
        console.log(`Updating existing restaurant: ${restData.name.en}`);
        Object.assign(rest, restData, { owner: owner._id });
        await rest.save();
      } else {
        console.log(`Creating new restaurant: ${restData.name.en}`);
        rest = await Restaurant.create({
          ...restData,
          owner: owner._id,
        });
      }

      const prodCount = await Product.countDocuments({ restaurant: rest._id });
      if (prodCount === 0) {
        const prod = await Product.create({
          restaurant: rest._id,
          category: category._id,
          name: { en: `Special Dish from ${restData.name.en}`, de: "", ar: "" },
          description: { en: "Chef special fresh preparation made with premium ingredients.", de: "", ar: "" },
          basePrice: 199,
          mrp: 299,
          sellingPrice: 199,
          discountPercent: 33,
          preparationTime: 15,
          isVeg: true,
          available: true,
          outOfStock: false,
          isFeatured: true,
          isApproved: true,
          adminApproved: true,
          inventory: { isAvailable: true, stockQuantity: 100 }
        });
        rest.product = [prod._id];
        await rest.save();
        console.log(`Created sample product for ${restData.name.en}`);
      }
    }

    console.log("SUCCESS: 3 Indore restaurants successfully seeded in MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding Indore restaurants:", err);
    process.exit(1);
  }
}

seedIndoreRestaurants();
