const mongoose = require('mongoose');
require('dotenv').config();

async function checkRaw() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ role: { $in: ['driver', 'rider'] } }).toArray();
  console.log(`Found ${users.length} raw driver user documents:`);
  users.forEach((u, i) => {
    console.log(`[${i + 1}] ID: ${u._id} | Name: ${u.name} | Phone: ${u.phone} | Mobile: ${u.mobile} | Email: ${u.email} | Role: ${u.role}`);
  });
  process.exit(0);
}
checkRaw().catch(e => { console.error(e); process.exit(1); });
