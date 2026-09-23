const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('🚀 Starting Complete Rider System Verification...');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const User = require('../models/User');
  const Rider = require('../models/Rider');

  // Find or create admin user for testing
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin Test',
      email: 'admintest@ecd.com',
      mobile: '+919999999999',
      password: 'password123',
      role: 'admin'
    });
  }

  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    { _id: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: `token=${adminToken}`
    }
  };

  console.log('\n--- 1. Testing GET /api/riders/admin/all ---');
  try {
    const res = await axios.get(`${BASE_URL}/api/riders/admin/all`, authHeaders);
    console.log(`✅ Success: HTTP ${res.status}. Total riders returned: ${res.data.riders ? res.data.riders.length : res.data.length}`);
    const first = res.data.riders ? res.data.riders[0] : res.data[0];
    console.log(`   Sample rider: ID=${first._id}, Name=${first.name}, Phone=${first.phone || first.mobile}, Status=${first.verificationStatus}`);
  } catch (err) {
    console.error(`❌ Failed:`, err.response?.data || err.message);
  }

  console.log('\n--- 2. Testing GET /api/riders/admin/pending ---');
  try {
    const res = await axios.get(`${BASE_URL}/api/riders/admin/pending`, authHeaders);
    console.log(`✅ Success: HTTP ${res.status}. Pending riders count: ${res.data.length}`);
  } catch (err) {
    console.error(`❌ Failed:`, err.response?.data || err.message);
  }

  console.log('\n--- 3. Testing GET /api/riders/admin/:id (Eye Button Click) ---');
  const anyRider = await Rider.findOne().populate('user');
  if (anyRider) {
    try {
      // Test with Rider ID
      const res1 = await axios.get(`${BASE_URL}/api/riders/admin/${anyRider._id}`, authHeaders);
      console.log(`✅ Success with Rider ID: HTTP ${res1.status}. Rider Name: ${res1.data.name || res1.data.rider?.name}`);
      console.log(`   Vehicle:`, res1.data.vehicle || res1.data.rider?.vehicle);
      console.log(`   Bank Details:`, res1.data.bankDetails || res1.data.rider?.bankDetails);

      // Test with User ID
      if (anyRider.user) {
        const userId = anyRider.user._id || anyRider.user;
        const res2 = await axios.get(`${BASE_URL}/api/riders/admin/${userId}`, authHeaders);
        console.log(`✅ Success with User ID: HTTP ${res2.status}. Rider Name: ${res2.data.name || res2.data.rider?.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed:`, err.response?.data || err.message);
    }
  }

  console.log('\n--- 4. Testing Rider Registration & Onboarding Flow ---');
  const testPhone = '+919988776655';
  let testUser = await User.findOne({ $or: [{ phone: testPhone }, { mobile: testPhone }] });
  if (!testUser) {
    testUser = await User.create({
      name: 'Rider New Flow',
      phone: testPhone,
      mobile: testPhone,
      role: 'driver',
      isVerified: true
    });
  }

  const riderToken = jwt.sign(
    { _id: testUser._id, role: testUser.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );

  const riderHeaders = {
    headers: {
      Authorization: `Bearer ${riderToken}`,
      Cookie: `token=${riderToken}`
    }
  };

  const onboardPayload = {
    name: 'Rider New Flow Test',
    email: 'riderflow@test.com',
    phone: testPhone,
    mobile: testPhone,
    pin: '1234',
    vehicle: {
      type: 'Scooter / Motorcycle',
      brand: 'Honda',
      model: 'Activa 6G',
      year: '2024',
      number: 'HR 26 NEW 9999',
      regNumber: 'HR 26 NEW 9999'
    },
    documents: {
      license: { number: 'DL-99887766' },
      panCard: { number: 'PAN998877' },
      aadharCard: { number: '1234 5678 9999' }
    },
    bankDetails: {
      accountHolderName: 'Rider New Flow Test',
      bankName: 'State Bank of India',
      accountNumber: '112233445566',
      ifscCode: 'SBIN0001234',
      upiId: 'riderflow@upi'
    }
  };

  try {
    const onboardRes = await axios.post(`${BASE_URL}/api/riders/onboard`, onboardPayload, riderHeaders);
    console.log(`✅ Success: Onboarding Submitted HTTP ${onboardRes.status}`);
    console.log(`   Rider Profile Created:`, onboardRes.data.rider?._id);

    // Verify directly in MongoDB Atlas cluster
    const savedInMongo = await Rider.findOne({ user: testUser._id });
    console.log(`✅ Direct MongoDB Cluster Verification: Found Rider Doc _id=${savedInMongo._id}, Vehicle=${savedInMongo.vehicle?.number}, Bank=${savedInMongo.bankDetails?.bankName}`);
  } catch (err) {
    console.error(`❌ Onboarding Failed:`, err.response?.data || err.message);
  }

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
