const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  
  const products = await Product.find().lean();
  console.log(`Total Products in DB: ${products.length}`);
  
  const restMap = {};
  products.forEach(p => {
    const rId = p.restaurant?.toString() || 'unknown';
    if (!restMap[rId]) restMap[rId] = [];
    restMap[rId].push({
      name: typeof p.name === 'object' ? p.name.en : p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price || p.b2cPrice
    });
  });

  for (const [rId, pList] of Object.entries(restMap)) {
    const rest = await Restaurant.findById(rId).lean();
    const rName = rest ? (typeof rest.name === 'object' ? rest.name.en : rest.name) : rId;
    console.log(`\nRestaurant: ${rName} (ID: ${rId}) - ${pList.length} products:`);
    pList.slice(0, 5).forEach(item => {
      console.log(`  - [${item.category}] ${item.name} (Sub: ${item.subcategory}) - Rs.${item.price}`);
    });
  }

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
