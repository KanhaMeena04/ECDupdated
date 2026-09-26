const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4', '1.0.0.1']);
} catch (e) {}

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const defaultNewUri = "mongodb://ecdkart_test:ecdkart_test@ac-bz5l9pe-shard-00-00.2s4by6o.mongodb.net:27017,ac-bz5l9pe-shard-00-01.2s4by6o.mongodb.net:27017,ac-bz5l9pe-shard-00-02.2s4by6o.mongodb.net:27017/ECDKART?ssl=true&replicaSet=atlas-ymdhr1-shard-0&authSource=admin&retryWrites=true&w=majority";
const newUri = process.env.MONGODB_URI || defaultNewUri;

const backupDir = path.join(__dirname, '../data/old_db_backup');

// Function to revive ObjectIds and Dates
function reviveBsonTypes(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(obj)) {
      return new ObjectId(obj);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      const parsedDate = new Date(obj);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveBsonTypes);
  }
  if (typeof obj === 'object') {
    if (obj.$oid && typeof obj.$oid === 'string') {
      return new ObjectId(obj.$oid);
    }
    if (obj.$date) {
      return new Date(obj.$date);
    }
    const revived = {};
    for (const key of Object.keys(obj)) {
      revived[key] = reviveBsonTypes(obj[key]);
    }
    return revived;
  }
  return obj;
}

async function restoreToNewDatabase() {
  console.log("=== PHASE 5: MIGRATE REAL DATA TO NEW MONGODB ATLAS DATABASE ===");
  console.log(`Connecting to NEW Atlas cluster...`);

  let conn;
  try {
    conn = await mongoose.createConnection(newUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  } catch (err) {
    console.warn("Primary connection string notice, falling back to verified cluster string...", err.message);
    conn = await mongoose.createConnection(defaultNewUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  }

  console.log(`✅ Connected to NEW DB: ${conn.host}/${conn.name}`);

  const manifestPath = path.join(backupDir, 'backup_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup manifest not found at ${manifestPath}. Run backup script first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Loaded backup manifest: ${manifest.totalCollections} collections, ${manifest.totalDocuments} total documents.`);

  const migrationResults = {};
  let totalInserted = 0;

  for (const colName of Object.keys(manifest.collections)) {
    const filePath = path.join(backupDir, `${colName}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️ File missing for collection ${colName}, skipping.`);
      continue;
    }

    const rawDocs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (rawDocs.length === 0) {
      migrationResults[colName] = { source: 0, target: 0, status: 'SKIPPED (0 docs)' };
      continue;
    }

    const revivedDocs = reviveBsonTypes(rawDocs);

    const targetCol = conn.db.collection(colName);

    // Clear existing docs in target collection to ensure clean idempotent migration
    await targetCol.deleteMany({});

    // Batch insert documents in chunks of 500
    const chunkSize = 500;
    let insertedCount = 0;

    for (let i = 0; i < revivedDocs.length; i += chunkSize) {
      const chunk = revivedDocs.slice(i, i + chunkSize);
      const res = await targetCol.insertMany(chunk, { ordered: false });
      insertedCount += res.insertedCount;
    }

    const verifyCount = await targetCol.countDocuments();
    totalInserted += verifyCount;

    const pass = verifyCount === rawDocs.length;
    migrationResults[colName] = {
      source: rawDocs.length,
      target: verifyCount,
      status: pass ? 'PASS' : `FAIL (Expected ${rawDocs.length}, got ${verifyCount})`
    };

    console.log(`  ${pass ? '✅' : '❌'} Migrated ${colName}: ${verifyCount}/${rawDocs.length} docs`);
  }

  console.log(`\n=== MIGRATION SUMMARY REPORT ===`);
  console.table(migrationResults);
  console.log(`Total Documents Migrated into NEW DB (${conn.name}): ${totalInserted}`);

  await conn.close();
  return migrationResults;
}

restoreToNewDatabase().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
