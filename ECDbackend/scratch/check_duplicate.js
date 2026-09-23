const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Rider = require('../models/Rider');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const usersWithPhone = await User.find({
    $or: [
      { mobile: /9691686211/ },
      { phone: /9691686211/ },
      { email: 'admin@gmail.com' }
    ]
  });
  console.log('Users found:', usersWithPhone.map(u => ({ _id: u._id, name: u.name, email: u.email, mobile: u.mobile, phone: u.phone, role: u.role })));

  const riders = await Rider.find({
    $or: [
      { mobile: /9691686211/ },
      { phone: /9691686211/ },
      { email: 'admin@gmail.com' }
    ]
  });
  console.log('Riders found:', riders.map(r => ({ _id: r._id, name: r.name, email: r.email, mobile: r.mobile, phone: r.phone, user: r.user })));

  await mongoose.disconnect();
}
check();
