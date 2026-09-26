require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ FATAL: MONGODB_URI / MONGO_URI environment variable is missing.');
    console.error('Silently falling back to localhost or legacy databases is strictly disabled.');
    throw new Error('MONGODB_URI environment variable is required to start ECDbackend.');
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip IPv6 try delays
  };

  try {
    console.log('📡 [MongoDB] Connecting to ECDKART-TEST Atlas using environment configuration...');

    const conn = await mongoose.connect(mongoUri, connectionOptions);

    console.log(
      `✅ MongoDB Connected Successfully | Host: ${conn.connection.host} | Database: ${conn.connection.name}`
    );

    await cleanupLegacyIndexes();
    await ensureAdminUser();

    return conn;
  } catch (error) {
    console.error(`❌ Fatal MongoDB Cloud Connection Error: ${error.message}`);
    console.error('💡 TIP: Please check your internet connection or IP whitelist in MongoDB Atlas.');
    throw error;
  }
};

async function cleanupLegacyIndexes() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const hasRestaurants = collections.some(
      (c) => c.name === 'restaurants'
    );

    if (hasRestaurants) {
      const restCollection = db.collection('restaurants');
      const indexes = await restCollection.indexes();

      for (const idx of indexes) {
        if (
          idx.name === 'slug_1' ||
          idx.name === 'restaurantId_1' ||
          idx.name === 'restaurantKey_1'
        ) {
          console.log(`🧹 Dropping legacy conflict index: ${idx.name}`);
          await restCollection.dropIndex(idx.name).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Legacy index cleanup skipped:', err.message);
  }
}

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

    if (process.env.NODE_ENV === 'production') {
      if (admin) {
        console.log(
          `🔒 Production mode: Existing Admin account (${admin.email}) preserved.`
        );
      } else {
        console.warn(
          '⚠️ Production mode: No Admin user found. Static admin creation disabled.'
        );
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

      console.log(
        `🔑 Local development Admin credentials verified: ${admin.email}`
      );
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

      console.log(
        `🔑 Created Local Development Admin: ${adminEmail}`
      );
    }
  } catch (err) {
    console.error('⚠️ Admin seeding check failed:', err.message);
  }
}

module.exports = connectDB;
