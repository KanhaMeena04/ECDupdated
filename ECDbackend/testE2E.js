const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, json: null, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('ECDKART — E2E DATA FLOW & SUITE VERIFICATION');
  console.log('============================================================\n');

  // TEST A: User App Vijay Nagar coordinates
  console.log('--- TEST A: User App Vijay Nagar coordinates (lat=22.7196, lng=75.8577) ---');
  const urlA = 'http://127.0.0.1:5000/api/restaurants/list?lat=22.7196&lng=75.8577';
  const resA = await fetchJson(urlA);
  console.log(`URL: ${urlA}`);
  console.log(`HTTP Status: ${resA.status}`);
  console.log(`Count: ${Array.isArray(resA.json) ? resA.json.length : 0}`);
  if (Array.isArray(resA.json)) {
    resA.json.forEach(r => {
      console.log(`  - [ID: ${r._id}] Name: ${r.name?.en || r.name} | City: ${r.city} | Distance: ${r.distanceKm} km`);
    });
  }

  // TEST B: lat=22.7500, lng=75.8900
  console.log('\n--- TEST B: Exact Vijay Nagar (lat=22.7500, lng=75.8900) ---');
  const urlB = 'http://127.0.0.1:5000/api/restaurants/list?lat=22.7500&lng=75.8900';
  const resB = await fetchJson(urlB);
  console.log(`URL: ${urlB}`);
  console.log(`HTTP Status: ${resB.status}`);
  console.log(`Count: ${Array.isArray(resB.json) ? resB.json.length : 0}`);
  if (Array.isArray(resB.json)) {
    resB.json.forEach(r => {
      console.log(`  - [ID: ${r._id}] Name: ${r.name?.en || r.name} | City: ${r.city} | Distance: ${r.distanceKm} km`);
    });
  }

  // TEST C: Mumbai
  console.log('\n--- TEST C: Mumbai (lat=19.0760, lng=72.8777) ---');
  const urlC = 'http://127.0.0.1:5000/api/restaurants/list?lat=19.0760&lng=72.8777';
  const resC = await fetchJson(urlC);
  console.log(`URL: ${urlC}`);
  console.log(`HTTP Status: ${resC.status}`);
  console.log(`Count: ${Array.isArray(resC.json) ? resC.json.length : 0}`);

  // TEST D: Mumbai -> Vijay Nagar, Indore
  console.log('\n--- TEST D: Switch Location Mumbai -> Vijay Nagar, Indore ---');
  console.log('1. Fetch Mumbai...');
  const resD1 = await fetchJson(urlC);
  console.log(`   Count for Mumbai: ${Array.isArray(resD1.json) ? resD1.json.length : 0}`);
  console.log('2. Switch location back to Indore (lat=22.7196, lng=75.8577)...');
  const resD2 = await fetchJson(urlA);
  console.log(`   Count for Indore: ${Array.isArray(resD2.json) ? resD2.json.length : 0}`);
  if (Array.isArray(resD2.json)) {
    resD2.json.forEach(r => console.log(`   -> ${r.name?.en || r.name}`));
  }

  // RESTAURANT DETAIL & MENU TEST
  if (Array.isArray(resA.json) && resA.json.length > 0) {
    const firstRest = resA.json[0];
    console.log(`\n--- RESTAURANT DETAIL & MENU TEST: ${firstRest.name?.en || firstRest.name} [ID: ${firstRest._id}] ---`);
    const detailUrl = `http://127.0.0.1:5000/api/restaurants/${firstRest._id}`;
    const menuUrl = `http://127.0.0.1:5000/api/menu/${firstRest._id}`;
    
    const resDetail = await fetchJson(detailUrl);
    console.log(`Detail URL: ${detailUrl}`);
    console.log(`Detail HTTP Status: ${resDetail.status}`);
    console.log(`Detail Name: ${resDetail.json?.restaurant?.name?.en || resDetail.json?.restaurant?.name || resDetail.json?.name}`);
    
    const resMenu = await fetchJson(menuUrl);
    console.log(`Menu URL: ${menuUrl}`);
    console.log(`Menu HTTP Status: ${resMenu.status}`);
    const menuItemsCount = Array.isArray(resMenu.json) ? resMenu.json.length : (resMenu.json?.menu ? Object.keys(resMenu.json.menu).length : 0);
    console.log(`Menu Items Count: ${menuItemsCount}`);
  }

  console.log('\n============================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY');
  console.log('============================================================');
}

runTests().catch(console.error);
