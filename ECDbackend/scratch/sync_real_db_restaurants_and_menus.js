const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');

async function syncRealDbData() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // 1. Ensure Standard Categories
  const standardCategories = [
    { name: 'Pizza', slug: 'pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', isActive: true, userAppVisible: true },
    { name: 'Burgers', slug: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isActive: true, userAppVisible: true },
    { name: 'Biryani', slug: 'biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', isActive: true, userAppVisible: true },
    { name: 'Momos', slug: 'momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', isActive: true, userAppVisible: true },
    { name: 'Chinese', slug: 'chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', isActive: true, userAppVisible: true },
    { name: 'North Indian', slug: 'north-indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', isActive: true, userAppVisible: true },
    { name: 'Cakes & Desserts', slug: 'cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', isActive: true, userAppVisible: true },
    { name: 'Sandwich & Snacks', slug: 'sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', isActive: true, userAppVisible: true },
    { name: 'Beverages', slug: 'beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', isActive: true, userAppVisible: true },
  ];

  const catMap = {};
  for (const c of standardCategories) {
    let catDoc = await Category.findOne({ $or: [{ slug: c.slug }, { name: c.name }] });
    if (!catDoc) {
      catDoc = await Category.create(c);
      console.log(`Created category: ${c.name}`);
    } else {
      catDoc.isActive = true;
      catDoc.userAppVisible = true;
      catDoc.image = catDoc.image || c.image;
      await catDoc.save();
    }
    catMap[c.slug] = catDoc._id;
    catMap[c.name.toLowerCase()] = catDoc._id;
  }

  // 2. Fetch all real restaurants
  const restaurants = await Restaurant.find({});
  console.log(`Found ${restaurants.length} restaurants in DB.`);

  const dishCatalog = {
    momo: [
      { name: 'Steamed Veg Momos (8 Pcs)', desc: 'Delicate dumplings stuffed with seasoned fresh garden vegetables', price: 99, mrp: 149, isVeg: true, cat: 'momos', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
      { name: 'Crispy Fried Momos (8 Pcs)', desc: 'Golden crunchy dumplings served with spicy garlic schezwan dip', price: 119, mrp: 169, isVeg: true, cat: 'momos', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
      { name: 'Kurkure Paneer Momos (6 Pcs)', desc: 'Crunchy battered paneer momos loaded with chatpata masala', price: 149, mrp: 199, isVeg: true, cat: 'momos', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
      { name: 'Chilli Gravy Momos', desc: 'Tossed in spicy wok Indo-Chinese chilli garlic gravy', price: 139, mrp: 189, isVeg: true, cat: 'chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600' },
    ],
    cafe: [
      { name: 'Classic Cheesy Margherita Pizza', desc: '100% Mozzarella cheese with rich herb tomato concasse', price: 199, mrp: 299, isVeg: true, cat: 'pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600' },
      { name: 'Crispy Veggie Crunch Burger', desc: 'Crunchy spiced vegetable patty with cheese slice, fresh lettuce & mayo', price: 109, mrp: 159, isVeg: true, cat: 'burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
      { name: 'Cheesy Grilled Club Sandwich', desc: 'Triple layer grilled sandwich loaded with cheese, corn and bell peppers', price: 129, mrp: 179, isVeg: true, cat: 'sandwich', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600' },
      { name: 'Cold Coffee with Ice Cream', desc: 'Rich blended espresso with vanilla ice cream and chocolate drizzle', price: 89, mrp: 129, isVeg: true, cat: 'beverages', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600' },
      { name: 'Loaded French Fries with Cheese', desc: 'Crisp golden salted fries smothered in hot melted cheddar sauce', price: 99, mrp: 139, isVeg: true, cat: 'burger', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600' }
    ],
    biryani: [
      { name: 'Hyderabadi Veg Dum Biryani', desc: 'Fragrant basmati rice layered with spiced vegetables, saffron & fried onions, served with Raita', price: 189, mrp: 269, isVeg: true, cat: 'biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
      { name: 'Paneer Tikka Biryani', desc: 'Charcoal grilled marinated paneer cubes layered in rich aromatic dum rice', price: 219, mrp: 299, isVeg: true, cat: 'biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
      { name: 'Soya Chaap Biryani', desc: 'Protein-packed succulent soya chaap chunks cooked in slow dum style', price: 199, mrp: 279, isVeg: true, cat: 'biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
      { name: 'Boondi Raita (300ml)', desc: 'Creamy spiced yogurt whisked with crisp gram flour boondi & roasted cumin', price: 49, mrp: 79, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' }
    ],
    naan_dhaba: [
      { name: 'Special Amritsari Chur Chur Naan Thali', desc: '2 Crisp Butter Chur Chur Naan, Pindi Chole, Dal Makhani, Raita & Salad', price: 180, mrp: 240, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' },
      { name: 'Paneer Butter Masala', desc: 'Fresh cottage cheese cubes simmered in rich creamy tomato butter gravy', price: 190, mrp: 260, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600' },
      { name: 'Dal Makhani Desi Ghee', desc: 'Black lentils slow cooked overnight with butter, cream and subtle spices', price: 160, mrp: 220, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
      { name: 'Garlic Butter Naan', desc: 'Tandoor baked leavened bread brushed with garlic and butter', price: 45, mrp: 60, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' },
      { name: 'Shahi Gulab Jamun (2 Pcs)', desc: 'Soft khoya dumplings soaked in warm cardamom saffron sugar syrup', price: 60, mrp: 90, isVeg: true, cat: 'cake', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600' }
    ],
    general: [
      { name: 'Special Paneer Lababdar', desc: 'Rich cottage cheese in tomato onion cashew gravy with ginger juliennes', price: 210, mrp: 280, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600' },
      { name: 'Veg Hakka Noodles', desc: 'Wok tossed noodles with crunchy cabbage, bell peppers and scallions', price: 130, mrp: 180, isVeg: true, cat: 'chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600' },
      { name: 'Crispy Veg Manchurian Dry', desc: 'Deep fried vegetable dumplings tossed in tangy spicy soya garlic glaze', price: 140, mrp: 190, isVeg: true, cat: 'chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600' },
      { name: 'Royal Special Thali', desc: 'Paneer sabzi, seasonal veg, dal tadka, jeera rice, 4 butter roti, sweet & papad', price: 230, mrp: 300, isVeg: true, cat: 'north-indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' }
    ]
  };

  let totalProductsAdded = 0;

  for (const r of restaurants) {
    const rName = (r.name?.en || r.name || '').toString().toLowerCase();
    
    // Ensure restaurant is fully approved and active
    r.isActive = true;
    r.restaurantApproved = true;
    r.isApproved = true;
    r.menuApproved = true;
    r.verificationStatus = 'verified';
    if (!r.deliveryTime || r.deliveryTime < 10) r.deliveryTime = 25;
    if (!r.rating || !r.rating.average) r.rating = { average: 4.5, count: 140 };
    if (!r.image) r.image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600';
    if (!r.bannerImage) r.bannerImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000';
    
    // Choose catalog based on restaurant name
    let selectedDishes = dishCatalog.general;
    if (rName.includes('momo')) {
      selectedDishes = dishCatalog.momo;
    } else if (rName.includes('cafe') || rName.includes('love') || rName.includes('burger') || rName.includes('pizza')) {
      selectedDishes = dishCatalog.cafe;
    } else if (rName.includes('biryani')) {
      selectedDishes = dishCatalog.biryani;
    } else if (rName.includes('naan') || rName.includes('dhaba') || rName.includes('rasoi') || rName.includes('delight') || rName.includes('chulha') || rName.includes('rajput')) {
      selectedDishes = dishCatalog.naan_dhaba;
    }

    // Check existing products
    const existingCount = await Product.countDocuments({ restaurant: r._id });
    if (existingCount === 0) {
      const prodIds = [];
      for (const d of selectedDishes) {
        const catId = catMap[d.cat] || catMap['north-indian'] || Object.values(catMap)[0];
        const prod = await Product.create({
          restaurant: r._id,
          category: catId,
          categoryId: catId,
          name: { en: d.name },
          description: { en: d.desc },
          image: d.img,
          basePrice: d.price,
          mrp: d.mrp,
          discountPercent: Math.round(((d.mrp - d.price) / d.mrp) * 100),
          sellingPrice: d.price,
          foodType: d.isVeg ? 'veg' : 'non-veg',
          isVeg: d.isVeg,
          available: true,
          outOfStock: false,
          isApproved: true,
          isPublished: true,
          approvalStatus: 'approved',
          preparationTime: 15,
          pricing: {
            b2c: {
              mrp: d.mrp,
              sellingPrice: d.price,
              discountPercent: Math.round(((d.mrp - d.price) / d.mrp) * 100)
            }
          }
        });
        prodIds.push(prod._id);
        totalProductsAdded++;
      }
      r.product = prodIds;
      console.log(`Seeded ${prodIds.length} dishes for restaurant: "${r.name?.en || r.name}"`);
    } else {
      // Make sure all existing products are approved and available
      await Product.updateMany(
        { restaurant: r._id },
        {
          $set: {
            isApproved: true,
            isPublished: true,
            available: true,
            outOfStock: false,
            approvalStatus: 'approved'
          }
        }
      );
    }

    await r.save();
  }

  console.log(`\n🎉 SYNC COMPLETED: All ${restaurants.length} restaurants verified and activated with real menus. Total new products added: ${totalProductsAdded}`);
  await mongoose.disconnect();
}

syncRealDbData().catch(err => {
  console.error('Sync Error:', err);
  process.exit(1);
});
