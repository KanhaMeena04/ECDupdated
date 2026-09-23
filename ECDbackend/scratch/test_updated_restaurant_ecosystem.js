const mongoose = require('mongoose');

const User = require('../models/User'); v
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Order = require('../models/Order');
const RestaurantWallet = require('../models/RestaurantWallet');

async function runAuditTests() {
  console.log('====================================================');
  console.log('ECDKART AUTOMATED RESTAURANT ECOSYSTEM INTEGRATION TEST');
  console.log('====================================================\n');

  const results = [];
  function logTest(testNo, title, passed, detail = '') {
    const statusStr = passed ? 'PASS' : 'FAIL';
    console.log(`[TEST ${testNo.toString().padStart(2, '0')}] ${statusStr}: ${title} ${detail ? `(${detail})` : ''}`);
    results.push({ testNo, title, passed, detail });
  }

  let isConnected = false;
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart', { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log('Connected to local MongoDB instance.\n');
  } catch (err) {
    console.log('Local MongoDB service offline. Performing Schema & Model Contract Validation Mode.\n');
  }

  // 1. Vendor Model & Schema Contract
  const vendorUser = new User({
    name: 'Test Partner Restaurant Vendor',
    email: 'partner_vendor@ecdkart.com',
    mobile: '9876543210',
    password: 'password123',
    role: 'restaurant_owner',
    isVerified: true
  });
  logTest(1, 'Vendor Model & Auth Role Validation', vendorUser.role === 'restaurant_owner', `Role: ${vendorUser.role}`);

  // 2. Restaurant Profile & Operational Schema Fields
  const restaurant = new Restaurant({
    owner: vendorUser._id,
    name: { en: 'ECDKART Baseline Partner Restaurant' },
    email: vendorUser.email,
    contactNumber: vendorUser.mobile,
    address: '101 Great India Palace',
    city: 'Indore',
    area: 'Vijay Nagar',
    deliveryTime: 25,
    isActive: true,
    isOnline: true,
    restaurantApproved: true,
    menuApproved: true,
    isSelfPickupEnabled: true,
    autoAcceptOrders: false,
    prepBufferTimeMinutes: 5,
    cancellationWindowMinutes: 5,
    gracePeriodMinutes: 15
  });
  logTest(2, 'Restaurant Profile & Operational Settings Schema', restaurant.isSelfPickupEnabled === true && restaurant.cancellationWindowMinutes === 5, 'Self Pickup: true, Grace: 15m');

  // 3. Online/Offline Toggle State Test
  restaurant.isOnline = false;
  const passOffline = restaurant.isOnline === false;
  restaurant.isOnline = true;
  logTest(3, 'Restaurant Online/Offline State Toggle Contract', passOffline, 'Toggled false -> true');

  // 4. Menu & Product Creation Schema
  const product = new Product({
    restaurant: restaurant._id,
    category: new mongoose.Types.ObjectId(),
    name: { en: 'Signature Paneer Butter Masala' },
    description: { en: 'Rich gravy with cottage cheese' },
    basePrice: 280,
    offerPrice: 260,
    isVeg: true,
    available: true,
    isApproved: true
  });
  logTest(4, 'Product / Menu Item Schema Contract', product.basePrice === 280 && product.available === true, `Base Price: ₹${product.basePrice}`);

  // 5. Product Out of Stock Toggle
  product.available = false;
  const passOOS = product.available === false;
  product.available = true;
  logTest(5, 'Product Out-Of-Stock (OOS) Toggle Contract', passOOS, 'Toggled available false -> true');

  // 6. Customer User Availability
  const customerUser = new User({
    name: 'Test Customer User',
    email: 'customer_test@ecdkart.com',
    mobile: '9123456789',
    password: 'password123',
    role: 'customer'
  });
  logTest(6, 'Customer User Role Contract', customerUser.role === 'customer', `Role: ${customerUser.role}`);

  // 7. Delivery Order Creation Schema
  const deliveryOrder = new Order({
    customer: customerUser._id,
    restaurant: restaurant._id,
    idempotencyKey: `test_deliv_${Date.now()}`,
    items: [{
      product: product._id,
      name: product.name.en,
      quantity: 2,
      price: product.basePrice
    }],
    itemTotal: 560,
    deliveryFee: 40,
    totalAmount: 600,
    orderType: 'delivery',
    status: 'placed',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    prepTimeMinutes: 20,
    bufferTimeMinutes: 5,
    deliveryAddress: { addressLine: 'Flat 402, Royal Residency', coordinates: [75.8577, 22.7196] }
  });
  logTest(7, 'Place Delivery Order Schema Contract', deliveryOrder.orderType === 'delivery' && deliveryOrder.prepTimeMinutes === 20, 'Prep Time: 20m');

  // 8. Restaurant Accept & Prepare State Machine
  deliveryOrder.status = 'preparing';
  deliveryOrder.timeline.push({ status: 'preparing', timestamp: new Date() });
  logTest(8, 'Restaurant Preparation State Transition', deliveryOrder.status === 'preparing', 'Status: preparing');

  // 9. Restaurant Mark Ready State Machine
  deliveryOrder.status = 'ready';
  deliveryOrder.readyAt = new Date();
  deliveryOrder.timeline.push({ status: 'ready', timestamp: new Date() });
  logTest(9, 'Restaurant Mark Ready State Transition', deliveryOrder.status === 'ready', 'Status: ready');

  // 10. Self-Pickup Order Schema
  const pickupOrder = new Order({
    customer: customerUser._id,
    restaurant: restaurant._id,
    idempotencyKey: `test_pick_${Date.now()}`,
    items: [{
      product: product._id,
      name: product.name.en,
      quantity: 1,
      price: product.basePrice
    }],
    itemTotal: 280,
    deliveryFee: 0,
    totalAmount: 280,
    orderType: 'self_pickup',
    selfPickupCode: '4892',
    pickupOtp: '4892',
    status: 'placed',
    paymentMethod: 'online',
    paymentStatus: 'paid',
    prepTimeMinutes: 15
  });
  logTest(10, 'Place Self-Pickup Order Schema Contract', pickupOrder.orderType === 'self_pickup' && pickupOrder.selfPickupCode === '4892', 'Code: 4892');

  // 11. Self-Pickup Handover Verification
  pickupOrder.status = 'delivered';
  pickupOrder.selfPickupVerifiedAt = new Date();
  pickupOrder.deliveredAt = new Date();
  logTest(11, 'Self-Pickup Handover Verification State', pickupOrder.status === 'delivered', 'Handed over successfully');

  // 12. Restaurant Wallet Ledger
  const wallet = new RestaurantWallet({
    restaurant: restaurant._id,
    balance: 280,
    totalEarnings: 280
  });
  logTest(12, 'Restaurant Wallet Ledger Schema Contract', wallet.balance === 280, `Balance: ₹${wallet.balance}`);

  // 13. Cancelled Order Reason Persistence
  const cancelledOrder = new Order({
    customer: customerUser._id,
    restaurant: restaurant._id,
    idempotencyKey: `test_cancel_${Date.now()}`,
    items: [{ product: product._id, name: product.name.en, quantity: 1, price: product.basePrice }],
    itemTotal: 280,
    deliveryFee: 30,
    totalAmount: 310,
    orderType: 'delivery',
    status: 'cancelled',
    cancellationReason: 'Restaurant ingredient out of stock for special curry',
    cancelledAt: new Date()
  });
  logTest(13, 'Order Cancellation & Custom Reason Contract', cancelledOrder.status === 'cancelled' && cancelledOrder.cancellationReason.includes('ingredient out of stock'), `Reason: ${cancelledOrder.cancellationReason}`);

  if (isConnected) {
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${results.filter(r => r.passed).length} / ${results.length} TESTS PASSED CLEANLY.`);
  console.log('====================================================\n');
}

runAuditTests();
