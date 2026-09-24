const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const riderController = require('../controllers/riderController');

async function testRiderEndpoints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Test getPendingRiders
    const mockReqPending = { query: {} };
    let pendingResult = null;
    const mockResPending = {
      status: (code) => ({
        json: (data) => {
          pendingResult = { code, data };
        }
      })
    };
    await riderController.getPendingRiders(mockReqPending, mockResPending);
    console.log('Pending Riders count:', Array.isArray(pendingResult.data) ? pendingResult.data.length : 'Not array');
    const rohitPending = Array.isArray(pendingResult.data) ? pendingResult.data.find(r => (r.phone && r.phone.includes('9179916404')) || (r.mobile && r.mobile.includes('9179916404')) || (r.name && r.name.toLowerCase().includes('rohit'))) : null;
    console.log('Rohit in Pending Riders:', rohitPending ? { id: rohitPending._id, name: rohitPending.name, phone: rohitPending.phone, status: rohitPending.verificationStatus } : 'NOT FOUND');

    // Test getAllRiders
    const mockReqAll = { query: {} };
    let allResult = null;
    const mockResAll = {
      status: (code) => ({
        json: (data) => {
          allResult = { code, data };
        }
      })
    };
    await riderController.getAllRiders(mockReqAll, mockResAll);
    console.log('All Riders count:', allResult.data?.riders?.length);
    const rohitAll = allResult.data?.riders?.find(r => (r.phone && r.phone.includes('9179916404')) || (r.mobile && r.mobile.includes('9179916404')) || (r.name && r.name.toLowerCase().includes('rohit')));
    console.log('Rohit in All Riders:', rohitAll ? { id: rohitAll._id, name: rohitAll.name, phone: rohitAll.phone, status: rohitAll.verificationStatus } : 'NOT FOUND');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testRiderEndpoints();
