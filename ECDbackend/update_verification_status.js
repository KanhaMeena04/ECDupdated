const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Restaurant = require('./models/Restaurant');

async function updateVerification() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const res = await Restaurant.updateMany(
    { restaurantApproved: true, menuApproved: true, isActive: true },
    { $set: { verificationStatus: 'verified' } }
  );

  console.log('Updated verificationStatus for approved restaurants:', res);

  const list = await Restaurant.find({});
  list.forEach(r => {
    console.log(`Restaurant ${r.name.en}: approved=${r.restaurantApproved}, menuApproved=${r.menuApproved}, status=${r.verificationStatus}`);
  });

  await mongoose.disconnect();
}

updateVerification().catch(console.error);
