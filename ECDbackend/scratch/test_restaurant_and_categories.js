const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Require controllers directly to test with latest code
const { adminCreateRestaurant } = require('../controllers/restaurantController');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

async function testControllerDirectly() {
  console.log("==========================================");
  console.log("DIRECTLY TESTING UPDATED RESTAURANT CONTROLLER");
  console.log("==========================================");

  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.kdybcms.mongodb.net/ecdkart");
    console.log("✅ MongoDB Connected directly.");

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminUser) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }

    const testEmail = `royal_kitchen_${Date.now()}@gmail.com`;
    const req = {
      user: adminUser,
      body: {
        ownerName: "Rajesh Kumar",
        ownerEmail: testEmail,
        ownerMobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        ownerPassword: "Password123!",
        name: { en: "Royal Jaipur Kitchen", de: "" },
        description: { en: "Authentic Rajasthani and North Indian Delicacies", de: "" },
        cuisine: ["North Indian", "Rajasthani"],
        brand: "Royal Jaipur",
        email: testEmail,
        contactNumber: "9876543210",
        address: "45 Court Road, Sohna",
        city: "Sohna",
        area: "Sohna Central",
        deliveryTime: 30,
        packagingCharge: 10,
        geofenceRadius: 8,
        deliveryType: "both", // <--- Testing string "both"
        paymentMethods: "Both",
        adminCommission: 10,
        isFreeDelivery: false,
        freeDeliveryContribution: 0,
        isTemporarilyClosed: false,
        location: { type: "Point", coordinates: [77.081, 28.248] }
      }
    };

    let statusCode = 200;
    let responseData = null;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await adminCreateRestaurant(req, res);

    console.log("✅ CONTROLLER EXECUTED! STATUS:", statusCode);
    console.log("   Message:", responseData?.message);
    if (responseData?.restaurant) {
      console.log("   Created ID:", responseData.restaurant._id);
      console.log("   Restaurant Name:", responseData.restaurant.name);
      console.log("   DeliveryType in DB:", responseData.restaurant.deliveryType);
      console.log("   Verification Status:", responseData.restaurant.verificationStatus);
    }

    await mongoose.disconnect();
    console.log("==========================================");
    console.log("TEST SUCCESSFUL!");
    console.log("==========================================");
  } catch (err) {
    console.error("❌ Exception during controller test:", err.message);
    console.error(err.stack);
    await mongoose.disconnect();
  }
}

testControllerDirectly();
