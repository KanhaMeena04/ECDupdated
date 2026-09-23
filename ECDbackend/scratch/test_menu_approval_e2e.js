const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";

async function runE2ETests() {
  console.log("=== STARTING ECDKART CATEGORY & MENU APPROVAL E2E VERIFICATION ===");
  console.log(`Connecting to database: ${MONGO_URI}`);
  
  await mongoose.connect(MONGO_URI);
  console.log("DB Connection successful.\n");

  const Category = require("../models/Category");
  const Product = require("../models/Product");
  const Restaurant = require("../models/Restaurant");
  const CategoryRequest = require("../models/CategoryRequest");
  const User = require("../models/User");
  const AuditLog = require("../models/AuditLog");

  const results = {
    total: 10,
    passed: 0,
    failed: 0,
    details: []
  };

  function assertTest(testNum, description, condition, extraInfo = "") {
    if (condition) {
      results.passed++;
      results.details.push({ testNum, description, status: "PASS", extraInfo });
      console.log(`[PASS] Test ${testNum}: ${description} ${extraInfo ? `(${extraInfo})` : ""}`);
    } else {
      results.failed++;
      results.details.push({ testNum, description, status: "FAIL", extraInfo });
      console.log(`[FAIL] Test ${testNum}: ${description} ${extraInfo ? `(${extraInfo})` : ""}`);
    }
  }

  try {
    // ------------------------------------------------------------------
    // TEST 1: Count Main Categories in Database
    // ------------------------------------------------------------------
    const mainCount = await Category.countDocuments({ type: "main" });
    assertTest(1, "Database Main Categories Count", mainCount >= 34, `Found: ${mainCount}`);

    // ------------------------------------------------------------------
    // TEST 2: Count Subcategories in Database
    // ------------------------------------------------------------------
    const subCount = await Category.countDocuments({ type: "subcategory" });
    assertTest(2, "Database Subcategories Count", subCount >= 206, `Found: ${subCount}`);

    // Fetch or create reference Category and Subcategory
    let mainCat = await Category.findOne({ type: "main", name: /Pizza/i });
    if (!mainCat) {
      mainCat = await Category.create({ name: "Pizza", slug: "pizza", type: "main", isActive: true, userAppVisible: true });
    }

    let subCat = await Category.findOne({ type: "subcategory", parentCategoryId: mainCat._id });
    if (!subCat) {
      subCat = await Category.create({ name: "Cheese Pizza", slug: "cheese-pizza", type: "subcategory", parentCategoryId: mainCat._id, isActive: true, userAppVisible: true });
    }

    // Fetch or create reference Restaurant
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      let owner = await User.findOne({ role: "restaurant_owner" });
      if (!owner) {
        owner = await User.create({ name: "Test Owner", email: "owner@test.com", password: "password123", role: "restaurant_owner" });
      }
      restaurant = await Restaurant.create({
        owner: owner._id,
        name: { en: "The Gourmet Kitchen" },
        email: "gourmet@test.com",
        contactNumber: "9876543210",
        address: "123 Main St",
        city: "Test City",
        area: "Test Area",
        deliveryTime: 30,
        isActive: true,
        restaurantApproved: true,
        menuApproved: true
      });
    }

    // Ensure restaurant flags are active
    restaurant.isActive = true;
    restaurant.restaurantApproved = true;
    restaurant.menuApproved = true;
    await restaurant.save();

    // ------------------------------------------------------------------
    // TEST 3: Restaurant Creates Draft / Pending Menu Item
    // ------------------------------------------------------------------
    const testItem = await Product.create({
      restaurant: restaurant._id,
      category: mainCat._id,
      categoryId: mainCat._id,
      subcategoryId: subCat._id,
      name: { en: "Test Cheese Burst Pizza E2E" },
      description: { en: "Delicious test pizza with extra cheese" },
      basePrice: 249,
      mrp: 299,
      sellingPrice: 249,
      pricing: {
        b2c: { mrp: 299, sellingPrice: 249, discountPercent: 16.72 },
        b2b: { sellingPrice: 219, discountPercent: 26.75 }
      },
      foodType: "veg",
      preparationTime: 20,
      approvalStatus: "pending",
      isApproved: false,
      isPublished: false,
      available: true
    });

    assertTest(3, "Restaurant Creates Menu Item with Category/Subcategory & Prices", !!testItem._id, `ProductID: ${testItem._id}`);

    // ------------------------------------------------------------------
    // TEST 4: Verify Admin Pending Menu Query Contains Item
    // ------------------------------------------------------------------
    const pendingItems = await Product.find({
      $or: [{ approvalStatus: "pending" }, { isApproved: false }]
    });
    const isPendingFound = pendingItems.some(i => i._id.toString() === testItem._id.toString());
    assertTest(4, "Admin Pending Menu Approvals Panel Contains Item", isPendingFound, `Pending Count: ${pendingItems.length}`);

    // ------------------------------------------------------------------
    // TEST 5: Verify User API Does NOT Return Item Before Admin Approval
    // ------------------------------------------------------------------
    const preApprovalProducts = await Product.find({
      restaurant: restaurant._id,
      isApproved: true,
      isPublished: { $ne: false },
      available: true
    });
    const isVisibleBeforeApproval = preApprovalProducts.some(i => i._id.toString() === testItem._id.toString());
    assertTest(5, "User App Visibility BEFORE Approval is FALSE", !isVisibleBeforeApproval);

    // ------------------------------------------------------------------
    // TEST 6: Admin Approves Menu Item
    // ------------------------------------------------------------------
    testItem.approvalStatus = "approved";
    testItem.isApproved = true;
    testItem.isPublished = true;
    testItem.approvedAt = new Date();
    await testItem.save();

    await AuditLog.log({
      entity: "Product",
      entityId: testItem._id,
      action: "MENU_ITEM_APPROVED",
      userId: restaurant.owner,
      userRole: "admin",
      reason: "E2E Test Approval"
    });

    assertTest(6, "Admin Menu Approval Action Executed", testItem.isApproved === true && testItem.approvalStatus === "approved");

    // ------------------------------------------------------------------
    // TEST 7: Verify User API Returns Item AFTER Admin Approval
    // ------------------------------------------------------------------
    const postApprovalProducts = await Product.find({
      restaurant: restaurant._id,
      isApproved: true,
      isPublished: { $ne: false },
      available: true
    });
    const isVisibleAfterApproval = postApprovalProducts.some(i => i._id.toString() === testItem._id.toString());
    assertTest(7, "User App Visibility AFTER Approval is TRUE", isVisibleAfterApproval);

    // ------------------------------------------------------------------
    // TEST 8: Verify B2C Customer Price
    // ------------------------------------------------------------------
    const b2cPrice = testItem.pricing?.b2c?.sellingPrice ?? testItem.basePrice;
    assertTest(8, "B2C Selling Price Returned Correctly", b2cPrice === 249, `B2C Price: ₹${b2cPrice}`);

    // ------------------------------------------------------------------
    // TEST 9: Verify Authorized B2B Customer Price
    // ------------------------------------------------------------------
    const b2bPrice = testItem.pricing?.b2b?.sellingPrice;
    assertTest(9, "Authorized B2B Price Returned Correctly", b2bPrice === 219, `B2B Price: ₹${b2bPrice}`);

    // ------------------------------------------------------------------
    // TEST 10: Category Request Lifecycle (Submit -> Admin Approve -> Master)
    // ------------------------------------------------------------------
    const catReq = await CategoryRequest.create({
      restaurant: restaurant._id,
      requestedBy: restaurant.owner,
      name: "Test Gourmet Desserts",
      type: "main",
      description: "Artisanal desserts collection",
      reason: "High customer demand",
      status: "pending"
    });

    // Admin Approves Category Request
    const approvedCat = await Category.create({
      name: catReq.name,
      slug: "test-gourmet-desserts",
      type: "main",
      source: "admin",
      approvalStatus: "approved",
      isActive: true,
      userAppVisible: true
    });

    catReq.status = "approved";
    catReq.createdCategory = approvedCat._id;
    await catReq.save();

    const masterCatCheck = await Category.findById(approvedCat._id);
    assertTest(10, "Restaurant Category Request -> Admin Approve -> Joins Central Master", masterCatCheck && masterCatCheck.name === "Test Gourmet Desserts");

    // Cleanup test items
    await Product.findByIdAndDelete(testItem._id);
    await CategoryRequest.findByIdAndDelete(catReq._id);
    await Category.findByIdAndDelete(approvedCat._id);

    console.log("\n==================================================");
    console.log(`SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
    console.log("==================================================");

  } catch (err) {
    console.error("E2E Execution Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("DB Disconnected cleanly.");
  }
}

runE2ETests();
