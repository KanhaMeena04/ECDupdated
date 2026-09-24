const mongoose = require('mongoose');
const { calculateDistance } = require('../utils/locationUtils');
const { isRestaurantOpenNow } = require('../utils/restaurantAvailability');
const { formatRestaurantForUser } = require('../utils/responseFormatter');
require('dotenv').config();

async function testQuery(userLat, userLng, userLabel) {
  await mongoose.connect(process.env.MONGO_URI);
  const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  
  const baseQuery = {
    restaurantApproved: { $ne: false },
    isActive: { $ne: false },
    isTemporarilyClosed: { $ne: true },
  };

  const allRestaurants = await Restaurant.find(baseQuery).lean();
  const radiusKm = 25;
  const hasCoords = Number.isFinite(userLat) && Number.isFinite(userLng) && userLat !== 0 && userLng !== 0;

  let nearbyList = [];
  if (hasCoords) {
    allRestaurants.forEach(restaurant => {
      const coords = restaurant.location?.coordinates;
      if (coords && coords.length === 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
        const dist = calculateDistance([userLng, userLat], coords);
        if (dist <= radiusKm) {
          const baseDeliveryTime = Math.max(15, 15 + Math.round(dist * 3));
          nearbyList.push({
            name: typeof restaurant.name === 'object' ? restaurant.name.en : restaurant.name,
            address: restaurant.address,
            distanceKm: Number(dist.toFixed(1)),
            deliveryTimeMin: baseDeliveryTime,
          });
        }
      }
    });
    nearbyList.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    nearbyList = allRestaurants.map(r => ({
      name: typeof r.name === 'object' ? r.name.en : r.name,
      address: r.address,
      distanceKm: 2.0,
      deliveryTimeMin: 30,
    }));
  }

  console.log(`\n=== RESULTS FOR ${userLabel} (Coords: [${userLng}, ${userLat}]) ===`);
  console.log(`Found ${nearbyList.length} nearby restaurants within ${radiusKm}km:`);
  nearbyList.forEach(r => {
    console.log(`- ${r.name} | ${r.distanceKm} km | ${r.deliveryTimeMin} mins | ${r.address}`);
  });
}

async function run() {
  await testQuery(22.7533, 75.8937, 'INDORE (Vijay Nagar)');
  await testQuery(28.2467, 77.0177, 'SOHNA (Haryana)');
  await testQuery(20.7399, 86.2438, 'ODISHA');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
