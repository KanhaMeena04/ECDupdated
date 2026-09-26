const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4', '1.0.0.1']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const oldUri = "mongodb+srv://ecdkartdatabase_db_user:96oxjzGOXBVtCMMi@ecdcluster.kgowkum.mongodb.net/test?retryWrites=true&w=majority&appName=ECD-Cluster";
const oldFallback = "mongodb://ecdkartdatabase_db_user:96oxjzGOXBVtCMMi@ac-u33zpj7-shard-00-00.kgowkum.mongodb.net:27017,ac-u33zpj7-shard-00-01.kgowkum.mongodb.net:27017,ac-u33zpj7-shard-00-02.kgowkum.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8ccaxr-shard-0&authSource=admin&retryWrites=true&w=majority";

const backupDir = path.join(__dirname, '../data/old_db_backup');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupOldDatabase() {
  console.log("=== PHASE 3: BACKUP OLD DATABASE ===");
  let conn;
  try {
    conn = await mongoose.createConnection(oldUri, { serverSelectionTimeoutMS: 10000, family: 4 }).asPromise();
    console.log("✅ Connected to OLD Atlas via SRV");
  } catch (err) {
    console.warn("SRV connection failed, trying replica set fallback...", err.message);
    conn = await mongoose.createConnection(oldFallback, { serverSelectionTimeoutMS: 10000, family: 4 }).asPromise();
    console.log("✅ Connected to OLD Atlas via Replica Set fallback");
  }

  const collections = await conn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections to backup...`);

  const summary = {};
  let totalDocsCount = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const col = conn.db.collection(colName);
    const docs = await col.find({}).toArray();
    summary[colName] = docs.length;
    totalDocsCount += docs.length;

    const filePath = path.join(backupDir, `${colName}.json`);
    // Use BSON serialization / stringify with Extended JSON to preserve ObjectIds, Dates, etc.
    const jsonStr = JSON.stringify(docs, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    console.log(`  💾 Backup saved: ${colName} (${docs.length} docs) -> ${filePath}`);
  }

  const manifestPath = path.join(backupDir, `backup_manifest.json`);
  const manifestData = {
    timestamp: new Date().toISOString(),
    sourceDatabase: conn.name,
    totalCollections: collections.length,
    totalDocuments: totalDocsCount,
    collections: summary
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');

  console.log(`\n✅ BACKUP COMPLETE! Saved ${totalDocsCount} documents across ${collections.length} collections.`);
  console.log(`Manifest saved to: ${manifestPath}`);

  await conn.close();
  return manifestData;
}

backupOldDatabase().catch(err => {
  console.error("❌ Backup failed:", err);
  process.exit(1);
});
