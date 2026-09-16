const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const HomeScreenSection = require('./models/HomeScreenSection');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const restaurants = await Restaurant.find({});
  console.log(`\n=== RESTAURANTS (${restaurants.length}) ===`);
  restaurants.forEach(r => {
    console.log({
      id: r._id.toString(),
      name: r.name,
      city: r.city,
      area: r.area,
      location: r.location,
      isActive: r.isActive,
      restaurantApproved: r.restaurantApproved,
      menuApproved: r.menuApproved,
      verificationStatus: r.verificationStatus
    });
  });

  const categories = await Category.find({});
  console.log(`\n=== CATEGORIES (${categories.length}) ===`);
  categories.forEach(c => {
    console.log({ id: c._id.toString(), name: c.name, slug: c.slug, isActive: c.isActive });
  });

  const products = await Product.find({});
  console.log(`\n=== PRODUCTS (${products.length}) ===`);
  products.forEach(p => {
    console.log({
      id: p._id.toString(),
      name: p.name,
      basePrice: p.basePrice,
      adminPriceOverride: p.adminPriceOverride,
      available: p.available,
      isApproved: p.isApproved,
      restaurant: p.restaurant
    });
  });

  const banners = await Banner.find({});
  console.log(`\n=== BANNERS (${banners.length}) ===`);
  banners.forEach(b => console.log({ id: b._id.toString(), title: b.title, isActive: b.isActive }));

  const sections = await HomeScreenSection.find({});
  console.log(`\n=== HOME CMS SECTIONS (${sections.length}) ===`);
  sections.forEach(s => console.log({ id: s._id.toString(), sectionId: s.sectionId, title: s.title, isEnabled: s.isEnabled }));

  await mongoose.disconnect();
}

main().catch(console.error);
