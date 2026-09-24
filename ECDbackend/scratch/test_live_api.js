const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const adminUser = await User.findOne({ role: 'admin' });
    console.log('Admin user found:', adminUser?._id, adminUser?.email);
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026';
    const token = jwt.sign({ _id: adminUser._id.toString(), role: 'admin' }, jwtSecret, { expiresIn: '1d' });

    const pendingRes = await axios.get('http://127.0.0.1:5000/api/riders/admin/pending', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Pending drivers count from API:', pendingRes.data?.length);
    const rohitP = pendingRes.data?.find(r => (r.phone && r.phone.includes('9179916404')) || (r.name && r.name.includes('Rohit')));
    console.log('Rohit in Pending API:', rohitP ? { id: rohitP._id, name: rohitP.name, phone: rohitP.phone, status: rohitP.verificationStatus } : 'NOT FOUND');

    const allRes = await axios.get('http://127.0.0.1:5000/api/riders/admin/all', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('All riders count from API:', allRes.data?.riders?.length);
    const rohitA = allRes.data?.riders?.find(r => (r.phone && r.phone.includes('9179916404')) || (r.name && r.name.includes('Rohit')));
    console.log('Rohit in All API:', rohitA ? { id: rohitA._id, name: rohitA.name, phone: rohitA.phone, status: rohitA.verificationStatus } : 'NOT FOUND');

  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

test();
