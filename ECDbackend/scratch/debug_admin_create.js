const http = require('http');

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
      timeout: 5000
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

async function debugAdminCreate() {
  const adminLoginRes = await apiCall('POST', '/auth/login', { email: 'admin@gmail.com', password: 'admin123' });
  const adminToken = adminLoginRes.body?.token;
  console.log('Admin Token:', adminToken ? 'RECEIVED' : 'FAILED');

  const uniqueId = Date.now();
  const ownerEmail = `audit_diner_${uniqueId}@ecdkart.com`;
  const res = await apiCall('POST', '/restaurants/admin/create', {
    name: 'Debug Diner',
    description: 'Debug Diner Description',
    email: ownerEmail,
    ownerName: 'Debug Owner',
    ownerEmail: ownerEmail,
    ownerMobile: `9876${uniqueId.toString().slice(-6)}`,
    ownerPassword: 'password123',
    contactNumber: `9876${uniqueId.toString().slice(-6)}`,
    address: '123 Debug St',
    city: 'Indore',
    area: 'Vijay Nagar',
    deliveryTime: 20
  }, adminToken);

  console.log('Result Status:', res.statusCode);
  console.log('Result Body:', JSON.stringify(res.body, null, 2));
}

debugAdminCreate();
