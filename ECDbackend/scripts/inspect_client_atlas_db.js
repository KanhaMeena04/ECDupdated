const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.CLIENT_MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart_local_dev';

async function runClientDiscoveryAudit() {
  console.log('====================================================');
  console.log('ECDKART CLIENT ATLAS DATABASE DISCOVERY AUDIT');
  console.log(`Target URI:  ${MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log('Mode:        STRICT READ-ONLY (ZERO WRITES / MODIFICATIONS)');
  console.log('====================================================\n');

  try {
    const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    console.log(`✅ Connected to Database: [${dbName}]\n`);

    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collection(s) in [${dbName}]:\n`);

    const inventory = [];

    for (const col of collections) {
      const name = col.name;
      const count = await db.collection(name).countDocuments();
      const indexes = await db.collection(name).indexes();
      
      const stats = {
        name,
        count,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: !!idx.unique,
          sparse: !!idx.sparse,
          isGeospatial: Object.values(idx.key).includes('2dsphere')
        }))
      };

      inventory.push(stats);

      console.log(`Collection: ${name.padEnd(25)} | Documents: ${count.toString().padStart(6)} | Indexes: ${indexes.length}`);
      indexes.forEach(i => {
        const flags = [];
        if (i.unique) flags.push('UNIQUE');
        if (i.sparse) flags.push('SPARSE');
        if (Object.values(i.key).includes('2dsphere')) flags.push('2DSPHERE');
        console.log(`   - ${i.name}: ${JSON.stringify(i.key)} ${flags.length ? '[' + flags.join(', ') + ']' : ''}`);
      });
      console.log('');
    }

    // Save JSON audit output
    const outputPath = path.join(__dirname, 'client_db_inventory_snapshot.json');
    fs.writeFileSync(outputPath, JSON.stringify({ database: dbName, collections: inventory }, null, 2));
    console.log(`\n✅ Snapshot saved to: ${outputPath}`);

    await mongoose.disconnect();
    console.log('✅ Safely disconnected. Zero changes made to target database.');
  } catch (err) {
    console.error('❌ Connection / Audit Error:', err.message);
  }
}

runClientDiscoveryAudit();
