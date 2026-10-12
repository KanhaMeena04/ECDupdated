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
    await reconcileUserAndRiderNames();
    await reconcileOrderCustomerAndRestaurantNames();

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

async function reconcileUserAndRiderNames() {
  try {
    const User = require('../models/User');
    const Rider = require('../models/Rider');

    const users = await User.find({ isDeleted: { $ne: true } });
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

    const riders = await Rider.find({}).populate('user', 'name email mobile phone');
    for (const r of riders) {
      if (!r.user) continue;
      const userName = (r.user.name || "").trim();
      const riderName = (r.name || "").trim();

      const isUserGeneric = !userName || userName === 'User' || userName === 'Driver Partner' || userName.startsWith('Rider ');
      const isRiderGeneric = !riderName || riderName === 'User' || riderName === 'Driver Partner' || riderName.startsWith('Rider ');

      if (!isUserGeneric && isRiderGeneric) {
        r.name = userName;
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

async function reconcileOrderCustomerAndRestaurantNames() {
  try {
    const Order = require('../models/Order');
    const Restaurant = require('../models/Restaurant');
    const User = require('../models/User');

    const restaurants = await Restaurant.find({}).lean();
    const defaultRestaurant = restaurants[0] || null;
    const restMap = new Map();
    restaurants.forEach((r) => {
      let rName = '';
      if (typeof r.name === 'string') rName = r.name;
      else if (r.name && typeof r.name === 'object') {
        rName = r.name.en || r.name.name || Object.values(r.name).find((v) => typeof v === 'string') || '';
      }
      if (!rName) rName = 'ECD Partner Restaurant';
      restMap.set(r._id.toString(), { ...r, resolvedName: rName });
    });

    const users = await User.find({}).lean();
    const defaultCustomer = users.find((u) => u.role === 'customer') || users[0] || null;
    const userMap = new Map();
    const phoneToUserMap = new Map();
    users.forEach((u) => {
      const uName = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Customer';
      userMap.set(u._id.toString(), { ...u, resolvedName: uName });
      if (u.mobile) phoneToUserMap.set(u.mobile.replace(/\D/g, '').slice(-10), { ...u, resolvedName: uName });
      if (u.phone) phoneToUserMap.set(u.phone.replace(/\D/g, '').slice(-10), { ...u, resolvedName: uName });
    });

    const ordersToFix = await Order.find({
      $or: [
        { customerName: { $exists: false } },
        { customerName: '' },
        { customerName: 'Customer' },
        { customerName: '—' },
        { restaurantName: { $exists: false } },
        { restaurantName: '' },
        { restaurantName: 'Restaurant' },
        { restaurantName: '—' }
      ]
    }).limit(200);

    let updatedCount = 0;
    for (const ord of ordersToFix) {
      let updates = {};

      // 1. Resolve Customer Name & Phone
      let cName = ord.customerName;
      let cPhone = ord.customerPhone;
      const custIdStr = ord.customer ? ord.customer.toString() : (ord.user ? ord.user.toString() : null);

      if (custIdStr && userMap.has(custIdStr)) {
        const u = userMap.get(custIdStr);
        cName = u.resolvedName;
        cPhone = cPhone || u.mobile || u.phone || '';
      } else {
        const rawPhone = (ord.deliveryPhone || ord.deliveryAddress?.phone || ord.address?.phone || '').replace(/\D/g, '').slice(-10);
        if (rawPhone && phoneToUserMap.has(rawPhone)) {
          const u = phoneToUserMap.get(rawPhone);
          cName = u.resolvedName;
          cPhone = u.mobile || u.phone || rawPhone;
          updates.customer = u._id;
        } else if (ord.deliveryAddress?.name && ord.deliveryAddress.name.trim()) {
          cName = ord.deliveryAddress.name.trim();
        } else if (rawPhone) {
          cName = `Customer (${rawPhone.slice(-4)})`;
          cPhone = rawPhone;
        } else if (defaultCustomer) {
          cName = defaultCustomer.resolvedName;
          cPhone = defaultCustomer.mobile || defaultCustomer.phone || '';
          updates.customer = defaultCustomer._id;
        } else {
          cName = 'Customer';
        }
      }

      if (cName && (cName !== ord.customerName || ord.customerName === '—')) updates.customerName = cName;
      if (cPhone && cPhone !== ord.customerPhone) updates.customerPhone = cPhone;

      // 2. Resolve Restaurant Name
      let rName = ord.restaurantName;
      const restIdStr = ord.restaurant ? ord.restaurant.toString() : (ord.store ? ord.store.toString() : null);

      if (restIdStr && restMap.has(restIdStr)) {
        const r = restMap.get(restIdStr);
        rName = r.resolvedName;
      } else {
        if (defaultRestaurant) {
          const r = defaultRestaurant;
          rName = r.resolvedName || (typeof r.name === 'string' ? r.name : (r.name?.en || 'ECD Partner Restaurant'));
          if (!ord.restaurant) updates.restaurant = r._id;
        } else {
          rName = 'ECD Partner Restaurant';
        }
      }

      if (rName && (rName !== ord.restaurantName || ord.restaurantName === '—')) updates.restaurantName = rName;

      if (Object.keys(updates).length > 0) {
        await Order.updateOne({ _id: ord._id }, { $set: updates });
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`✅ Auto-reconciled customer & restaurant names for ${updatedCount} orders in MongoDB Atlas`);
    }
  } catch (err) {
    console.warn('⚠️ Order reconciliation warning:', err.message);
  }
}

module.exports = connectDB;
