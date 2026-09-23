const mongoose = require('mongoose');

async function testUri(uri) {
  console.log(`Trying ${uri}...`);
  try {
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 3000 }).asPromise();
    console.log(`SUCCESS connected to ${uri}`);
    const db = conn.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const mainCats = await db.collection('categories').countDocuments({ parentId: null });
    const subCats = await db.collection('categories').countDocuments({ parentId: { $ne: null } });
    const products = await db.collection('products').countDocuments();
    const pendingProducts = await db.collection('products').countDocuments({ approvalStatus: 'PENDING_ADMIN_APPROVAL' });
    const approvedProducts = await db.collection('products').countDocuments({ approvalStatus: 'APPROVED' });
    const rejectedProducts = await db.collection('products').countDocuments({ approvalStatus: 'REJECTED' });
    let categoryRequests = 0;
    if (collections.some(c => c.name === 'categoryrequests')) {
      categoryRequests = await db.collection('categoryrequests').countDocuments();
    }
    
    console.log('Counts:', JSON.stringify({
      mainCats,
      subCats,
      products,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      categoryRequests
    }, null, 2));
    await conn.close();
    return true;
  } catch (err) {
    console.error(`FAILED ${uri}:`, err.message);
    return false;
  }
}

async function run() {
  const uris = [
    'mongodb://127.0.0.1:27017/ecdkart_local_dev',
    'mongodb://localhost:27017/ecdkart_local_dev',
    'mongodb://[::1]:27017/ecdkart_local_dev',
    'mongodb://127.0.0.1:27017/ecdkart_local_dev?directConnection=true'
  ];
  for (const uri of uris) {
    const ok = await testUri(uri);
    if (ok) break;
  }
}

run();
