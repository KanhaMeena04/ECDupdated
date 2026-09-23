const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart_local_dev');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const mainCats = await db.collection('categories').countDocuments({ parentId: null });
    const subCats = await db.collection('categories').countDocuments({ parentId: { $ne: null } });
    const products = await db.collection('products').countDocuments();
    const pendingProducts = await db.collection('products').countDocuments({ approvalStatus: 'PENDING_ADMIN_APPROVAL' });
    const approvedProducts = await db.collection('products').countDocuments({ approvalStatus: 'APPROVED' });
    const rejectedProducts = await db.collection('products').countDocuments({ approvalStatus: 'REJECTED' });
    const categoryRequests = await db.collection('categoryrequests').countDocuments();
    
    console.log('Counts:', JSON.stringify({
      mainCats,
      subCats,
      products,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      categoryRequests
    }, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
