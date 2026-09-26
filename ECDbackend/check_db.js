const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("Connected successfully!");
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections in DB 'test':", collections.map(c => c.name));

    const restaurantsCollection = db.collection("restaurants");
    const count = await restaurantsCollection.countDocuments();
    console.log(`Total restaurants in 'restaurants' collection: ${count}`);

    const restaurants = await restaurantsCollection.find({}).toArray();
    console.log("--- Found Restaurants ---");
    restaurants.forEach((r, idx) => {
      console.log(`[${idx + 1}] ID: ${r._id}, Name: ${JSON.stringify(r.name)}, Email: ${r.email}, Mobile/Phone: ${r.phone || r.contactNumber || (r.owner ? r.owner.mobile : '')}`);
    });

    if (restaurants.length > 0) {
      console.log("\n--- Sample Document [0] ---");
      console.log(JSON.stringify(restaurants[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("DB Error:", err);
  }
}

run();
