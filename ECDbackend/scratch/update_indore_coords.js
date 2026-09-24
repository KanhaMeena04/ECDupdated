const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  
  const r1 = await Restaurant.updateOne(
    { $or: [{ 'name.en': 'Namrata Test' }, { name: 'Namrata Test' }] },
    { $set: { city: 'Indore', area: 'Vijay Nagar', 'location.type': 'Point', 'location.coordinates': [75.8920, 22.7520] } }
  );
  
  const r2 = await Restaurant.updateOne(
    { $or: [{ 'name.en': 'Shikha da Dhaba' }, { name: 'Shikha da Dhaba' }] },
    { $set: { city: 'Indore', area: 'Vijay Nagar', 'location.type': 'Point', 'location.coordinates': [75.8940, 22.7540] } }
  );
  
  const r3 = await Restaurant.updateOne(
    { $or: [{ 'name.en': 'rishu cafe' }, { name: 'rishu cafe' }] },
    { $set: { city: 'Indore', area: 'Vijay Nagar', 'location.type': 'Point', 'location.coordinates': [75.8930, 22.7510] } }
  );

  console.log('Updated Indore restaurants:', r1.modifiedCount, r2.modifiedCount, r3.modifiedCount);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
