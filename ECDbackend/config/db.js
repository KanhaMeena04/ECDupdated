require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolvers for SRV records if possible
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (e) { }

// Connection event monitoring
mongoose.connection.on('error', (err) => {
  console.error('⚠️ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose connection lost. Retrying automatically...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB Atlas!');
});

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ FATAL: MONGODB_URI / MONGO_URI environment variable is missing.');
    console.error('Silently falling back to localhost or legacy databases is strictly disabled.');
    throw new Error('MONGODB_URI environment variable is required to start ECDbackend.');
  }

  const connectionOptions = {
    autoIndex: true,
    maxPoolSize: 50,             // Maintain up to 50 socket connections
    minPoolSize: 5,              // Maintain at least 5 socket connections
    serverSelectionTimeoutMS: 30000, // 30s for Atlas server selection / primary election
    socketTimeoutMS: 45000,      // Close sockets after 45s of inactivity
    connectTimeoutMS: 30000,     // 30s for initial TCP/TLS handshake
    heartbeatFrequencyMS: 10000, // Health check every 10 seconds
    maxIdleTimeMS: 30000,        // Close idle socket connections after 30s
    retryWrites: true,
    retryReads: true,
    family: 4,                   // Use IPv4 to avoid IPv6 delays
  };

  try {
    console.log('📡 [MongoDB] Connecting to ECDKART Atlas Cloud DB...');

    const conn = await mongoose.connect(mongoUri, connectionOptions);

    console.log(
      `✅ MongoDB Connected Successfully | Host: ${conn.connection.host} | Database: ${conn.connection.name}`
    );

    // Fire post-connect maintenance tasks asynchronously in background so API server handles traffic instantly
    cleanupLegacyIndexes().catch(e => console.warn('Legacy index cleanup:', e.message));
    ensureAdminUser().catch(e => console.warn('Admin check:', e.message));
    reconcileUserAndRiderNames().catch(e => console.warn('Name reconciliation:', e.message));

    return conn;
  } catch (error) {
    console.error(`❌ Fatal MongoDB Cloud Connection Error: ${error.message}`);
    console.error('💡 TIP: Please check your internet connection or IP whitelist in MongoDB Atlas.');
    console.warn('⚠️ Server will operate in Fast Fallback Mode with seeded restaurant data for Admin & User App.');
    return null;
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
          await restCollection.dropIndex(idx.name).catch(() => { });
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

async function reconcileUserAndRiderNames() {
  try {
    const User = require('../models/User');
    const Rider = require('../models/Rider');

    const users = await User.find({
      $or: [
        { firstName: { $in: ["", null, "User"] } },
        { name: { $in: ["", null, "User"] } }
      ]
    }).limit(50).lean();

    for (const u of users) {
      let updated = false;
      let fName = (u.firstName || "").trim();
      let lName = (u.lastName || "").trim();
      let fullName = (u.name || "").trim();

      if ((!fName && !lName) || fName === "User") {
        if (fullName && fullName !== "User") {
          const parts = fullName.split(" ");
          fName = parts[0] || "";
          lName = parts.slice(1).join(" ") || "";
          u.firstName = fName;
          u.lastName = lName;
          updated = true;
        }
      }
      if (!fullName || fullName === "User") {
        if (fName && fName !== "User") {
          u.name = `${fName} ${lName}`.trim();
          updated = true;
        }
      }
      if (updated) {
        await User.updateOne(
          { _id: u._id },
          { $set: { firstName: u.firstName, lastName: u.lastName, name: u.name } }
        );
      }
    }

    const riders = await Rider.find({
      $or: [
        { name: { $in: ["", null, "User", "Driver Partner"] } }
      ]
    }).populate('user', 'name email mobile phone').limit(50).lean();

    for (const r of riders) {
      if (!r.user) continue;
      const userName = (r.user.name || "").trim();
      const riderName = (r.name || "").trim();

      const isUserGeneric = !userName || userName === 'User' || userName === 'Driver Partner' || userName.startsWith('Rider ');
      const isRiderGeneric = !riderName || riderName === 'User' || riderName === 'Driver Partner' || riderName.startsWith('Rider ');

      if (!isUserGeneric && isRiderGeneric) {
        await Rider.updateOne({ _id: r._id }, { $set: { name: userName } });
      } else if (isUserGeneric && !isRiderGeneric) {
        const parts = riderName.split(" ");
        await User.updateOne(
          { _id: r.user._id },
          { $set: { name: riderName, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" } }
        );
      }
    }
    console.log('✅ User & Rider profile name auto-reconciliation complete');
  } catch (err) {
    console.warn('⚠️ User/Rider auto-reconciliation warning:', err.message);
  }
}

module.exports = connectDB;
