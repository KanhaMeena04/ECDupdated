const mongoose = require('mongoose');
const { calculateDistance } = require('../utils/locationUtils');
const { isRestaurantOpenNow } = require('../utils/restaurantAvailability');
const { formatRestaurantForUser } = require('../utils/responseFormatter');
require('dotenv').config();

async function testWithMenuPopulation() {
  await mongoose.connect(process.env.MONGO_URI);
  const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // 1. Preload categories map (ID -> Title)
  const allCats = await Category.find().lean();
  const catMap = {};
  allCats.forEach(c => {
    const title = c.title || (typeof c.name === 'object' ? c.name.en : c.name) || '';
    catMap[c._id.toString()] = title;
  });

  // 2. Fetch all products
  const allProducts = await Product.find({ available: { $ne: false } }).lean();
  const restMenuMap = {};
  allProducts.forEach(p => {
    const rId = p.restaurant?.toString();
    if (!rId) return;
    if (!restMenuMap[rId]) restMenuMap[rId] = [];

    const catId = p.category?.toString() || '';
    const catName = catMap[catId] || (typeof p.category === 'string' ? p.category : 'General');
    const pName = typeof p.name === 'object' ? p.name.en : p.name;
    const pPrice = Number(p.price || p.sellingPrice || p.b2cPrice || p.basePrice || 0);

    restMenuMap[rId].push({
      _id: p._id,
      name: pName,
      price: pPrice,
      mrp: Number(p.mrp || p.originalPrice || (pPrice > 0 ? pPrice * 1.3 : 0)),
      image: p.image || p.imageUrl || '',
      category: catName,
      categoryId: catId,
      subcategory: p.subcategory || '',
      isVeg: p.isVeg !== false,
      rating: Number(p.rating || 4.5),
      description: typeof p.description === 'object' ? p.description.en : (p.description || ''),
    });
  });

  // 3. Test Indore Vijay Nagar
  const indoreCoords = [75.8937, 22.7533];
  const restaurants = await Restaurant.find({
    restaurantApproved: { $ne: false },
    isActive: { $ne: false },
    isTemporarilyClosed: { $ne: true },
  }).lean();

  const nearby = [];
  restaurants.forEach(r => {
    const coords = r.location?.coordinates;
    if (coords && coords.length === 2) {
      const dist = calculateDistance(indoreCoords, coords);
      if (dist <= 25) {
        const menu = restMenuMap[r._id.toString()] || [];
        const menuCategories = Array.from(new Set(menu.map(m => m.category).filter(Boolean)));
        
        // Dynamic rich cuisine from restaurant menu + existing cuisine
        const rawCuisines = Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine];
        const combinedCuisines = Array.from(new Set([...rawCuisines.filter(Boolean), ...menuCategories]));
        
        nearby.push({
          name: typeof r.name === 'object' ? r.name.en : r.name,
          dist: dist + ' km',
          menuCount: menu.length,
          menuCategories: menuCategories,
          combinedCuisines: combinedCuisines,
          sampleDishes: menu.map(m => `[${m.category}] ${m.name}`),
        });
      }
    }
  });

  console.log('=== INDORE RESTAURANTS WITH POPULATED MENUS ===');
  console.log(JSON.stringify(nearby, null, 2));

  // 4. Test matching for "Main Course"
  console.log('\n=== TESTING "Main Course" CATEGORY MATCH ===');
  const catToTest = 'main course';
  const matches = nearby.filter(r => {
    const cuisineMatch = r.combinedCuisines.some(c => c.toLowerCase().includes(catToTest));
    const dishMatch = r.sampleDishes.some(d => d.toLowerCase().includes(catToTest));
    return cuisineMatch || dishMatch;
  });
  console.log(`Matching restaurants for "${catToTest}":`, matches.map(m => m.name));

  process.exit(0);
}

testWithMenuPopulation().catch(e => {
  console.error(e);
  process.exit(1);
});
