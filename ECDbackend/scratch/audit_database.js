const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function auditDatabase() {
  console.log("==========================================");
  console.log("RUNNING DATABASE RUNTIME AUDIT");
  console.log("==========================================");

  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.kdybcms.mongodb.net/ecdkart");
    console.log("✅ Connected to MongoDB Atlas.");

    const Restaurant = require('../models/Restaurant');
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    const MasterCategory = require('../models/MasterCategory');
    const Rider = require('../models/Rider');
    const Order = require('../models/Order');

    // 1. Audit Restaurants
    const totalRestaurants = await Restaurant.countDocuments();
    const restaurants = await Restaurant.find();
    console.log(`\n--- RESTAURANTS (Total: ${totalRestaurants}) ---`);

    let invalidGeoCount = 0;
    let nullGeoCount = 0;
    let validGeoCount = 0;

    restaurants.forEach((r, idx) => {
      const coords = r.location?.coordinates;
      let geoStatus = "VALID";
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        geoStatus = "MISSING/INVALID_ARRAY";
        invalidGeoCount++;
      } else if (coords[0] === null || coords[1] === null || isNaN(coords[0]) || isNaN(coords[1])) {
        geoStatus = "CONTAINS_NULL_OR_NAN";
        nullGeoCount++;
      } else {
        validGeoCount++;
      }
      console.log(`[${idx + 1}] ID: ${r._id} | Name: ${r.name?.en || r.name} | City: ${r.city} | Verification: ${r.verificationStatus} | Approved: ${r.restaurantApproved} | MenuApproved: ${r.menuApproved} | GeoStatus: ${geoStatus} | Coords: ${JSON.stringify(coords)}`);
    });

    console.log(`Summary: Valid Geo: ${validGeoCount}, Null Geo: ${nullGeoCount}, Invalid Geo: ${invalidGeoCount}`);

    // 2. Audit Users
    const totalUsers = await User.countDocuments();
    console.log(`\n--- USERS (Total: ${totalUsers}) ---`);

    // 3. Audit Categories
    const totalCat = await Category.countDocuments();
    const totalMasterCat = await MasterCategory.countDocuments();
    console.log(`\n--- CATEGORIES ---`);
    console.log(`Category Collection Count: ${totalCat}`);
    console.log(`MasterCategory Collection Count: ${totalMasterCat}`);

    // 4. Audit Products
    const totalProducts = await Product.countDocuments();
    console.log(`\n--- PRODUCTS (Total: ${totalProducts}) ---`);

    // 5. Audit Riders
    const totalRiders = await Rider.countDocuments();
    console.log(`\n--- RIDERS (Total: ${totalRiders}) ---`);

    // 6. Audit Orders
    const totalOrders = await Order.countDocuments();
    console.log(`\n--- ORDERS (Total: ${totalOrders}) ---`);

    await mongoose.disconnect();
    console.log("\n==========================================");
    console.log("DATABASE AUDIT COMPLETED");
    console.log("==========================================");

  } catch (err) {
    console.error("❌ DB Audit Error:", err.message);
    await mongoose.disconnect();
  }
}

auditDatabase();
