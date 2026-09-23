require('dotenv').config();
const mongoose = require('mongoose');

console.log('--- Environment Verification ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_ORIGIN:', process.env.FRONTEND_ORIGIN);
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('IMAGEKIT_URL_ENDPOINT:', process.env.IMAGEKIT_URL_ENDPOINT);
console.log('ADMIN_API_KEY:', process.env.ADMIN_API_KEY);
console.log('MONGO_URI configured:', Boolean(process.env.MONGO_URI));
console.log('FIREBASE_SERVICE_ACCOUNT configured:', Boolean(process.env.FIREBASE_SERVICE_ACCOUNT));

async function testMongo() {
  try {
    console.log('\nConnecting to MongoDB Atlas Cluster...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database Name:', conn.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

testMongo();
