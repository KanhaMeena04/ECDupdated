const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Rider = require('../models/Rider');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('=== FINDING USER ROHIT ===');
  const users = await User.find({
    $or: [
      { name: { $regex: 'Rohit', $options: 'i' } },
      { mobile: { $regex: '9179916404', $options: 'i' } }
    ]
  }).lean();
  console.log('Found users:', users);

  console.log('=== FINDING RIDER DOCUMENTS ===');
  const riders = await Rider.find({}).populate('user').lean();
  console.log('Total Rider documents in DB:', riders.length);
  riders.forEach(r => {
    console.log(' - Rider ID:', r._id, '| Name:', r.name, '| Phone:', r.phone || r.mobile, '| User:', r.user ? (r.user.name + ' / ' + r.user.mobile + ' / role: ' + r.user.role) : 'NO_USER', '| Status:', r.status, '| Approved:', r.isApproved, '| Active:', r.isActive);
  });

  process.exit(0);
}).catch(console.error);
