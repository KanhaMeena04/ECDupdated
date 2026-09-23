const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const categoryController = require('../controllers/categoryController');
const menuController = require('../controllers/menuController');
const adminMenuApprovalController = require('../controllers/adminMenuApprovalController');

async function runE2ETests() {
  console.log('====================================================');
  console.log('STARTING ECDKART DYNAMIC MENU & APPROVAL E2E AUDIT');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function assertTest(condition, testName, details = '') {
    if (condition) {
      passed++;
      testResults.push({ name: testName, status: 'PASS', details });
      console.log(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      testResults.push({ name: testName, status: 'FAIL', details });
      console.error(`❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecdkart_local_dev');
    console.log('Connected to local MongoDB (ecdkart_local_dev)');

    // 1. Audit Category Master Counts
    const mainCatCount = await Category.countDocuments({ type: 'main' });
    const subCatCount = await Category.countDocuments({ type: 'subcategory' });
    assertTest(mainCatCount === 34, 'Main Category Count Verification (34)', `Found: ${mainCatCount}`);
    assertTest(subCatCount === 206, 'Subcategory Count Verification (206)', `Found: ${subCatCount}`);

    // 2. Category Tree API Logic
    const pizzaCat = await Category.findOne({ type: 'main', slug: 'pizza' });
    assertTest(!!pizzaCat, 'Pizza Main Category exists');

    const cheesePizzaSub = await Category.findOne({
      type: 'subcategory',
      parentCategoryId: pizzaCat._id,
      slug: 'cheese-pizza'
    });
    assertTest(!!cheesePizzaSub, 'Cheese Pizza Subcategory exists under Pizza');

    // Mock Express Req/Res for Category Tree API
    let treeData = null;
    const reqTree = {};
    const resTree = {
      status: (code) => ({
        json: (data) => { treeData = data; }
      })
    };
    await categoryController.getCategoriesTree(reqTree, resTree);
    assertTest(treeData && treeData.success === true && treeData.data.length === 34, 'GET /api/categories/tree returns 34 main categories with nested subcategories');

    // 3. Setup Test Restaurant and Owners
    let testOwner = await User.findOne({ email: 'e2e_restaurant_owner@ecdkart.local' });
    if (!testOwner) {
      testOwner = await User.create({
        name: 'The Gourmet Kitchen Owner',
        email: 'e2e_restaurant_owner@ecdkart.local',
        password: 'password123',
        role: 'restaurant_owner',
        mobile: '9999900001'
      });
    }

    let testRestaurant = await Restaurant.findOne({ owner: testOwner._id });
    if (!testRestaurant) {
      testRestaurant = await Restaurant.findOne({ isActive: true, restaurantApproved: true });
    }
    
    if (!testRestaurant) {
      testRestaurant = await Restaurant.create({
        owner: testOwner._id,
        name: { en: 'The Gourmet Kitchen' },
        description: { en: 'Authentic gourmet food & pizzas' },
        email: 'gourmet@ecdkart.local',
        contactNumber: '9876543210',
        address: '123 Main Street',
        city: 'Indore',
        area: 'Vijay Nagar',
        slug: 'the-gourmet-kitchen',
        restaurantApproved: true,
        isActive: true,
        menuApproved: true
      });
    } else {
      testRestaurant.owner = testOwner._id;
      testRestaurant.restaurantApproved = true;
      testRestaurant.isActive = true;
      testRestaurant.menuApproved = true;
      await testRestaurant.save();
    }

    // 4. Test Adding Menu Item (Restaurant flow)
    const reqAddItem = {
      user: { _id: testOwner._id },
      body: {
        categoryId: pizzaCat._id.toString(),
        subcategoryId: cheesePizzaSub._id.toString(),
        name: 'Test Cheese Burst Pizza E2E',
        description: 'Loaded cheese burst pizza with extra mozzarella',
        b2cMrp: 299,
        b2cSellingPrice: 249,
        b2bPrice: 219,
        foodType: 'veg',
        preparationTime: 20,
        addOns: [
          { name: 'Extra Cheese', price: 30 }
        ]
      },
      files: null
    };

    let addItemResult = null;
    const resAddItem = {
      status: (code) => ({
        json: (data) => { addItemResult = { code, data }; }
      })
    };

    await menuController.addFoodItem(reqAddItem, resAddItem);
    assertTest(addItemResult && addItemResult.code === 201, 'Restaurant Add Menu Item succeeds with valid Category & Subcategory IDs');

    const createdProductId = addItemResult.data.product._id;
    const createdProduct = await Product.findById(createdProductId);

    assertTest(createdProduct.approvalStatus === 'pending' && createdProduct.isApproved === false && createdProduct.isPublished === false, 'New item status is PENDING_ADMIN_APPROVAL (isApproved=false, isPublished=false)');
    assertTest(createdProduct.pricing.b2c.mrp === 299 && createdProduct.pricing.b2c.sellingPrice === 249 && createdProduct.pricing.b2b.sellingPrice === 219, 'Item stores B2C MRP (299), B2C Selling (249), B2B (219) correctly');

    // 5. Invalid Category-Subcategory Combination Validation
    const burgerCat = await Category.findOne({ type: 'main', slug: 'burgers' });
    const reqInvalidSub = {
      user: { _id: testOwner._id },
      body: {
        categoryId: burgerCat._id.toString(),
        subcategoryId: cheesePizzaSub._id.toString(), // Belongs to Pizza, not Burgers
        name: 'Invalid Combination Pizza Burger'
      }
    };
    let invalidResult = null;
    const resInvalid = {
      status: (code) => ({
        json: (data) => { invalidResult = { code, data }; }
      })
    };
    await menuController.addFoodItem(reqInvalidSub, resInvalid);
    assertTest(invalidResult && invalidResult.code === 400 && invalidResult.data.message.includes('Selected subcategory does not belong'), 'Backend rejects invalid category/subcategory combination');

    // 6. User App Visibility Check BEFORE Approval
    let userMenuBefore = null;
    const reqUserMenuBefore = {
      params: { restaurantId: testRestaurant._id.toString() },
      user: null
    };
    const resUserMenuBefore = {
      status: (code) => ({
        json: (data) => { userMenuBefore = { code, data }; }
      }),
      json: (data) => { userMenuBefore = { code: 200, data }; }
    };
    await menuController.getMenu(reqUserMenuBefore, resUserMenuBefore);
    const itemInUserMenuBefore = userMenuBefore.data.items.find(i => i._id.toString() === createdProductId.toString());
    assertTest(!itemInUserMenuBefore, 'Item is NOT visible in User App menu BEFORE Admin approval');

    // 7. Admin Pending Approvals List Check
    let pendingListResult = null;
    const reqPending = { query: {} };
    const resPending = {
      status: (code) => ({
        json: (data) => { pendingListResult = data; }
      })
    };
    await adminMenuApprovalController.getPendingMenuItems(reqPending, resPending);
    const itemInPending = pendingListResult.data.find(i => i._id.toString() === createdProductId.toString());
    assertTest(!!itemInPending, 'Admin can see submitted item in Pending Menu Approvals list');

    // 8. Admin Review Page Details Check
    let reviewResult = null;
    const reqReview = { params: { id: createdProductId.toString() } };
    const resReview = {
      status: (code) => ({
        json: (data) => { reviewResult = data; }
      })
    };
    await adminMenuApprovalController.getMenuItemForReview(reqReview, resReview);
    assertTest(reviewResult && reviewResult.data.pricing.b2c.sellingPrice === 249 && reviewResult.data.pricing.b2b.sellingPrice === 219, 'Admin Review page shows full item details including B2C and B2B pricing');

    // 9. Admin Approves Item
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'admin@ecdkart.local',
        password: 'adminpassword',
        role: 'admin',
        mobile: '9999900002'
      });
    }

    let approveResult = null;
    const reqApprove = {
      params: { id: createdProductId.toString() },
      user: adminUser,
      body: { notes: 'Approved for public listing' }
    };
    const resApprove = {
      status: (code) => ({
        json: (data) => { approveResult = data; }
      })
    };
    await adminMenuApprovalController.approveMenuItem(reqApprove, resApprove);
    assertTest(approveResult && approveResult.data.isApproved === true && approveResult.data.isPublished === true, 'Admin approve sets isApproved=true and isPublished=true');

    // 10. User App Visibility Check AFTER Approval
    let userMenuAfter = null;
    const reqUserMenuAfter = {
      params: { restaurantId: testRestaurant._id.toString() },
      user: null
    };
    const resUserMenuAfter = {
      status: (code) => ({
        json: (data) => { userMenuAfter = { code, data }; }
      }),
      json: (data) => { userMenuAfter = { code: 200, data }; }
    };
    await menuController.getMenu(reqUserMenuAfter, resUserMenuAfter);
    const itemInUserMenuAfter = userMenuAfter.data.items.find(i => i._id.toString() === createdProductId.toString());
    assertTest(!!itemInUserMenuAfter, 'Item IS visible in User App menu AFTER Admin approval');
    assertTest(itemInUserMenuAfter.pricing.b2c.sellingPrice === 249 && itemInUserMenuAfter.pricing.b2b === undefined, 'Normal B2C user sees B2C price (249) and B2B price is hidden');

    // 11. B2B User App Price Visibility Check
    let b2bUserMenu = null;
    const reqB2bUserMenu = {
      params: { restaurantId: testRestaurant._id.toString() },
      user: { _id: 'b2b_user_1', userType: 'b2b', role: 'customer' }
    };
    const resB2bUserMenu = {
      status: (code) => ({
        json: (data) => { b2bUserMenu = { code, data }; }
      }),
      json: (data) => { b2bUserMenu = { code: 200, data }; }
    };
    await menuController.getMenu(reqB2bUserMenu, resB2bUserMenu);
    const b2bItem = b2bUserMenu.data.items.find(i => i._id.toString() === createdProductId.toString());
    assertTest(b2bItem && b2bItem.pricing.b2b && b2bItem.pricing.b2b.sellingPrice === 219, 'Authorized B2B user sees B2B price (219)');

    // 12. Audit Log Verification
    const auditLogs = await AuditLog.find({ entityId: createdProductId });
    assertTest(auditLogs.length >= 2, 'Audit logs generated for MENU_ITEM_CREATED and MENU_ITEM_APPROVED');

    // Summary
    const totalProductsInDb = await Product.countDocuments();
    const pendingProductsInDb = await Product.countDocuments({ approvalStatus: 'pending' });
    const approvedProductsInDb = await Product.countDocuments({ approvalStatus: 'approved', isApproved: true });
    const rejectedProductsInDb = await Product.countDocuments({ approvalStatus: 'rejected' });
    let categoryRequestsInDb = 0;
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.some(c => c.name === 'categoryrequests')) {
      categoryRequestsInDb = await mongoose.connection.db.collection('categoryrequests').countDocuments();
    }

    console.log('\n====================================================');
    console.log('FINAL REAL LOCAL DATABASE METRIC SUMMARY');
    console.log('====================================================');
    console.log(`Main Categories         : ${mainCatCount}`);
    console.log(`Subcategories           : ${subCatCount}`);
    console.log(`Total Products in DB    : ${totalProductsInDb}`);
    console.log(`Pending Products        : ${pendingProductsInDb}`);
    console.log(`Approved Products       : ${approvedProductsInDb}`);
    console.log(`Rejected Products       : ${rejectedProductsInDb}`);
    console.log(`Category Requests       : ${categoryRequestsInDb}`);
    console.log(`E2E Test Results        : ${passed}/${passed + failed} PASS`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal Test Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runE2ETests();
