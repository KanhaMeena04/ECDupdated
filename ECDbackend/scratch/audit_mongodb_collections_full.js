const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/ecdkart_local_dev';

async function auditCollections() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('====================================================');
    console.log(`LOCAL MONGODB DATABASE AUDIT: ecdkart_local_dev`);
    console.log(`Total Collections Found: ${collections.length}`);
    console.log('====================================================\n');

    const collectionStats = [];
    for (const col of collections) {
      const colName = col.name;
      const count = await db.collection(colName).countDocuments();
      const indexes = await db.collection(colName).indexes();
      collectionStats.push({ name: colName, count, indexes });
      console.log(`Collection: ${colName.padEnd(25)} | Documents: ${count.toString().padStart(5)} | Indexes: ${indexes.map(i => i.name).join(', ')}`);
    }

    console.log('\n====================================================');
    console.log(`SUMMARY: ${collectionStats.reduce((sum, c) => sum + c.count, 0)} total documents across ${collectionStats.length} collections.`);
    console.log('====================================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Audit Error:', err);
  }
}

auditCollections();
