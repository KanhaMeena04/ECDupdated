const http = require('http');

const req = http.get('http://127.0.0.1:5000/api/settings', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log(`Response Body: ${data}`);
  });
});

req.on('error', (err) => {
  console.error('HTTP Request Error:', err.message);
});
