require('dotenv').config();
const mongoose = require('mongoose');

async function resetFinancialData() {
  console.log('====================================================');
  console.log('RESETTING FINANCIAL DATA, COMMISSIONS & ORDER HISTORIES');
  console.log('====================================================\n');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      family: 4
    });
    console.log(`✅ Connected to MongoDB: [${conn.connection.name}]\n`);

    const Order = require('../models/Order');
    const AdminCommissionWallet = require('../models/AdminCommissionWallet');
    const RiderWallet = require('../models/RiderWallet');
    const RestaurantWallet = require('../models/RestaurantWallet');
    const SettlementLedger = require('../models/SettlementLedger');
    const PaymentTransaction = require('../models/PaymentTransaction');

    // 1. Delete all Order documents
    const ordersRes = await Order.deleteMany({});
    console.log(`🗑️ Deleted ${ordersRes.deletedCount} order document(s).`);

    // 2. Reset Admin Commission Wallet
    const adminWalletRes = await AdminCommissionWallet.updateMany({}, {
      $set: {
        balance: 0,
        totalCommission: 0,
        totalPaidOut: 0,
        lastPayoutAmount: 0,
        commissionFromRestaurants: 0,
        commissionFromDelivery: 0,
        lastUpdated: new Date()
      }
    });
    console.log(`🔄 Reset AdminCommissionWallet: matched ${adminWalletRes.matchedCount}, modified ${adminWalletRes.modifiedCount}`);

    // 3. Reset Rider Wallets
    const riderWalletRes = await RiderWallet.updateMany({}, {
      $set: {
        cashInHand: 0,
        totalEarnings: 0,
        availableBalance: 0,
        totalPayouts: 0,
        isFrozen: false,
        lastDepositAmount: 0,
        lastPayoutAmount: 0
      }
    });
    console.log(`🔄 Reset RiderWallet: matched ${riderWalletRes.matchedCount}, modified ${riderWalletRes.modifiedCount}`);

    // 4. Reset Restaurant Wallets
    const restWalletRes = await RestaurantWallet.updateMany({}, {
      $set: {
        balance: 0,
        totalEarnings: 0,
        totalPaidOut: 0,
        pendingAmount: 0,
        lastPayoutAmount: 0
      }
    });
    console.log(`🔄 Reset RestaurantWallet: matched ${restWalletRes.matchedCount}, modified ${restWalletRes.modifiedCount}`);

    // 5. Delete past settlements & payment transaction histories
    const settlementsRes = await SettlementLedger.deleteMany({});
    console.log(`🗑️ Deleted ${settlementsRes.deletedCount} settlement record(s).`);

    const paymentsRes = await PaymentTransaction.deleteMany({});
    console.log(`🗑️ Deleted ${paymentsRes.deletedCount} payment transaction(s).`);

    try {
      const WalletTransaction = require('../models/WalletTransaction');
      const walletTxRes = await WalletTransaction.deleteMany({});
      console.log(`🗑️ Deleted ${walletTxRes.deletedCount} wallet transaction(s).`);
    } catch (_) {}

    console.log('\n====================================================');
    console.log('✅ ALL FINANCIAL DATA & HISTORIES ARE NOW ZERO (0)!');
    console.log('- Total Earnings: ₹0.00');
    console.log('- Total Admin Commission: ₹0.00');
    console.log('- Total Delivery Boy Commission: ₹0.00');
    console.log('- Total Restaurant Commission: ₹0.00');
    console.log('- Today Earnings: ₹0.00');
    console.log('Real-time calculations will start freshly from new orders.');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing financial reset:', err.message);
    process.exit(1);
  }
}

resetFinancialData();
