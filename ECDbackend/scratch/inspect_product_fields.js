const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const sample = await Product.find().limit(6).lean();
  console.log('Sample Product documents:');
  sample.forEach(p => {
    console.log({
      id: p._id,
      name: p.name,
      price: p.price,
      sellingPrice: p.sellingPrice,
      basePrice: p.basePrice,
      b2cPrice: p.b2cPrice,
      mrp: p.mrp,
      originalPrice: p.originalPrice,
      restaurant: p.restaurant,
      category: p.category
    });
  });
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
