const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => resolve({ status: 'ERR', error: err.message }));
  });
}

async function testAll() {
  const endpoints = [
    '/api/home/sections',
    '/api/home/cms-sections',
    '/api/catalog/categories',
    '/api/catalog/products',
    '/api/restaurants',
    '/api/restaurants/list',
    '/api/home/banners',
    '/api/home/categories',
    '/api/home/recommended',
    '/api/home/explore',
    '/api/banners',
    '/api/categories',
    '/api/popular-dishes'
  ];

  console.log("=== TESTING BACKEND ENDPOINTS ON HTTP://127.0.0.1:5000 ===");
  for (const path of endpoints) {
    const res = await get(path);
    let summary = '';
    if (res.body) {
      if (Array.isArray(res.body)) {
        summary = `Array length: ${res.body.length}`;
        if (res.body.length > 0) {
          summary += ` | First item keys: [${Object.keys(res.body[0]).join(', ')}]`;
        }
      } else if (typeof res.body === 'object') {
        const keys = Object.keys(res.body);
        summary = `Object keys: [${keys.join(', ')}]`;
        if (res.body.categories) summary += ` | categories: ${res.body.categories.length}`;
        if (res.body.restaurants) summary += ` | restaurants: ${res.body.restaurants.length}`;
        if (res.body.products) summary += ` | products: ${res.body.products.length}`;
        if (res.body.banners) summary += ` | banners: ${res.body.banners.length}`;
        if (res.body.sections) {
          if (Array.isArray(res.body.sections)) summary += ` | sections count: ${res.body.sections.length}`;
          else if (typeof res.body.sections === 'object') summary += ` | sections keys: [${Object.keys(res.body.sections).join(', ')}]`;
        }
        if (res.body.message) summary += ` | message: "${res.body.message}"`;
      }
    } else if (res.error) {
      summary = `ERROR: ${res.error}`;
    } else {
      summary = res.raw ? res.raw.substring(0, 100) : '';
    }
    console.log(`[${res.status}] ${path} => ${summary}`);
  }
}

testAll();
