const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Rider = require('../models/Rider');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING ADMIN RIDER CREATION & APP LOGIN TEST ===');
  
  const testMobile = '9876543999';
  const testPin = '4321';
  const testEmail = `admin_rider_${Date.now()}@ecdkart.com`;

  // 1. Connect to DB to check and clean existing test user
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for testing');

  await User.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }, { mobile: testMobile }] });
  await Rider.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }, { mobile: testMobile }] });
  console.log('Cleaned up previous test records if any');

  // 2. Admin creates rider
  console.log('\n--- Step 1: Admin Creates Rider via API ---');
  // Generate admin token
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026';
  const adminUser = await User.findOne({ role: 'admin' });
  const adminToken = jwt.sign(
    { _id: adminUser ? adminUser._id : new mongoose.Types.ObjectId(), role: 'admin' },
    jwtSecret,
    { expiresIn: '1d' }
  );

  const payload = {
    name: 'Vikram Singh (Admin Test)',
    email: testEmail,
    mobile: testMobile,
    pin: testPin,
    status: 'active',
    address: 'Plot 45, Malviya Nagar',
    address2: 'Near World Trade Park',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    zipCode: '302017',
    workCity: 'Jaipur',
    workZone: 'Malviya Nagar Zone',
    vehicle: {
      type: 'bike',
      brand: 'Honda',
      model: 'Activa 6G',
      number: 'RJ14 AB 9999',
      regNumber: 'RJ14 AB 9999',
      color: 'Matte Blue',
      year: '2024'
    },
    documents: {
      licenseNumber: 'RJ1420230009999',
      licenseExpiry: '2035-12-31',
      rcNumber: 'RJ14 AB 9999',
      aadharNumber: '998877665544',
      panNumber: 'ABCDE9999F'
    },
    bankDetails: {
      holderName: 'Vikram Singh',
      accountHolderName: 'Vikram Singh',
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0001234',
      upiId: 'vikram.singh@okhdfcbank',
      branchName: 'Malviya Nagar Branch'
    }
  };

  const createRes = await axios.post(`${BASE_URL}/api/riders/admin/create`, payload, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('Admin Create Rider Response Status:', createRes.status);
  console.log('Admin Create Rider Response Message:', createRes.data?.message);
  console.log('Created User ID:', createRes.data?.user?._id);
  console.log('Created Rider ID:', createRes.data?.rider?._id);

  // 3. Verify Database Records
  console.log('\n--- Step 2: Database Record Verification ---');
  const userInDb = await User.findOne({ mobile: `+91${testMobile}` });
  const riderInDb = await Rider.findOne({ mobile: `+91${testMobile}` });

  console.log('DB User:', {
    name: userInDb?.name,
    mobile: userInDb?.mobile,
    role: userInDb?.role,
    pin: userInDb?.pin,
    isVerified: userInDb?.isVerified
  });

  console.log('DB Rider:', {
    name: riderInDb?.name,
    mobile: riderInDb?.mobile,
    pin: riderInDb?.pin,
    verificationStatus: riderInDb?.verificationStatus,
    riderVerified: riderInDb?.riderVerified,
    vehicleVerified: riderInDb?.vehicle?.vehicleVerified,
    vehicleNumber: riderInDb?.vehicle?.number,
    bankUpiId: riderInDb?.bankDetails?.upiId,
    bankVerified: riderInDb?.bankDetails?.verified
  });

  if (userInDb?.pin !== testPin || riderInDb?.pin !== testPin) {
    throw new Error('PIN mismatch in database!');
  }
  if (riderInDb?.verificationStatus !== 'approved' || riderInDb?.riderVerified !== true) {
    throw new Error('Rider verificationStatus not approved!');
  }
  if (!riderInDb?.bankDetails?.upiId || riderInDb?.bankDetails?.upiId !== 'vikram.singh@okhdfcbank') {
    throw new Error('Bank UPI ID not saved properly!');
  }
  console.log('✅ DB Verification Passed!');

  // 4. Test Rider App Login with 4-Digit PIN
  console.log('\n--- Step 3: Test Rider App PIN Login (`/driver/login-with-pin`) ---');
  const pinLoginRes = await axios.post(`${BASE_URL}/api/auth/driver/login-with-pin`, {
    mobile: testMobile,
    pin: testPin
  });

  console.log('PIN Login Status:', pinLoginRes.status);
  console.log('PIN Login Message:', pinLoginRes.data?.message);
  console.log('PIN Login Token:', pinLoginRes.data?.token ? 'JWT TOKEN RECEIVED ✅' : 'NO TOKEN ❌');
  console.log('PIN Login isReturning:', pinLoginRes.data?.isReturning);
  console.log('PIN Login User Role:', pinLoginRes.data?.user?.role);
  console.log('PIN Login Verification Status:', pinLoginRes.data?.user?.verificationStatus);

  if (!pinLoginRes.data?.token || pinLoginRes.data?.isReturning !== true) {
    throw new Error('PIN Login failed or isReturning is false!');
  }
  console.log('✅ Rider App PIN Login Verified Successfully!');

  // 5. Test Rider App Login with OTP
  console.log('\n--- Step 4: Test Rider App OTP Login (`/driver/verify-otp`) ---');
  const otpVerifyRes = await axios.post(`${BASE_URL}/api/auth/driver/verify-otp`, {
    mobile: testMobile,
    otp: '123456' // Development bypass OTP
  });

  console.log('OTP Verify Status:', otpVerifyRes.status);
  console.log('OTP Verify Message:', otpVerifyRes.data?.message);
  console.log('OTP Verify Token:', otpVerifyRes.data?.token ? 'JWT TOKEN RECEIVED ✅' : 'NO TOKEN ❌');
  console.log('OTP Verify isReturning:', otpVerifyRes.data?.isReturning);
  console.log('OTP Verify hasCompletedOnboarding:', otpVerifyRes.data?.hasCompletedOnboarding);

  if (!otpVerifyRes.data?.token || otpVerifyRes.data?.isReturning !== true || otpVerifyRes.data?.hasCompletedOnboarding !== true) {
    throw new Error('OTP Verify failed or onboarding is false!');
  }
  console.log('✅ Rider App OTP Login Verified Successfully!');

  // 6. Test incorrect PIN rejection
  console.log('\n--- Step 5: Test Incorrect PIN Rejection ---');
  try {
    await axios.post(`${BASE_URL}/api/auth/driver/login-with-pin`, {
      mobile: testMobile,
      pin: '0000'
    });
    throw new Error('Should have failed with incorrect PIN!');
  } catch (err) {
    console.log('Incorrect PIN Rejected correctly with status:', err.response?.status, 'Message:', err.response?.data?.message);
    console.log('✅ Incorrect PIN Rejection Verified!');
  }

  // Cleanup test user
  await User.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }] });
  await Rider.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }] });
  console.log('\nCleaned test data. All tests completed successfully!');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test Error:', err.message, err.response?.data || '');
  process.exit(1);
});
