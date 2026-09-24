const mongoose = require('mongoose');
const { calculateDistance } = require('../utils/locationUtils');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  const list = await Restaurant.find().lean();
  
  const indoreCoords = [75.8937, 22.7533]; // Vijay Nagar, Indore
  const sohnaCoords = [77.0177, 28.2467];  // Sohna, Haryana

  console.log('=== DISTANCES FROM INDORE (Vijay Nagar) ===');
  list.forEach(r => {
    const coords = r.location?.coordinates;
    const name = typeof r.name === 'object' ? r.name.en : r.name;
    const d = coords ? calculateDistance(indoreCoords, coords) : 'No coords';
    if (typeof d === 'number' && d <= 30) {
      console.log(`[NEARBY <= 30km] ${name}: ${d} km | address: ${r.address}`);
    } else {
      console.log(`[FAR > 30km] ${name}: ${d} km`);
    }
  });

  console.log('\n=== DISTANCES FROM SOHNA ===');
  list.forEach(r => {
    const coords = r.location?.coordinates;
    const name = typeof r.name === 'object' ? r.name.en : r.name;
    const d = coords ? calculateDistance(sohnaCoords, coords) : 'No coords';
    if (typeof d === 'number' && d <= 30) {
      console.log(`[NEARBY <= 30km] ${name}: ${d} km | address: ${r.address}`);
    }
  });

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
