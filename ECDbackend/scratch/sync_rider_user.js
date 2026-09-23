const mongoose = require('mongoose');
require('dotenv').config();
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart';
mongoose.connect(mongoUri).then(async () => {
  const User = require('../models/User');
  const Rider = require('../models/Rider');
  
  // Find all users with 9179916404
  const users = await User.find({ $or: [{ phone: /9179916404/ }, { mobile: /9179916404/ }] });
  console.log('Found users:', users.length);

  // Keep the primary user with full profile (Rohit123 - 6ab36dbd7a85b2444a35b48a)
  const primaryUser = users.find(u => u.name === 'Rohit123') || users[0];
  if (primaryUser) {
    // Delete any stub duplicate user created during earlier tests first
    for (const u of users) {
      if (u._id.toString() !== primaryUser._id.toString()) {
        console.log('Removing duplicate test user:', u._id, u.name);
        await User.deleteOne({ _id: u._id });
        await Rider.deleteMany({ user: u._id });
      }
    }

    primaryUser.mobile = '+919179916404';
    primaryUser.phone = '+919179916404';
    primaryUser.pin = '1234';
    primaryUser.role = 'driver';
    await primaryUser.save();
    console.log('Updated primary user:', primaryUser._id, primaryUser.name, primaryUser.phone, 'PIN:', primaryUser.pin);

    // Update rider doc
    const rider = await Rider.findOne({ user: primaryUser._id });
    if (rider) {
      rider.mobile = '+919179916404';
      rider.phone = '+919179916404';
      rider.pin = '1234';
      await rider.save();
      console.log('Updated rider doc:', rider._id, rider.name, rider.phone, 'PIN:', rider.pin);
    }
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
