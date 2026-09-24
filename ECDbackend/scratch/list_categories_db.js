const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const cats = await Category.find().lean();
  console.log(`Total Categories in DB: ${cats.length}`);
  cats.forEach(c => {
    const title = c.title || (typeof c.name === 'object' ? c.name.en : c.name);
    console.log(`- ID: ${c._id} | Title: "${title}" | Slug: ${c.slug}`);
  });
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
