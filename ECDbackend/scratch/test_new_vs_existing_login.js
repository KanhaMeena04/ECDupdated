const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Rider = require('../models/Rider');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== TESTING NEW UNKNOWN NUMBER VS EXISTING RIDER LOGIN ===');
  
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const unknownMobile = '7000000001';
  const existingMobile = '7000000002';

  // Cleanup
  await User.deleteMany({ $or: [{ mobile: /7000000001/ }, { mobile: /7000000002/ }] });
  await Rider.deleteMany({ $or: [{ mobile: /7000000001/ }, { mobile: /7000000002/ }] });

  // 1. Create an existing rider for existingMobile
  const salt = await require('bcryptjs').genSalt(10);
  const user2 = await User.create({
    name: 'Existing Rider',
    email: 'existing_rider@ecdkart.com',
    mobile: `+91${existingMobile}`,
    phone: `+91${existingMobile}`,
    password: await require('bcryptjs').hash('1234', salt),
    pin: '1234',
    role: 'driver',
    isVerified: true
  });
  await Rider.create({
    user: user2._id,
    name: 'Existing Rider',
    mobile: `+91${existingMobile}`,
    phone: `+91${existingMobile}`,
    vehicle: { type: 'bike', number: 'RJ14 AB 1111' },
    verificationStatus: 'approved',
    riderVerified: true
  });

  // --- TEST 1: Unknown / New Phone Number ---
  console.log('\n--- TEST 1: UNKNOWN NUMBER (7000000001) ---');
  const sendRes1 = await axios.post(`${BASE_URL}/api/auth/driver/send-otp`, { mobile: unknownMobile });
  console.log('Send OTP isNewUser:', sendRes1.data?.isNewUser, '(Expected: true)');

  const verifyRes1 = await axios.post(`${BASE_URL}/api/auth/driver/verify-otp`, {
    mobile: unknownMobile,
    otp: '123456'
  });
  console.log('Verify OTP isReturning:', verifyRes1.data?.isReturning, '(Expected: false)');
  console.log('Verify OTP isNewUser:', verifyRes1.data?.isNewUser, '(Expected: true)');
  console.log('Verify OTP hasCompletedOnboarding:', verifyRes1.data?.hasCompletedOnboarding, '(Expected: false)');

  if (verifyRes1.data?.isReturning !== false || verifyRes1.data?.isNewUser !== true) {
    throw new Error('Unknown number must have isReturning: false and isNewUser: true!');
  }
  console.log('✅ TEST 1 PASSED: Unknown number correctly flags isReturning: false -> Will go to RegisterScreen!');

  // --- TEST 2: Existing Registered Rider ---
  console.log('\n--- TEST 2: EXISTING REGISTERED RIDER (7000000002) ---');
  const sendRes2 = await axios.post(`${BASE_URL}/api/auth/driver/send-otp`, { mobile: existingMobile });
  console.log('Send OTP isNewUser:', sendRes2.data?.isNewUser, '(Expected: false)');

  const verifyRes2 = await axios.post(`${BASE_URL}/api/auth/driver/verify-otp`, {
    mobile: existingMobile,
    otp: '123456'
  });
  console.log('Verify OTP isReturning:', verifyRes2.data?.isReturning, '(Expected: true)');
  console.log('Verify OTP isNewUser:', verifyRes2.data?.isNewUser, '(Expected: false)');
  console.log('Verify OTP hasCompletedOnboarding:', verifyRes2.data?.hasCompletedOnboarding, '(Expected: true)');

  if (verifyRes2.data?.isReturning !== true || verifyRes2.data?.isNewUser !== false) {
    throw new Error('Existing rider must have isReturning: true and isNewUser: false!');
  }
  console.log('✅ TEST 2 PASSED: Existing rider correctly flags isReturning: true -> Will go to DriverHomeScreen!');

  // Cleanup
  await User.deleteMany({ $or: [{ mobile: /7000000001/ }, { mobile: /7000000002/ }] });
  await Rider.deleteMany({ $or: [{ mobile: /7000000001/ }, { mobile: /7000000002/ }] });
  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test Failed:', err.message, err.response?.data || '');
  process.exit(1);
});
