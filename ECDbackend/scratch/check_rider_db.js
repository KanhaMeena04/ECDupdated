const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Rider = require('../models/Rider');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const user = await User.findOne({
      $or: [{ mobile: /9179916404/ }, { phone: /9179916404/ }]
    });
    console.log('User found:', user ? {
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified
    } : null);

    const riders = await Rider.find({}).populate('user');
    console.log(`Total Riders in DB: ${riders.length}`);
    riders.forEach((r, i) => {
      console.log(`[${i+1}] Rider ID: ${r._id}, Name: ${r.name}, Phone: ${r.phone || r.mobile}, Status: ${r.verificationStatus}, isProfileCompleted: ${r.isProfileCompleted}, User linked: ${r.user?._id || r.user}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
