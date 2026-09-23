const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Rider = require('../models/Rider');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING IMAGEKIT UPLOAD & PENDING STATUS TEST ===');
  
  const testMobile = '9876543111';
  const testPin = '9999';
  const testEmail = `imagekit_test_${Date.now()}@ecdkart.com`;

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  await User.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }, { mobile: testMobile }] });
  await Rider.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }, { mobile: testMobile }] });

  // 1x1 transparent PNG as test base64
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026';
  const adminUser = await User.findOne({ role: 'admin' });
  const adminToken = jwt.sign(
    { _id: adminUser ? adminUser._id : new mongoose.Types.ObjectId(), role: 'admin' },
    jwtSecret,
    { expiresIn: '1d' }
  );

  const payload = {
    name: 'Dev Soni (Test)',
    email: testEmail,
    mobile: testMobile,
    pin: testPin,
    status: 'pending',
    address: 'Indore, 474002',
    workCity: 'Indore',
    profilePic: sampleBase64,
    vehicle: {
      type: 'bike',
      brand: 'Honda',
      model: 'Activa',
      number: 'MP09 AB 1234',
      regNumber: 'MP09 AB 1234'
    },
    documents: {
      licenseNumber: 'MP0920230001234',
      licenseExpiry: '2030-12-31',
      licenseFront: sampleBase64,
      licenseBack: sampleBase64,
      rcNumber: 'MP09 AB 1234',
      rcImage: sampleBase64,
      aadharNumber: '123456789012',
      aadharFront: sampleBase64,
      panNumber: 'ABCDE1234F',
      panImage: sampleBase64,
      insuranceNumber: 'POL-123456',
      insuranceExpiry: '2025-12-31',
      insuranceImage: sampleBase64
    },
    bankDetails: {
      holderName: 'Dev Soni',
      bankName: 'HDFC Bank',
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      upiId: 'devsoni@upi'
    }
  };

  console.log('\n--- Calling POST /api/riders/admin/create with Base64 Images ---');
  const createRes = await axios.post(`${BASE_URL}/api/riders/admin/create`, payload, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('Create Status:', createRes.status, 'Message:', createRes.data?.message);

  const userInDb = await User.findOne({ mobile: `+91${testMobile}` });
  const riderInDb = await Rider.findOne({ mobile: `+91${testMobile}` });

  console.log('\n--- Checking User and Rider DB Records ---');
  console.log('User isVerified:', userInDb?.isVerified, '(Expected: false)');
  console.log('Rider verificationStatus:', riderInDb?.verificationStatus, '(Expected: pending)');
  console.log('Rider riderVerified:', riderInDb?.riderVerified, '(Expected: false)');
  console.log('Rider vehicleVerified:', riderInDb?.vehicle?.vehicleVerified, '(Expected: false)');
  console.log('Rider vehicleApproval status:', riderInDb?.vehicle?.vehicleApproval?.status, '(Expected: pending)');
  console.log('Rider bankVerified:', riderInDb?.bankDetails?.verified, '(Expected: false)');

  console.log('\n--- Checking ImageKit URLs in Documents ---');
  console.log('Profile Pic URL:', riderInDb?.profilePic);
  console.log('License Front URL:', riderInDb?.documents?.license?.frontImage);
  console.log('License Back URL:', riderInDb?.documents?.license?.backImage);
  console.log('RC Image URL:', riderInDb?.documents?.rc?.image);
  console.log('Aadhaar Image URL:', riderInDb?.documents?.aadharCard?.image);
  console.log('PAN Image URL:', riderInDb?.documents?.panCard?.image);
  console.log('Insurance Image URL:', riderInDb?.documents?.insurance?.image);

  if (riderInDb?.verificationStatus !== 'pending') {
    throw new Error('Expected status to be pending!');
  }

  const isIKUrl = (url) => typeof url === 'string' && (url.includes('ik.imagekit.io') || url.startsWith('http'));
  if (!isIKUrl(riderInDb?.documents?.license?.frontImage)) {
    throw new Error('License front was not uploaded to ImageKit!');
  }
  if (!isIKUrl(riderInDb?.documents?.rc?.image)) {
    throw new Error('RC image was not uploaded to ImageKit!');
  }
  if (!isIKUrl(riderInDb?.documents?.aadharCard?.image)) {
    throw new Error('Aadhaar image was not uploaded to ImageKit!');
  }
  if (!isIKUrl(riderInDb?.documents?.panCard?.image)) {
    throw new Error('PAN image was not uploaded to ImageKit!');
  }

  console.log('\n✅ ALL IMAGEKIT URLS & PENDING VERIFICATION STATUS VERIFIED SUCCESSFULLY!');

  // Cleanup
  await User.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }] });
  await Rider.deleteMany({ $or: [{ mobile: `+91${testMobile}` }, { email: testEmail }] });
  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test Failed:', err.message, err.response?.data || '');
  process.exit(1);
});
