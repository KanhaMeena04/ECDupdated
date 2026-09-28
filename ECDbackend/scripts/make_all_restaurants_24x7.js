const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const Restaurant = require('../models/Restaurant');

const default24x7Timing = {
  monday: { open: "00:00", close: "23:59", isClosed: false },
  tuesday: { open: "00:00", close: "23:59", isClosed: false },
  wednesday: { open: "00:00", close: "23:59", isClosed: false },
  thursday: { open: "00:00", close: "23:59", isClosed: false },
  friday: { open: "00:00", close: "23:59", isClosed: false },
  saturday: { open: "00:00", close: "23:59", isClosed: false },
  sunday: { open: "00:00", close: "23:59", isClosed: false },
  isHoliday: false
};

async function updateAllRestaurantsTo24x7() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MongoDB URI not found in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("Connected to MongoDB!");

    const result = await Restaurant.updateMany(
      {},
      {
        $set: {
          timing: default24x7Timing,
          isTemporarilyClosed: false,
          isActive: true
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount || result.nModified || 0} restaurants to 24x7 timing!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating restaurants to 24x7:", err);
    process.exit(1);
  }
}

updateAllRestaurantsTo24x7();
