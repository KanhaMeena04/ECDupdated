const axios = require('axios');

async function testApi() {
  try {
    console.log("Testing GET /api/restaurants/admin...");
    const listRes = await axios.get("http://localhost:5000/api/restaurants/admin");
    console.log(`Received ${listRes.data.restaurants?.length} restaurants from API:`);
    listRes.data.restaurants.forEach((r, i) => {
      console.log(`${i+1}. [${r._id}] name="${r.name}" | phone="${r.phone}" | upi="${r.upi}" | address="${r.address}"`);
    });

    console.log("\nTesting GET /api/restaurants/admin/6a9fb15499866971ef57b56e (ELITE HOUSE CAFE)...");
    const eliteRes = await axios.get("http://localhost:5000/api/restaurants/admin/6a9fb15499866971ef57b56e");
    console.log(`ELITE HOUSE CAFE response: name=${eliteRes.data.restaurant?.name}, menuCategories=${Object.keys(eliteRes.data.menu || {})}`);

    console.log("\nTesting GET /api/restaurants/admin/6ab136bb4b156bd222c5dc68 (Pandit ji)...");
    const panditRes = await axios.get("http://localhost:5000/api/restaurants/admin/6ab136bb4b156bd222c5dc68");
    console.log(`Pandit ji response: name=${panditRes.data.restaurant?.name}, phone=${panditRes.data.restaurant?.phone}, upi=${panditRes.data.restaurant?.upi}, menu=${JSON.stringify(panditRes.data.menu)}`);
  } catch (err) {
    console.error("API Test Error:", err.response?.data || err.message);
  }
}

testApi();
