const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const restaurants = await db.collection("restaurants").find({}).toArray();
  console.log(`FOUND ${restaurants.length} RESTAURANTS IN CLUSTER:`);
  restaurants.forEach((r, i) => {
    console.log(`${i+1}. [${r._id}] name=${JSON.stringify(r.name)} | owner=${r.owner} | contactNumber=${r.contactNumber} | phone=${r.phone} | email=${r.email} | address=${r.address} | city=${r.city} | status=${r.status} | itemsCount=${r.items ? r.items.length : 0}`);
  });
  await mongoose.disconnect();
}
run();
