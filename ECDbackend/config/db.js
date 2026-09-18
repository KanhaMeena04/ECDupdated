const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
  console.log('🔧 DNS configured: Primary: Cloudflare (1.1.1.1, 1.0.0.1)');
} catch (e) {
  console.log('ℹ️ Using default system DNS resolvers');
}
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      let mongoURI = process.env.MONGO_URI;
      if (!mongoURI) {
        mongoURI = "mongodb+srv://rishi_solanki:Indore%40123@rishiserver.kdybcms.mongodb.net/Check";
      }
      const options = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 2,
      };
      const conn = await mongoose.connect(mongoURI, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      await ensureAdminUser();
      await ensureSeededData();
      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB Connection Error (Attempt ${retries}/${maxRetries}): ${error.message}`);
      if (retries < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retries - 1), 15000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  console.error('❌ Failed to connect to MongoDB after maximum retries');
  process.exit(1);
};

async function ensureAdminUser() {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const adminEmail = 'admin@gmail.com';
    const defaultPassword = 'admin123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.findOne({ role: 'admin' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    if (admin) {
      admin.email = adminEmail;
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.isVerified = true;
      admin.isDeleted = false;
      admin.isBlocked = false;
      await admin.save();
      console.log(`🔑 Admin credentials verified: Email: ${admin.email} | Password: ${defaultPassword}`);
    } else {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        mobile: '+919999999999',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isDeleted: false,
        isBlocked: false,
      });
      console.log(`🔑 Created Default Admin: Email: ${adminEmail} | Password: ${defaultPassword}`);
    }
  } catch (err) {
    console.error('⚠️ Admin seeding check failed:', err.message);
  }
}

async function ensureSeededData() {
  try {
    const Restaurant = require('../models/Restaurant');
    const count = await Restaurant.countDocuments();
    if (count === 0) {
      console.log('🌱 No restaurants found in DB. Automatically seeding demo dataset...');
      const path = require('path');
      delete require.cache[require.resolve('../scripts/seedEcdkartData')];
    } else {
      console.log(`✅ MongoDB contains ${count} restaurant(s). DB Ready.`);
    }
  } catch (err) {
    console.error('⚠️ Seed check notice:', err.message);
  }
}

module.exports = connectDB;
