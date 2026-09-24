const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).populate('restaurant customer rider');
    console.log(`Total recent orders in DB: ${orders.length}`);
    orders.forEach((o, i) => {
      console.log(`\n--- Order [${i+1}] ---`);
      console.log('ID:', o._id);
      console.log('Status:', o.status);
      console.log('OrderType / DeliveryType:', o.orderType, o.deliveryType);
      console.log('PaymentStatus:', o.paymentStatus, 'Method:', o.paymentMethod);
      console.log('Restaurant:', o.restaurant?.name || o.restaurant?._id || o.restaurant);
      console.log('Customer:', o.customer?.name || o.customer?.mobile || o.customer?._id);
      console.log('Rider:', o.rider?.name || o.rider?._id || 'Unassigned');
      console.log('Delivery Address:', o.deliveryAddress);
      console.log('Created At:', o.createdAt);
    });

    const riders = await Rider.find({}).select('name phone mobile isOnline isAvailable currentLocation verificationStatus');
    console.log('\n--- Active / Online Riders ---');
    riders.forEach(r => {
      console.log(`Rider: ${r.name} (${r.phone || r.mobile}) | Online: ${r.isOnline} | Avail: ${r.isAvailable} | Loc: ${JSON.stringify(r.currentLocation)} | Status: ${r.verificationStatus}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkOrders();
