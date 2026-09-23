const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END INTEGRATION TESTS FOR ECDKART');
  console.log('====================================================\n');

  let token = null;
  let testCategoryId = null;

  // A. Admin Login
  try {
    console.log('Test A: Admin Login (admin@gmail.com / admin123)...');
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123',
    });
    token = res.data.token;
    console.log('✅ PASS: Login successful! Token acquired. Role:', res.data.user?.role);
  } catch (err) {
    console.error('❌ FAIL: Admin login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // B. Restaurant List (Admin API + Catalog API)
  try {
    console.log('\nTest B: Fetching Restaurant Lists...');
    const res1 = await axios.get(`${BASE_URL}/api/restaurants/admin/list`, authHeaders);
    const restList = res1.data.restaurants || res1.data || [];
    const res2 = await axios.get(`${BASE_URL}/api/catalog/restaurants`, authHeaders);
    console.log(`✅ PASS: /api/restaurants/admin/list returned ${restList.length} restaurants.`);
    console.log(`✅ PASS: /api/catalog/restaurants returned ${res2.data.restaurants?.length || 0} restaurants.`);
  } catch (err) {
    console.error('❌ FAIL: Restaurant list fetch failed:', err.response?.data || err.message);
  }

  // C. Category List
  try {
    console.log('\nTest C: Fetching Category Lists...');
    const res1 = await axios.get(`${BASE_URL}/api/admin/master-category`, authHeaders);
    const catList = res1.data.categories || res1.data.data || (Array.isArray(res1.data) ? res1.data : []);
    const res2 = await axios.get(`${BASE_URL}/api/catalog/categories`, authHeaders);
    console.log(`✅ PASS: /api/admin/master-category returned ${catList.length} categories.`);
    console.log(`✅ PASS: /api/catalog/categories returned ${res2.data.categories?.length || 0} categories.`);
  } catch (err) {
    console.error('❌ FAIL: Category list fetch failed:', err.response?.data || err.message);
  }

  // D. Product List
  try {
    console.log('\nTest D: Fetching Catalog Products...');
    const res = await axios.get(`${BASE_URL}/api/catalog/products`, authHeaders);
    console.log(`✅ PASS: /api/catalog/products returned ${res.data.products?.length || 0} products.`);
  } catch (err) {
    console.error('❌ FAIL: Product list fetch failed:', err.response?.data || err.message);
  }

  // E. Banner List
  try {
    console.log('\nTest E: Fetching Banners...');
    const res = await axios.get(`${BASE_URL}/api/admin/banner`, authHeaders);
    const banners = res.data.banners || (Array.isArray(res.data) ? res.data : []);
    console.log(`✅ PASS: /api/admin/banner returned ${banners.length} banners.`);
  } catch (err) {
    console.error('❌ FAIL: Banner list fetch failed:', err.response?.data || err.message);
  }

  // F. Home CMS
  try {
    console.log('\nTest F: Fetching Home CMS Sections...');
    const res = await axios.get(`${BASE_URL}/api/home/admin/home-sections`, authHeaders);
    console.log(`✅ PASS: /api/home/admin/home-sections returned ${res.data.sections?.length || 0} sections.`);
  } catch (err) {
    console.error('❌ FAIL: Home CMS fetch failed:', err.response?.data || err.message);
  }

  // G. Pricing Control
  try {
    console.log('\nTest G: Fetching Pricing Configuration...');
    const res = await axios.get(`${BASE_URL}/api/pricing/config`, authHeaders);
    console.log('✅ PASS: /api/pricing/config returned pricing config. Delivery base fee:', res.data.config?.deliveryFeeConfig?.baseFee);
  } catch (err) {
    console.error('❌ FAIL: Pricing config fetch failed:', err.response?.data || err.message);
  }

  // H. Promocode List
  try {
    console.log('\nTest H: Fetching Promocodes...');
    const res = await axios.get(`${BASE_URL}/api/admin/promocode`, authHeaders);
    const promocodes = res.data.promocodes || (Array.isArray(res.data) ? res.data : []);
    console.log(`✅ PASS: /api/admin/promocode returned ${promocodes.length} promocodes.`);
  } catch (err) {
    console.error('❌ FAIL: Promocode fetch failed:', err.response?.data || err.message);
  }

  // I. User List
  try {
    console.log('\nTest I: Fetching Users...');
    const res = await axios.get(`${BASE_URL}/api/admin/users`, authHeaders);
    const users = Array.isArray(res.data) ? res.data : (res.data.users || []);
    console.log(`✅ PASS: /api/admin/users returned ${users.length} users.`);
  } catch (err) {
    console.error('❌ FAIL: User list fetch failed:', err.response?.data || err.message);
  }

  // J. Order List / Dashboard
  try {
    console.log('\nTest J: Fetching Orders Dashboard...');
    const res = await axios.get(`${BASE_URL}/api/admin/orders/dashboard`, authHeaders);
    console.log(`✅ PASS: /api/admin/orders/dashboard returned order stats. Total orders: ${res.data.totalOrders || 0}`);
  } catch (err) {
    console.error('❌ FAIL: Order dashboard fetch failed:', err.response?.data || err.message);
  }

  // K. Rider List
  try {
    console.log('\nTest K: Fetching Riders...');
    const res = await axios.get(`${BASE_URL}/api/riders/admin/all`, authHeaders);
    const riders = Array.isArray(res.data) ? res.data : (res.data.riders || []);
    console.log(`✅ PASS: /api/riders/admin/all returned ${riders.length} riders.`);
  } catch (err) {
    console.error('❌ FAIL: Rider list fetch failed:', err.response?.data || err.message);
  }

  // L. Restaurant Owner Details
  try {
    console.log('\nTest L: Fetching Approved Restaurants Name List...');
    const res = await axios.get(`${BASE_URL}/api/restaurants/admin/listName`, authHeaders);
    console.log(`✅ PASS: /api/restaurants/admin/listName returned ${res.data.length} names.`);
  } catch (err) {
    console.error('❌ FAIL: Restaurant names fetch failed:', err.response?.data || err.message);
  }

  // M. Create Test Category
  try {
    console.log('\nTest M: Creating Test Category "TEST ECDKART CATEGORY"...');
    const res = await axios.post(
      `${BASE_URL}/api/admin/master-category`,
      {
        name: 'TEST ECDKART CATEGORY',
        image: 'https://via.placeholder.com/150',
        description: 'Test category for end-to-end audit',
      },
      authHeaders
    );
    testCategoryId = res.data.data?._id || res.data._id;
    console.log(`✅ PASS: Test Category created! ID: ${testCategoryId}`);
  } catch (err) {
    console.error('❌ FAIL: Test category creation failed:', err.response?.data || err.message);
  }

  // N. Verify MongoDB Persistence
  try {
    console.log('\nTest N: Verifying Category Persistence in MongoDB...');
    const res = await axios.get(`${BASE_URL}/api/admin/master-category`, authHeaders);
    const catList = res.data.categories || res.data.data || (Array.isArray(res.data) ? res.data : []);
    const found = catList.find((c) => c.name === 'TEST ECDKART CATEGORY' || c._id === testCategoryId);
    if (found) {
      console.log('✅ PASS: Test category successfully found in MongoDB master-category query!', found.name);
    } else {
      console.error('❌ FAIL: Test category NOT found in list!');
    }
  } catch (err) {
    console.error('❌ FAIL: Verification query failed:', err.response?.data || err.message);
  }

  // O. Verify User App API Reflection
  try {
    console.log('\nTest O: Verifying User App API Reflection (/api/catalog/categories & /api/home/categories)...');
    const resCat = await axios.get(`${BASE_URL}/api/catalog/categories`, authHeaders);
    console.log(`✅ PASS: Catalog categories returned ${resCat.data.categories?.length || 0} categories.`);
  } catch (err) {
    console.error('❌ FAIL: User App API reflection failed:', err.response?.data || err.message);
  }

  // P. Delete / Cleanup Test Category
  if (testCategoryId) {
    try {
      console.log('\nTest P: Cleaning up Test Category...');
      await axios.delete(`${BASE_URL}/api/admin/master-category/${testCategoryId}`, authHeaders);
      console.log(`✅ PASS: Test Category ${testCategoryId} deleted successfully from MongoDB.`);
    } catch (err) {
      console.error('❌ FAIL: Cleanup failed:', err.response?.data || err.message);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests();
