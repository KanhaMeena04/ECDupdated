const http = require('http');

function makeRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Backend Rider Auth Verification...');

  // Test 1: Wrong PIN
  console.log('\n--- Test 1: PIN Login with WRONG PIN (9999) ---');
  const res1 = await makeRequest('/api/auth/driver/login-with-pin', {
    phone: '+919179916404',
    pin: '9999'
  });
  console.log('Status:', res1.status, 'Body:', res1.body);
  if (res1.status === 401 && res1.body.success === false) {
    console.log('✅ Test 1 Passed: Wrong PIN correctly rejected with 401!');
  } else {
    console.error('❌ Test 1 Failed: Expected 401 rejected, got:', res1);
  }

  // Test 2: Correct PIN
  console.log('\n--- Test 2: PIN Login with CORRECT PIN (1234) ---');
  const res2 = await makeRequest('/api/auth/driver/login-with-pin', {
    phone: '+919179916404',
    pin: '1234'
  });
  console.log('Status:', res2.status, 'Body success:', res2.body.success, 'Token present:', !!res2.body.token, 'isReturning:', res2.body.isReturning);
  if (res2.status === 200 && res2.body.success === true && res2.body.token) {
    console.log('✅ Test 2 Passed: Correct PIN successfully logged in with 200!');
  } else {
    console.error('❌ Test 2 Failed: Expected 200 success, got:', res2);
  }

  // Test 3: Send OTP for existing user
  console.log('\n--- Test 3: Send OTP for 9179916404 ---');
  const res3 = await makeRequest('/api/auth/driver/send-otp', {
    phone: '+919179916404'
  });
  console.log('Status:', res3.status, 'Body:', res3.body);
  if (res3.status === 200 && res3.body.isNewUser === false) {
    console.log('✅ Test 3 Passed: Identified as existing rider (isNewUser: false)!');
  } else {
    console.error('❌ Test 3 Failed:', res3);
  }

  // Test 4: Verify OTP for existing user
  console.log('\n--- Test 4: Verify OTP for 9179916404 with test OTP 123456 ---');
  const res4 = await makeRequest('/api/auth/driver/verify-otp', {
    phone: '+919179916404',
    otp: '123456'
  });
  console.log('Status:', res4.status, 'Body success:', res4.body.success, 'isReturning:', res4.body.isReturning, 'isNewUser:', res4.body.isNewUser);
  if (res4.status === 200 && res4.body.isReturning === true && res4.body.isNewUser === false) {
    console.log('✅ Test 4 Passed: Verify OTP returned isReturning: true (will NOT redirect to register)!');
  } else {
    console.error('❌ Test 4 Failed:', res4);
  }

  // Test 5: PIN login non-existent user
  console.log('\n--- Test 5: PIN Login with non-existent phone ---');
  const res5 = await makeRequest('/api/auth/driver/login-with-pin', {
    phone: '+918888777766',
    pin: '1234'
  });
  console.log('Status:', res5.status, 'Body:', res5.body);
  if (res5.status === 404 && res5.body.success === false) {
    console.log('✅ Test 5 Passed: Non-existent phone rejected with 404!');
  } else {
    console.error('❌ Test 5 Failed:', res5);
  }

  console.log('\n🎉 All Backend Tests Completed!');
}

runTests().catch(console.error);
