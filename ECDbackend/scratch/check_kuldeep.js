const mongoose = require('mongoose');
const User = require('../models/User');
const Rider = require('../models/Rider');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ mobile: /9691686211/ });
    console.log('User in DB:', user ? { _id: user._id, name: user.name, mobile: user.mobile, isVerified: user.isVerified, role: user.role } : 'Not found');
    
    if (user) {
      const rider = await Rider.findOne({ user: user._id });
      console.log('Rider in DB:', rider ? { _id: rider._id, name: rider.name, verificationStatus: rider.verificationStatus, riderVerified: rider.riderVerified, vehicle: rider.vehicle?.vehicleApproval } : 'Not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
