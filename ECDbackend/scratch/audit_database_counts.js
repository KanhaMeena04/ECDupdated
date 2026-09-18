const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'C:/Kanha/ECDUpdt/ECDbackend/.env' });

async function runAudit() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/ecdkart';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB for Entity Count & Orphan Audit');

    const User = require('C:/Kanha/ECDUpdt/ECDbackend/models/User');
    const Restaurant = require('C:/Kanha/ECDUpdt/ECDbackend/models/Restaurant');
    const Rider = require('C:/Kanha/ECDUpdt/ECDbackend/models/Rider');
    const Product = require('C:/Kanha/ECDUpdt/ECDbackend/models/Product');
    const Category = require('C:/Kanha/ECDUpdt/ECDbackend/models/Category');
    const Order = require('C:/Kanha/ECDUpdt/ECDbackend/models/Order');
    const PaymentTransaction = require('C:/Kanha/ECDUpdt/ECDbackend/models/PaymentTransaction');
    const Settlement = require('C:/Kanha/ECDUpdt/ECDbackend/models/Settlement');
    const Wallet = require('C:/Kanha/ECDUpdt/ECDbackend/models/Wallet');
    const RiderWallet = require('C:/Kanha/ECDUpdt/ECDbackend/models/RiderWallet');
    const RestaurantWallet = require('C:/Kanha/ECDUpdt/ECDbackend/models/RestaurantWallet');
    const AuditLog = require('C:/Kanha/ECDUpdt/ECDbackend/models/AuditLog');

    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
    const approvedRestaurants = await Restaurant.countDocuments({ restaurantApproved: true });
    const menuApprovedRestaurants = await Restaurant.countDocuments({ menuApproved: true });
    const inactiveRestaurants = await Restaurant.countDocuments({ isActive: false });

    const totalRiders = await Rider.countDocuments();
    const activeRiders = await Rider.countDocuments({ isActive: true });
    const onlineRiders = await Rider.countDocuments({ dutyStatus: 'online' });
    const verifiedRiders = await Rider.countDocuments({ verificationStatus: 'verified' });

    const totalProducts = await Product.countDocuments();
    const approvedProducts = await Product.countDocuments({ isApproved: true });

    const totalCategories = await Category.countDocuments();
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const totalPaymentTxns = await PaymentTransaction.countDocuments();
    const totalSettlements = await Settlement.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();

    console.log('--- DATABASE ENTITY COUNTS ---');
    console.log({
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      approvedRestaurants,
      menuApprovedRestaurants,
      inactiveRestaurants,
      totalRiders,
      activeRiders,
      onlineRiders,
      verifiedRiders,
      totalProducts,
      approvedProducts,
      totalCategories,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalPaymentTxns,
      totalSettlements,
      totalAuditLogs
    });

    // Orphan Data Checks
    const ordersWithMissingUser = await Order.countDocuments({ user: { $exists: false } });
    const ordersWithMissingRestaurant = await Order.countDocuments({ restaurant: { $exists: false } });
    
    console.log('--- ORPHAN DATA AUDIT ---');
    console.log({
      ordersWithMissingUser,
      ordersWithMissingRestaurant
    });

    process.exit(0);
  } catch (err) {
    console.error('Audit Error:', err);
    process.exit(1);
  }
}

runAudit();
