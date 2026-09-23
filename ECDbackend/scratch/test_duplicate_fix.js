const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Rider = require('../models/Rider');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING TEST DUPLICATE FIX ===');
  
  const testMobile = '9691686211';
  const testPin = '1234';

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026';
  const adminUser = await User.findOne({ role: 'admin' });
  const adminToken = jwt.sign(
    { _id: adminUser ? adminUser._id : new mongoose.Types.ObjectId(), role: 'admin', email: 'admin@gmail.com' },
    jwtSecret,
    { expiresIn: '1d' }
  );

  // Payload with admin's email autofilled (simulate browser autofill of admin@gmail.com)
  const payload = {
    name: 'Dev Soni',
    email: 'admin@gmail.com', // Autofilled by browser
    mobile: testMobile,
    pin: testPin,
    status: 'pending',
    address: 'Indore, 474002',
    workCity: 'Indore',
    vehicle: {
      type: 'bike',
      brand: 'Honda',
      model: 'Activa',
      number: 'MP09 AB 1234',
      regNumber: 'MP09 AB 1234'
    }
  };

  console.log('\n--- Calling POST /api/riders/admin/create with autofilled admin@gmail.com ---');
  const createRes = await axios.post(`${BASE_URL}/api/riders/admin/create`, payload, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('Create Status:', createRes.status);
  console.log('Create Message:', createRes.data?.message);
  console.log('Created User Email:', createRes.data?.user?.email, '(Should be auto-generated unique rider email)');

  const userInDb = await User.findOne({ mobile: `+91${testMobile}` });
  const riderInDb = await Rider.findOne({ mobile: `+91${testMobile}` });

  console.log('User in DB:', { id: userInDb?._id, email: userInDb?.email, mobile: userInDb?.mobile });
  console.log('Rider in DB:', { id: riderInDb?._id, email: riderInDb?.email, mobile: riderInDb?.mobile });

  if (userInDb?.email === 'admin@gmail.com') {
    throw new Error('User email should not be admin@gmail.com!');
  }

  console.log('\n--- Testing Delete Rider ---');
  const deleteRes = await axios.delete(`${BASE_URL}/api/riders/admin/delete/${riderInDb._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Delete Status:', deleteRes.status, 'Message:', deleteRes.data?.message);

  const checkUserAfterDelete = await User.findOne({ mobile: `+91${testMobile}` });
  const checkRiderAfterDelete = await Rider.findOne({ mobile: `+91${testMobile}` });

  console.log('User after delete:', checkUserAfterDelete, '(Expected: null)');
  console.log('Rider after delete:', checkRiderAfterDelete, '(Expected: null)');

  if (checkUserAfterDelete !== null || checkRiderAfterDelete !== null) {
    throw new Error('User or Rider not deleted properly!');
  }

  console.log('\n✅ TEST PASSED PERFECTLY!');
  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test Failed:', err.message, err.response?.data || '');
  process.exit(1);
});
