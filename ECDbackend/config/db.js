const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const connectDB = async () => {
  let mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await ensureAdminUser();
    await ensureSeededData();
    return;
  } catch (error) {
    console.error(`⚠️ MongoDB Atlas Connection Note: ${error.message}`);
    console.log('🔄 Attempting local fallback...');
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart_local_dev', {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`✅ Connected to local MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      await ensureAdminUser();
      await ensureSeededData();
      return;
    } catch (localErr) {
      console.log('⚠️ Running in Resilient Standalone API Mode with in-memory fallback.');
      return;
    }
  }
};

async function ensureAdminUser() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const adminEmail = 'admin@gmail.com';
    const defaultPassword = 'admin123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.findOne({ role: 'admin' });
    }

    if (process.env.NODE_ENV === 'production') {
      if (admin) {
        console.log(`🔒 Production mode active: Existing Admin account (${admin.email || admin.mobile || admin._id}) preserved without password mutation.`);
      } else {
        console.warn(`⚠️ Production mode active: No Admin user found. Default admin auto-creation with static credentials is disabled in production.`);
      }
      return;
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
  if (mongoose.connection.readyState !== 1) return;
  try {
    const Restaurant = require('../models/Restaurant');
    const count = await Restaurant.countDocuments();
    if (count === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.log('🔒 Production mode active: No restaurants found in DB, but auto-seeding demo dataset is strictly disabled.');
        return;
      }
      console.log('🌱 No restaurants found in DB. Automatically seeding demo dataset for development...');
      const path = require('path');
      delete require.cache[require.resolve('../scripts/seedEcdkartData')];
      require('../scripts/seedEcdkartData');
    } else {
      console.log(`✅ MongoDB contains ${count} restaurant(s). DB Ready.`);
    }
  } catch (err) {
    console.error('⚠️ Seed check notice:', err.message);
  }
}

module.exports = connectDB;
