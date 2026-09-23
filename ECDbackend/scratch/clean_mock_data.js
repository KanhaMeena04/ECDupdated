require('dotenv').config();
const mongoose = require('mongoose');

async function cleanRiders() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Rider = require('../models/Rider');

  const res1 = await Rider.updateMany(
    { 'vehicle.number': 'DL01AB1234' },
    { $unset: { 'vehicle.number': '' } }
  );
  console.log('Cleaned dummy vehicle numbers:', res1.modifiedCount);

  const res2 = await Rider.updateMany(
    { 'bankDetails.bankName': 'HDFC Bank', 'bankDetails.accountNumber': { $exists: false } },
    { $unset: { 'bankDetails.bankName': '', 'bankDetails.ifscCode': '' } }
  );
  console.log('Cleaned dummy bank details:', res2.modifiedCount);

  process.exit(0);
}

cleanRiders().catch(console.error);
