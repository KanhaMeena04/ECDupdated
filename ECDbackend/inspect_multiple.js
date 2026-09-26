const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const docs = await db.collection("restaurants").find({}).limit(5).toArray();
  docs.forEach(d => {
    console.log(`\n=== [${d.name}] (_id: ${d._id}) ===`);
    console.log(`Phone: ${d.phone} | Logo: ${d.logo} | Categories: ${d.categories} | Menu Count: ${d.menu ? d.menu.length : 0} | UPI: ${d.upi} | Wallet: ${d.walletBalance}`);
  });
  await mongoose.disconnect();
}
run();
