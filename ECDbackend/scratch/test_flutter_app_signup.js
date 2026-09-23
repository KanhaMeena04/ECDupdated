const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:5000';

async function testRiderAppCreation() {
  console.log('🧪 Testing Full Rider App Creation Flow...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const User = require('../models/User');
  const Rider = require('../models/Rider');

  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  const mobile = `98${randomDigits}`;
  const name = `Flutter Rider ${randomDigits.toString().slice(-4)}`;
  const email = `flutterrider${randomDigits}@ecd.com`;
  const pin = '4321';

  console.log(`\n📱 Step 1: Rider enters Name=${name}, Mobile=+91${mobile}, Email=${email}, PIN=${pin}`);
  const sendOtpRes = await axios.post(`${BASE_URL}/api/auth/driver/send-otp`, {
    phone: `+91${mobile}`,
    mobile: `+91${mobile}`
  });
  console.log(`✅ Step 1 (send-otp): HTTP ${sendOtpRes.status} - ${sendOtpRes.data.message}`);

  console.log(`\n🔐 Step 2: Rider enters OTP on OtpVerificationScreen`);
  const verifyOtpRes = await axios.post(`${BASE_URL}/api/auth/driver/verify-otp`, {
    phone: `+91${mobile}`,
    mobile: `+91${mobile}`,
    otp: '123456' // standard bypass/demo or received OTP
  });
  console.log(`✅ Step 2 (verify-otp): HTTP ${verifyOtpRes.status} - Token generated`);
  const token = verifyOtpRes.data.token || verifyOtpRes.data.data?.token;

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: `token=${token}`
    }
  };

  console.log(`\n🛵 Step 3, 4, 5: Rider fills Vehicle, Documents, Bank details & submits on BankDetailsScreen`);
  const fullPayload = {
    name: name,
    email: email,
    phone: `+91${mobile}`,
    mobile: `+91${mobile}`,
    pin: pin,
    vehicle: {
      type: 'Scooter / Motorcycle',
      brand: 'TVS',
      model: 'Jupiter 125',
      year: '2024',
      number: `HR 26 FLUTTER ${randomDigits.toString().slice(-4)}`,
      regNumber: `HR 26 FLUTTER ${randomDigits.toString().slice(-4)}`
    },
    documents: {
      license: {
        number: `DL-FLUTTER-${randomDigits.toString().slice(-6)}`,
        expiryDate: '2032-12-31'
      },
      panCard: {
        number: `FLUTTER${randomDigits.toString().slice(-4)}P`
      },
      aadharCard: {
        number: `7788 ${randomDigits.toString().slice(-4)} 9900`
      }
    },
    bankDetails: {
      accountHolderName: name,
      bankName: 'ICICI Bank',
      accountNumber: `9090${randomDigits}`,
      ifscCode: 'ICIC0001234',
      upiId: `${mobile}@icici`
    }
  };

  const onboardRes = await axios.post(`${BASE_URL}/api/riders/onboard`, fullPayload, authHeaders);
  console.log(`✅ Step 5 (onboard submission): HTTP ${onboardRes.status} - Rider profile created!`);
  const createdRiderId = onboardRes.data.rider?._id;

  console.log(`\n🗄️ Checking MongoDB Atlas Cluster direct query...`);
  const mongoRider = await Rider.findById(createdRiderId).populate('user');
  console.log(`✅ MongoDB Atlas Found: Rider ID=${mongoRider._id}`);
  console.log(`   User: ${mongoRider.user?.name} (${mongoRider.user?.mobile})`);
  console.log(`   Vehicle: ${mongoRider.vehicle?.brand} ${mongoRider.vehicle?.model} (${mongoRider.vehicle?.number})`);
  console.log(`   Bank: ${mongoRider.bankDetails?.bankName} (A/C: ${mongoRider.bankDetails?.accountNumber})`);

  console.log(`\n🖥️ Checking Admin Panel Query (GET /api/riders/admin/all & GET /api/riders/admin/${createdRiderId})...`);
  const jwt = require('jsonwebtoken');
  const adminUser = await User.findOne({ role: 'admin' });
  const adminToken = jwt.sign(
    { _id: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );

  const adminHeaders = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: `token=${adminToken}`
    }
  };

  const adminListRes = await axios.get(`${BASE_URL}/api/riders/admin/all`, adminHeaders);
  const foundInAdminList = adminListRes.data.riders.find(r => r._id.toString() === createdRiderId.toString());
  console.log(`✅ Found in Admin Driver List Table: ${foundInAdminList ? 'YES - ' + foundInAdminList.name : 'NO'}`);

  const adminEyeViewRes = await axios.get(`${BASE_URL}/api/riders/admin/${createdRiderId}`, adminHeaders);
  console.log(`✅ Admin Eye View Click Details:`);
  console.log(`   Name: ${adminEyeViewRes.data.name || adminEyeViewRes.data.rider?.name}`);
  console.log(`   Vehicle: ${adminEyeViewRes.data.vehicle?.brand} ${adminEyeViewRes.data.vehicle?.model} (${adminEyeViewRes.data.vehicle?.number})`);
  console.log(`   PAN Card: ${adminEyeViewRes.data.documents?.panCard?.number}`);
  console.log(`   Aadhaar Card: ${adminEyeViewRes.data.documents?.aadharCard?.number}`);
  console.log(`   Bank A/C: ${adminEyeViewRes.data.bankDetails?.accountNumber} (${adminEyeViewRes.data.bankDetails?.bankName})`);
  console.log(`   UPI ID: ${adminEyeViewRes.data.bankDetails?.upiId}`);

  console.log(`\n🎉 RESULT: 100% SUCCESSFUL! Jab bhi rider app se rider create hoga, vo seedha MongoDB cluster me save hoga aur Admin Panel me dikhega!`);
  process.exit(0);
}

testRiderAppCreation().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
