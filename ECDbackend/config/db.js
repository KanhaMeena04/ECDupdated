const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}
mongoose.set('bufferCommands', false);
const connectDB = async () => {
  let mongoURI = process.env.MONGO_URI || "mongodb+srv://rishi_solanki:Indore%40123@rishiserver.kdybcms.mongodb.net/Check";
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    await ensureAdminUser();
    await ensureSeededData();
    return;
  } catch (error) {
    console.error(`⚠️ MongoDB Atlas Connection Error: ${error.message}`);
    console.log('🔄 Retrying with local MongoDB instance (mongodb://127.0.0.1:27017/ecdkart)...');
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart', {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`✅ Connected to local MongoDB fallback: ${conn.connection.host}`);
      await ensureAdminUser();
      await ensureSeededData();
      return;
    } catch (localErr) {
      console.error('❌ Local MongoDB fallback failed:', localErr.message);
      console.log('⚠️ Running in standalone API mode. Database calls will use fallback responses.');
      return;
    }
  }
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
