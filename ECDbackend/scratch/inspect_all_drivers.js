const mongoose = require('mongoose');
require('dotenv').config();

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const User = require('../models/User');
  const Rider = require('../models/Rider');

  const drivers = await User.find({ role: { $in: ['driver', 'rider'] } });
  console.log(`Found ${drivers.length} driver users:`);
  
  for (const d of drivers) {
    const r = await Rider.findOne({ user: d._id });
    console.log(`User ID: ${d._id}, Name: ${d.name || 'N/A'}, Mobile: ${d.mobile || d.phone || 'N/A'}, Email: ${d.email || 'N/A'}, Rider Profile: ${r ? r._id : 'NONE'}`);
  }

  process.exit(0);
}
inspect().catch(e => { console.error(e); process.exit(1); });
