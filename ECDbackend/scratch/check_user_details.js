const mongoose = require('mongoose');
require('dotenv').config();
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart';
mongoose.connect(mongoUri).then(async () => {
  const User = require('../models/User');
  const Rider = require('../models/Rider');
  const users = await User.find({ $or: [{ phone: /9179916404/ }, { mobile: /9179916404/ }] }).lean();
  console.log('USERS FOR 9179916404:', JSON.stringify(users, null, 2));
  const riders = await Rider.find({ $or: [{ phone: /9179916404/ }, { mobile: /9179916404/ }] }).lean();
  console.log('RIDERS FOR 9179916404:', JSON.stringify(riders, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
