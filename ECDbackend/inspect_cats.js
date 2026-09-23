const mongoose = require('mongoose');

async function inspectCats() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart_local_dev');
  const db = mongoose.connection.db;

  const total = await db.collection('categories').countDocuments();
  const mainCats = await db.collection('categories').countDocuments({ type: "main" });
  const subCats = await db.collection('categories').countDocuments({ type: "subcategory" });
  const nullParent = await db.collection('categories').countDocuments({ parentCategoryId: null });
  const withParent = await db.collection('categories').countDocuments({ parentCategoryId: { $ne: null } });

  console.log('Category Counts:', {
    total,
    mainCats,
    subCats,
    nullParent,
    withParent
  });

  await mongoose.disconnect();
}

inspectCats();
