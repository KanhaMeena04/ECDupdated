const mongoose = require('mongoose');
require('dotenv').config();

async function inspectRidersDb() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const riders = await db.collection('riders').find({}).toArray();
  console.log(`Total riders in MongoDB Atlas: ${riders.length}`);
  console.log(JSON.stringify(riders, null, 2));

  // Check if there are users with role 'rider' or 'driver' in users collection
  const riderUsers = await db.collection('users').find({
    role: { $in: ['rider', 'driver'] }
  }).toArray();
  console.log(`\nTotal users with role rider/driver in users collection: ${riderUsers.length}`);
  console.log(JSON.stringify(riderUsers.map(u => ({ _id: u._id, name: u.name, mobile: u.mobile, email: u.email, role: u.role })), null, 2));

  await mongoose.disconnect();
}
inspectRidersDb().catch(console.error);
