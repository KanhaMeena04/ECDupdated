const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/Kanha/ECDUpdt/ECDbackend/.env' });
const Restaurant = require('./ECDbackend/models/Restaurant');

async function test() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI environment variable is required.');
  await mongoose.connect(mongoUri);
  
  console.log('=== STEP 1: VERIFY MONGODB RECORDS ===');
  const allRestaurants = await Restaurant.find({ city: /Indore/i });
  console.log(`Found ${allRestaurants.length} restaurants matching city Indore:`);
  
  for (const r of allRestaurants) {
    console.log({
      _id: r._id,
      name: r.name,
      slug: r.slug,
      city: r.city,
      state: r.state,
      address: r.address,
      location: r.location,
      'location.type': r.location?.type,
      'location.coordinates': r.location?.coordinates,
      isActive: r.isActive,
      restaurantApproved: r.restaurantApproved,
      menuApproved: r.menuApproved,
      acceptingOrders: r.acceptingOrders,
      deliveryRadius: r.deliveryRadius,
      geofenceRadius: r.geofenceRadius,
      owner: r.owner
    });
  }

  console.log('\n=== STEP 2: VERIFY GEO INDEX ===');
  const indexes = await Restaurant.collection.indexes();
  console.log('Indexes on restaurants collection:', JSON.stringify(indexes, null, 2));

  console.log('\n=== STEP 5 / STEP 6: TEST CONTROLLER NEAR QUERY ===');
  const testCoords = [
    { name: 'User App default (Indore)', lat: 22.7196, lng: 75.8577 },
    { name: 'Vijay Nagar exact (22.7500, 75.8900)', lat: 22.7500, lng: 75.8900 },
    { name: 'Palasia exact (22.7240, 75.8850)', lat: 22.7240, lng: 75.8850 },
    { name: 'Mumbai (19.0760, 72.8777)', lat: 19.0760, lng: 72.8777 }
  ];

  for (const tc of testCoords) {
    console.log(`\n--- Testing Coords: ${tc.name} [lat: ${tc.lat}, lng: ${tc.lng}] ---`);
    const radiusKm = 10;
    
    // Exact baseQuery from controller
    const baseQuery = {
      restaurantApproved: true,
      isActive: true,
      isTemporarilyClosed: false,
      menuApproved: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [tc.lng, tc.lat] },
          $maxDistance: radiusKm * 1000,
        },
      }
    };
    
    const results = await Restaurant.find(baseQuery);
    console.log(`Matching restaurants count: ${results.length}`);
    results.forEach(r => {
      console.log(`  - [${r._id}] ${r.name?.en || r.name} | coordinates:`, r.location?.coordinates);
    });
  }

  await mongoose.disconnect();
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
