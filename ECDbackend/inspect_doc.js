const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const doc = await db.collection("restaurants").findOne({ _id: new mongoose.Types.ObjectId("6ab136bb4b156bd222c5dc68") });
  console.log("Pandit ji Document from Atlas:\n", JSON.stringify(doc, null, 2));
  await mongoose.disconnect();
}
run();
