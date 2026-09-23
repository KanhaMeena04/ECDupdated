const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart_local_dev';
const isDryRun = process.argv.includes('--dry-run');

const INDEX_SPECIFICATIONS = [
  {
    collection: 'restaurants',
    indexes: [
      { key: { 'location.coordinates': '2dsphere' }, name: 'restaurants_location_2dsphere' },
      { key: { owner: 1 }, name: 'restaurants_owner' },
      { key: { isActive: 1, isOnline: 1 }, name: 'restaurants_active_online' },
      { key: { city: 1, area: 1 }, name: 'restaurants_city_area' }
    ]
  },
  {
    collection: 'riders',
    indexes: [
      { key: { 'currentLocation.coordinates': '2dsphere' }, name: 'riders_location_2dsphere' },
      { key: { user: 1 }, unique: true, name: 'riders_user_unique' },
      { key: { isOnline: 1, isAvailable: 1 }, name: 'riders_online_available' },
      { key: { workCity: 1, workZone: 1 }, name: 'riders_work_zone' }
    ]
  },
  {
    collection: 'users',
    indexes: [
      { key: { email: 1 }, unique: true, sparse: true, name: 'users_email_unique' },
      { key: { mobile: 1 }, unique: true, sparse: true, name: 'users_mobile_unique' },
      { key: { role: 1 }, name: 'users_role' },
      { key: { 'savedAddresses.location': '2dsphere' }, name: 'users_saved_addresses_2dsphere' }
    ]
  },
  {
    collection: 'orders',
    indexes: [
      { key: { idempotencyKey: 1 }, unique: true, sparse: true, name: 'orders_idempotency_unique' },
      { key: { 'deliveryAddress.coordinates': '2dsphere' }, name: 'orders_delivery_address_2dsphere' },
      { key: { status: 1, restaurant: 1 }, name: 'orders_status_restaurant' },
      { key: { customer: 1, createdAt: -1 }, name: 'orders_customer_created' },
      { key: { rider: 1 }, name: 'orders_rider' },
      { key: { paymentStatus: 1 }, name: 'orders_payment_status' }
    ]
  },
  {
    collection: 'products',
    indexes: [
      { key: { restaurant: 1, isAvailable: 1 }, name: 'products_restaurant_available' },
      { key: { category: 1 }, name: 'products_category' }
    ]
  },
  {
    collection: 'categories',
    indexes: [
      { key: { restaurant: 1, isActive: 1 }, name: 'categories_restaurant_active' }
    ]
  },
  {
    collection: 'promocodes',
    indexes: [
      { key: { code: 1 }, unique: true, name: 'promocodes_code_unique' }
    ]
  },
  {
    collection: 'auditlogs',
    indexes: [
      { key: { entity: 1, entityId: 1, createdAt: -1 }, name: 'auditlogs_entity_lookup' },
      { key: { userId: 1, createdAt: -1 }, name: 'auditlogs_user_lookup' },
      { key: { action: 1, createdAt: -1 }, name: 'auditlogs_action_lookup' }
    ]
  },
  {
    collection: 'wallettransactions',
    indexes: [
      { key: { user: 1, createdAt: -1 }, name: 'wallet_user_created' }
    ]
  }
];

async function ensureIndexes() {
  console.log('====================================================');
  console.log(`MONGODB INDEX SAFETY & INITIALIZATION AUDIT`);
  console.log(`Target Database: ${MONGO_URI}`);
  console.log(`Execution Mode:  ${isDryRun ? 'DRY-RUN (INSPECTION ONLY)' : 'LIVE IDEMPOTENT CREATION'}`);
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;

    let totalChecked = 0;
    let totalExisting = 0;
    let totalCreated = 0;

    for (const spec of INDEX_SPECIFICATIONS) {
      const colName = spec.collection;
      console.log(`📌 Inspecting collection [${colName}]...`);
      
      const colExists = (await db.listCollections({ name: colName }).toArray()).length > 0;
      if (!colExists) {
        console.log(`  ⚠️ Collection [${colName}] does not exist yet. Will create collection.`);
        if (!isDryRun) {
          await db.createCollection(colName);
        }
      }

      const existingIndexes = colExists ? await db.collection(colName).indexes() : [];
      const existingNames = existingIndexes.map(i => i.name);
      const existingKeyJSONs = existingIndexes.map(i => JSON.stringify(i.key));

      for (const idx of spec.indexes) {
        totalChecked++;
        const targetKeyJSON = JSON.stringify(idx.key);
        const alreadyExists = existingKeyJSONs.includes(targetKeyJSON) || existingNames.includes(idx.name);

        if (alreadyExists) {
          totalExisting++;
          console.log(`  ✅ Index exists: ${idx.name || JSON.stringify(idx.key)}`);
        } else {
          console.log(`  ⚡ Missing index: ${idx.name || JSON.stringify(idx.key)} (${JSON.stringify(idx.key)})`);
          if (!isDryRun) {
            const options = { background: true };
            if (idx.unique) options.unique = true;
            if (idx.sparse) options.sparse = true;
            if (idx.name) options.name = idx.name;

            await db.collection(colName).createIndex(idx.key, options);
            console.log(`     🎉 Created index [${idx.name}] idempotently.`);
            totalCreated++;
          }
        }
      }
      console.log('');
    }

    console.log('====================================================');
    console.log(`INDEX AUDIT COMPLETE:`);
    console.log(`  Total Required Indexes Checked: ${totalChecked}`);
    console.log(`  Already Present & Valid:       ${totalExisting}`);
    console.log(`  Created Idempotently:           ${totalCreated}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Index Safety Audit Failed:', err);
    process.exit(1);
  }
}

ensureIndexes();
