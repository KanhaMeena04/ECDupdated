const mongoose = require('mongoose');
require('dotenv').config();
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart';
mongoose.connect(mongoUri).then(async () => {
  const User = require('../models/User');
  const Rider = require('../models/Rider');
  const users = await User.find({ role: { $in: ['rider', 'driver'] } }).lean();
  console.log('RIDER USERS COUNT:', users.length);
  users.forEach(u => console.log('User:', u._id, u.name, u.phone || u.mobile, 'PIN:', u.pin, 'Role:', u.role));
  const riders = await Rider.find().lean();
  console.log('RIDERS COUNT:', riders.length);
  riders.forEach(r => console.log('Rider:', r._id, r.name, r.phone || r.mobile, 'Status:', r.verificationStatus, 'isVerified:', r.riderVerified, 'PIN:', r.pin));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
