const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Rider = require('../models/Rider');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    let user = await User.findOne({
      $or: [
        { mobile: '+919179916404' },
        { mobile: '9179916404' },
        { phone: '+919179916404' },
        { phone: '9179916404' },
        { _id: '6ab3b2997e16c0c928b44942' }
      ]
    });

    if (!user) {
      console.log('User Rohit not found by phone, creating user');
      user = await User.create({
        name: 'Rohit',
        mobile: '+919179916404',
        phone: '+919179916404',
        role: 'driver',
        isVerified: true
      });
    } else {
      user.name = 'Rohit';
      user.role = 'driver';
      user.isVerified = true;
      await user.save();
      console.log('Updated user Rohit:', user._id);
    }

    let rider = await Rider.findOne({
      $or: [
        { user: user._id },
        { mobile: '+919179916404' },
        { phone: '+919179916404' }
      ]
    });

    if (!rider) {
      rider = await Rider.create({
        user: user._id,
        name: 'Rohit',
        phone: '+919179916404',
        mobile: '+919179916404',
        email: user.email || 'rohit.rider@ecdkart.com',
        verificationStatus: 'pending',
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: 'inactive',
        bankDetails: {
          upiId: 'rider@okhdfcbank',
          upi: 'rider@okhdfcbank',
          verified: false,
          verificationStatus: 'pending'
        }
      });
      console.log('Created Rider Rohit:', rider._id);
    } else {
      rider.user = user._id;
      rider.name = 'Rohit';
      rider.phone = '+919179916404';
      rider.mobile = '+919179916404';
      rider.verificationStatus = 'pending';
      if (!rider.bankDetails) rider.bankDetails = {};
      rider.bankDetails.upiId = 'rider@okhdfcbank';
      rider.bankDetails.upi = 'rider@okhdfcbank';
      await rider.save();
      console.log('Updated Rider Rohit:', rider._id);
    }

    console.log('Rohit Rider is now successfully registered and in pending status!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fix();
