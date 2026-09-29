const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('URI found:', !!MONGO_URI);

const Banner = mongoose.model('Banner', new mongoose.Schema({
  title: String, image: String, isActive: Boolean, position: Number
}, { timestamps: true }));

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');

  // List all banners first
  const all = await Banner.find({});
  console.log('All banners:', all.length);
  all.forEach(b => console.log(' ID:', b._id.toString(), '| Title:', b.title, '| Image:', b.image ? b.image.substring(0, 80) : 'NONE'));

  // Delete the specific broken banner by ID
  const brokenId = '6abb4b5056895aa9010ab8e7';
  const r = await Banner.deleteOne({ _id: brokenId });
  console.log('Deleted:', r.deletedCount, 'banner(s)');

  const remaining = await Banner.find({});
  console.log('Remaining banners:', remaining.length);
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
