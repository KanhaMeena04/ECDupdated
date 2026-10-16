require('dotenv').config();
const mongoose = require('mongoose');

async function checkEarningsData() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB:', mongoose.connection.name);

    const Order = require('./models/Order');
    const AdminCommissionWallet = require('./models/AdminCommissionWallet');
    const RiderWallet = require('./models/RiderWallet');
    const RestaurantWallet = require('./models/RestaurantWallet');
    const SettlementLedger = require('./models/SettlementLedger');
    const PaymentTransaction = require('./models/PaymentTransaction');

    const orderCount = await Order.countDocuments();
    const deliveredCount = await Order.countDocuments({ status: 'delivered' });
    console.log(`Total Orders: ${orderCount}, Delivered Orders: ${deliveredCount}`);

    const earningsAgg = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $ifNull: ["$totalAmount", 0] } },
          totalCommission: { $sum: { $ifNull: ["$adminCommission", 0] } },
          totalRestaurantCommission: { $sum: { $ifNull: ["$restaurantShare", 0] } },
          totalRiderEarning: { $sum: { $ifNull: ["$riderEarning", 0] } },
        }
      }
    ]);
    console.log('Current Delivered Orders Aggregate:', earningsAgg[0] || {});

    const adminWallets = await AdminCommissionWallet.find().lean();
    console.log('AdminCommissionWallet docs:', adminWallets);

    const riderWallets = await RiderWallet.find().lean();
    console.log(`RiderWallet docs (${riderWallets.length}):`, riderWallets.map(w => ({ rider: w.rider, totalEarnings: w.totalEarnings, balance: w.availableBalance, cashInHand: w.cashInHand })));

    const restWallets = await RestaurantWallet.find().lean();
    console.log(`RestaurantWallet docs (${restWallets.length}):`, restWallets.map(w => ({ restaurant: w.restaurant, totalEarnings: w.totalEarnings, balance: w.balance })));

    const settlementsCount = await SettlementLedger.countDocuments();
    const paymentTxCount = await PaymentTransaction.countDocuments();
    console.log(`SettlementLedger docs: ${settlementsCount}, PaymentTransaction docs: ${paymentTxCount}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkEarningsData();
