const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.slice(0, 100) });
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING USER APP HOME API INTEGRATION TESTS");
  console.log("==========================================\n");

  const endpoints = [
    '/api/home/sections',
    '/api/categories',
    '/api/banners',
    '/api/popular-dishes',
    '/api/restaurants/list',
    '/api/home/recommended',
  ];

  for (const ep of endpoints) {
    try {
      const res = await makeRequest(ep);
      const count = res.body?.categories?.length ?? res.body?.banners?.length ?? res.body?.restaurants?.length ?? res.body?.sections?.length ?? res.body?.dishes?.length ?? 0;
      console.log(`✅ [${res.status}] ${ep} => Count: ${count}`);
      if (ep === '/api/categories') {
        console.log("   Categories:", res.body?.categories?.map(c => c.name || c.title));
      }
      if (ep === '/api/restaurants/list') {
        console.log("   Restaurants:", res.body?.restaurants?.map(r => ({ name: r.name, city: r.city })));
      }
    } catch (err) {
      console.log(`❌ ${ep} => Error: ${err.message}`);
    }
  }

  // Test Product Menu for Kesari Jalebi
  try {
    const res = await makeRequest('/api/restaurants/6aa937cb4a392c12390fdbc8');
    console.log(`\n✅ [${res.status}] GET /api/restaurants/6aa937cb4a392c12390fdbc8 (Sohna Sweets)`);
    if (res.body?.menu) {
      const items = Object.values(res.body.menu).flatMap(cat => cat.items || []);
      const jalebi = items.find(i => {
        const nameStr = typeof i.name === 'string' ? i.name : (i.name?.en || '');
        return nameStr.includes('Jalebi');
      });
      if (jalebi) {
        console.log("   Kesari Jalebi Effective Price:", jalebi.price, "(Original Base Price:", jalebi.originalBasePrice, ", MRP:", jalebi.mrp, ")");
      } else {
        console.log("   Items found:", items.map(i => typeof i.name === 'string' ? i.name : i.name?.en));
      }
    }

  } catch (err) {
    console.log(`❌ Menu fetch error: ${err.message}`);
  }
}

// Start temporary backend server and run tests
const { exec } = require('child_process');
console.log("Starting server for test verification...");
const serverProc = exec('node Server.js', { cwd: __dirname + '/..' });

let testsRan = false;
serverProc.stdout.on('data', async (d) => {
  const str = d.toString();
  console.log('[SERVER]', str.trim());
  if ((str.includes('Server running') || str.includes('DB connect')) && !testsRan) {
    testsRan = true;
    setTimeout(async () => {
      await runTests();
      serverProc.kill();
      process.exit(0);
    }, 1000);
  }
});
serverProc.stderr.on('data', (d) => {
  console.error('[SERVER ERR]', d.toString().trim());
});


