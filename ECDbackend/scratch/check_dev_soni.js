const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const Rider = require('../models/Rider');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const rider = await Rider.findById('6ab389e878900df8a8505e54').populate('user');
  console.log('Rider found by ID:', {
    _id: rider?._id,
    name: rider?.name,
    mobile: rider?.mobile,
    userMobile: rider?.user?.mobile,
    verificationStatus: rider?.verificationStatus,
    documents: rider?.documents
  });
  await mongoose.disconnect();
}
check();
