require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const { uploadToImageKit } = require('../utils/imagekit');

async function fixBrokenImages() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas.");

  const brokenProds = await Product.find({
    image: { $regex: 'google\\.com/search' }
  });

  console.log(`Found ${brokenProds.length} products to fix.`);

  let updatedCount = 0;
  for (const prod of brokenProds) {
    const dishName = prod.name?.en || prod.name || 'Dish';
    const oldImg = prod.image;
    console.log(`Fixing [${prod._id}] "${dishName}" with current image: ${oldImg.slice(0, 50)}...`);

    try {
      const newUrl = await uploadToImageKit(oldImg, `menu_${dishName}.jpg`, '/menu', dishName);
      if (newUrl && !newUrl.includes('google.com/search')) {
        await Product.updateOne({ _id: prod._id }, { $set: { image: newUrl } });

        // Also update in restaurant's embedded menu array if present
        if (prod.restaurant) {
          await Restaurant.updateOne(
            { _id: prod.restaurant, "menu._id": prod._id },
            { $set: { "menu.$.image": newUrl } }
          );
        }

        console.log(`  -> Fixed! New ImageKit URL: ${newUrl}`);
        updatedCount++;
      } else {
        console.warn(`  -> Could not resolve new URL for ${dishName}`);
      }
    } catch (err) {
      console.error(`  -> Error fixing ${dishName}:`, err.message);
    }
  }

  console.log(`\n🎉 Successfully fixed ${updatedCount} / ${brokenProds.length} products with ImageKit CDN URLs!`);
  await mongoose.disconnect();
}

fixBrokenImages().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
