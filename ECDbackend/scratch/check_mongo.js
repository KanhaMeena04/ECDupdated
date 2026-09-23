const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const User = require('../models/User');
  const Rider = require('../models/Rider');

  const drivers = await User.find({ role: { $in: ['driver', 'rider'] } });
  console.log('Total drivers in users collection:', drivers.length);
  
  const riders = await Rider.find({});
  console.log('Total rider docs in riders collection:', riders.length);
  
  console.log('--- Sample Users (Driver role) ---');
  drivers.slice(0, 5).forEach(d => console.log('User:', d._id.toString(), d.name, d.mobile, d.email, d.role));
  
  console.log('--- Sample Riders ---');
  riders.slice(0, 5).forEach(r => console.log('Rider:', r._id.toString(), 'user:', r.user?.toString(), 'status:', r.verificationStatus, 'vehicle:', JSON.stringify(r.vehicle)));

  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
