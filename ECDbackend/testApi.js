const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  const urls = [
    'http://127.0.0.1:5000/api/restaurants/list?lat=22.7196&lng=75.8577',
    'http://127.0.0.1:5000/api/restaurants/list?lat=22.7500&lng=75.8900',
    'http://127.0.0.1:5000/api/restaurants/list?lat=19.0760&lng=72.8777'
  ];
  
  for (const url of urls) {
    console.log('\nTesting GET:', url);
    const res = await get(url);
    console.log('Status:', res.status);
    try {
      const json = JSON.parse(res.data);
      console.log('Is Array?', Array.isArray(json));
      if (Array.isArray(json)) {
        console.log('Count:', json.length);
        json.forEach(r => console.log('  ->', r._id, r.name, r.city));
      } else {
        console.log('Body:', JSON.stringify(json, null, 2).slice(0, 300));
      }
    } catch (e) {
      console.log('Raw body:', res.data);
    }
  }
}

run().catch(console.error);
