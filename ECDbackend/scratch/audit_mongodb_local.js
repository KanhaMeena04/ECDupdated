const mongoose = require('mongoose');

async function auditLocalMongo() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart_local_dev');
    console.log('Successfully connected to mongodb://127.0.0.1:27017/ecdkart_local_dev\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:\n`);

    const summary = [];
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      summary.push({ collection: col.name, count });
      console.log(`- ${col.name.padEnd(30)}: ${count} documents`);
    }

    await mongoose.disconnect();
    return summary;
  } catch (err) {
    console.error('MongoDB Audit Error:', err);
  }
}

auditLocalMongo();
