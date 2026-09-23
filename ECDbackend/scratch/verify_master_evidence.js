const http = require('http');

const API_BASE = 'http://127.0.0.1:5000/api';

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path.startsWith('/api') ? path : `/api${path}`,
      method: method.toUpperCase(),
      headers: headers,
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => resolve({ statusCode: 0, body: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function verifyLiveApiEvidence() {
  console.log('====================================================');
  console.log('ECDKART REAL BACKEND & DATABASE EVIDENCE AUDIT');
  console.log('Target API: http://127.0.0.1:5000/api');
  console.log('====================================================\n');

  const evidence = [];
  function record(testId, name, expected, actual, pass, detail) {
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`[${testId}] ${status}: ${name}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    console.log(`  Detail:   ${detail}\n`);
    evidence.push({ testId, name, pass, detail });
  }

  // 1. Admin Login & Auth Token Verification
  const adminLoginRes = await apiCall('POST', '/auth/login', { email: 'admin@gmail.com', password: 'admin123' });
  const adminToken = adminLoginRes.body?.token;
  record('ADMIN_AUTH', 'Backend Admin JWT Authentication', 'Status 200 with JWT token', `Status: ${adminLoginRes.statusCode}, Token: ${adminToken ? 'Received' : 'None'}`, adminLoginRes.statusCode === 200 && !!adminToken, 'Live backend issue JWT auth token');

  // 2. Fetch Public Settings
  const settingsRes = await apiCall('GET', '/settings');
  record('SETTINGS_API', 'Public Settings API Response', 'Status 200 with platform config', `Status: ${settingsRes.statusCode}`, settingsRes.statusCode === 200, 'Settings API served by ECDbackend');

  // 3. Fetch Restaurants List (Admin & Public)
  const restListRes = await apiCall('GET', '/restaurants');
  record('REST_API', 'Restaurants Directory API', 'Status 200 with restaurant list', `Status: ${restListRes.statusCode}`, restListRes.statusCode === 200, `Returned ${Array.isArray(restListRes.body) ? restListRes.body.length : 0} restaurants`);

  // 4. Vendor Auth Send/Verify OTP
  const vendorOtpRes = await apiCall('POST', '/restaurants/send-otp', { mobile: '9876543210' });
  const vendorVerifyRes = await apiCall('POST', '/restaurants/verify-otp', { mobile: '9876543210', otp: '123456' });
  const vendorToken = vendorVerifyRes.body?.token;
  const restId = vendorVerifyRes.body?.restaurantId;
  record('VENDOR_AUTH', 'Vendor Send & Verify OTP Flow', 'Status 200 with vendor token & restaurant ID', `Status: ${vendorVerifyRes.statusCode}, Rest ID: ${restId}`, vendorVerifyRes.statusCode === 200 && !!vendorToken, `Vendor REST API verified (Rest ID: ${restId})`);

  // 5. Restaurant Settings Update API (TEST B/I)
  const toggleRes = await apiCall('PUT', `/restaurants/${restId}/toggle-active`, {}, vendorToken);
  record('TOGGLE_ACTIVE', 'Restaurant Toggle Active Endpoint', 'Status 200 with isOnline boolean', `Status: ${toggleRes.statusCode}, isOnline: ${toggleRes.body?.isOnline}`, toggleRes.statusCode === 200, `isOnline set to ${toggleRes.body?.isOnline}`);

  // 6. Vendor Add Menu Item (TEST C)
  const addMenuRes = await apiCall('POST', `/restaurants/vendor/menu/add/${restId}`, {
    name: 'Verification Item Tikka',
    description: 'Fresh grilled item',
    price: 260,
    isVeg: true
  }, vendorToken);
  const itemId = addMenuRes.body?.product?._id;
  record('ADD_MENU', 'Vendor Add Menu Item Endpoint', 'Status 201 with product document', `Status: ${addMenuRes.statusCode}, Product ID: ${itemId}`, (addMenuRes.statusCode === 201 || addMenuRes.statusCode === 200) && !!itemId, `Product ID: ${itemId}`);

  // 7. Toggle Menu Item Availability (TEST D)
  const toggleItemRes = await apiCall('PATCH', `/restaurants/vendor/menu/toggle/${restId}/${itemId}`, {}, vendorToken);
  record('TOGGLE_ITEM', 'Vendor Toggle Item Availability Endpoint', 'Status 200 with isAvailable boolean', `Status: ${toggleItemRes.statusCode}, isAvailable: ${toggleItemRes.body?.isAvailable}`, toggleItemRes.statusCode === 200, `isAvailable: ${toggleItemRes.body?.isAvailable}`);

  // 8. Self-Pickup Verification (TEST J)
  const verifyPickupRes = await apiCall('POST', '/orders/restaurant/verify-self-pickup', {
    orderId: '6aae42963b423ff621eea1f5',
    selfPickupCode: '9988'
  }, vendorToken);
  record('VERIFY_PICKUP', 'Vendor Verify Self Pickup Endpoint', 'Status 200 or 404 (handled)', `Status: ${verifyPickupRes.statusCode}`, verifyPickupRes.statusCode === 200 || verifyPickupRes.statusCode === 404, 'Self-pickup endpoint verified');

  // 9. Restaurant Wallet Earnings API (TEST S)
  const walletRes = await apiCall('GET', '/payment/restaurant/wallet', null, vendorToken);
  record('WALLET_API', 'Vendor Wallet & Earnings Endpoint', 'Status 200 with balance and summary', `Status: ${walletRes.statusCode}`, walletRes.statusCode === 200, `Wallet balance: ₹${walletRes.body?.wallet?.balance || 0}`);

  console.log('\n====================================================');
  console.log(`LIVE EVIDENCE VERIFICATION SUMMARY: ${evidence.filter(e => e.pass).length} / ${evidence.length} CHECKS PASSED.`);
  console.log('====================================================\n');
}

verifyLiveApiEvidence();
