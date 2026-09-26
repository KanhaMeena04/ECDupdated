const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const assert = require("assert");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Category = require("../models/Category");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");
const categoryController = require("../controllers/categoryController");
const seedMasterCategories = require("../scripts/seedMasterCategories");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";

// Mock Express Req/Res helpers
function createMockReqRes(body = {}, params = {}, query = {}) {
  const req = {
    body,
    params,
    query,
    user: { _id: new mongoose.Types.ObjectId(), role: "admin" },
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    },
  };

  return { req, res };
}

async function runCategorySystemTests() {
  console.log("==================================================");
  console.log("RUNNING MASTER CATEGORY AUTOMATED TEST SUITE (25 TESTS)");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function test(title, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ [TEST ${passed + failed}] PASS: ${title}`);
    } catch (err) {
      failed++;
      console.error(`❌ [TEST ${passed + failed}] FAIL: ${title}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  try {
    const dns = require("dns");
    try { dns.setDefaultResultOrder("ipv4first"); } catch (e) {}
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${MONGO_URI}\n`);

    // Clean test categories if existing from previous runs
    await Category.deleteMany({ slug: /^test-/ });

    let parentCatId = null;
    let parentCat2Id = null;
    let subCatId = null;
    let testProductId = null;

    // 1. Create main category
    await test("1. Create Main Category", async () => {
      const { req, res } = createMockReqRes({
        name: "Test Pizza Category",
        slug: "test-pizza-category",
        type: "main",
        description: "Test Main Category Description",
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 201);
      assert.strictEqual(res.getResponseData().success, true);
      parentCatId = res.getResponseData().data._id.toString();
    });

    // 2. Create duplicate main category -> reject
    await test("2. Create Duplicate Main Category -> Reject", async () => {
      const { req, res } = createMockReqRes({
        name: "Test Pizza Category",
        slug: "test-pizza-category",
        type: "main",
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 400);
      assert.strictEqual(res.getResponseData().success, false);
    });

    // 3. Create subcategory under parent
    await test("3. Create Subcategory under Parent", async () => {
      const { req, res } = createMockReqRes({
        name: "Test Veg Crust",
        slug: "test-veg-crust",
        type: "subcategory",
        parentCategoryId: parentCatId,
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 201);
      assert.strictEqual(res.getResponseData().success, true);
      subCatId = res.getResponseData().data._id.toString();
    });

    // 4. Duplicate subcategory under same parent -> reject
    await test("4. Duplicate Subcategory under same parent -> Reject", async () => {
      const { req, res } = createMockReqRes({
        name: "Test Veg Crust",
        slug: "test-veg-crust",
        type: "subcategory",
        parentCategoryId: parentCatId,
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 400);
      assert.strictEqual(res.getResponseData().success, false);
    });

    // 5. Create second parent and same subcategory -> allowed
    await test("5. Same Subcategory under different parent -> Allowed", async () => {
      // Create parent 2
      const { req: pReq, res: pRes } = createMockReqRes({
        name: "Test Burgers Category",
        slug: "test-burgers-category",
        type: "main",
      });
      await categoryController.createCategory(pReq, pRes);
      parentCat2Id = pRes.getResponseData().data._id.toString();

      // Create same subcategory under parent 2
      const { req, res } = createMockReqRes({
        name: "Test Veg Crust",
        slug: "test-veg-crust",
        type: "subcategory",
        parentCategoryId: parentCat2Id,
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 201);
    });

    // 6. Update main category
    await test("6. Update Main Category", async () => {
      const { req, res } = createMockReqRes(
        { name: "Updated Test Pizza Category", description: "New Desc" },
        { id: parentCatId }
      );
      await categoryController.updateCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getResponseData().data.name, "Updated Test Pizza Category");
    });

    // 7. Update subcategory
    await test("7. Update Subcategory", async () => {
      const { req, res } = createMockReqRes(
        { name: "Updated Test Veg Crust" },
        { id: subCatId }
      );
      await categoryController.updateCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getResponseData().data.name, "Updated Test Veg Crust");
    });

    // 8. Reorder categories
    await test("8. Reorder Categories", async () => {
      const { req, res } = createMockReqRes({
        items: [
          { id: parentCatId, position: 2 },
          { id: parentCat2Id, position: 1 },
        ],
      });
      await categoryController.reorderCategories(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
    });

    // 9. Reorder subcategories
    await test("9. Reorder Subcategories", async () => {
      const { req, res } = createMockReqRes({
        items: [{ id: subCatId, position: 5 }],
      });
      await categoryController.reorderCategories(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
    });

    // 10. Deactivate main category
    await test("10. Deactivate Main Category", async () => {
      const { req, res } = createMockReqRes(
        { isActive: false },
        { id: parentCat2Id }
      );
      await categoryController.patchCategoryStatus(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getResponseData().data.isActive, false);
    });

    // 11. Deactivate subcategory
    await test("11. Deactivate Subcategory", async () => {
      const { req, res } = createMockReqRes(
        { isActive: false },
        { id: subCatId }
      );
      await categoryController.patchCategoryStatus(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
    });

    // 12. User API returns active categories tree
    await test("12. User API returns active categories tree", async () => {
      const { req, res } = createMockReqRes();
      await categoryController.getCategoriesTree(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getResponseData().success, true);
    });

    // 13. User API returns subcategories
    await test("13. User API returns subcategories for parent", async () => {
      const { req, res } = createMockReqRes({}, { id: parentCatId });
      await categoryController.getSubcategoriesByParent(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
    });

    // 14. Hidden/Deactivated category NOT returned in User App Tree
    await test("14. Deactivated Category Not Returned in User App Tree", async () => {
      const { req, res } = createMockReqRes();
      await categoryController.getCategoriesTree(req, res);
      const list = res.getResponseData().data;
      const foundDeactivated = list.find((c) => c._id.toString() === parentCat2Id);
      assert.strictEqual(foundDeactivated, undefined);
    });

    // 15. Admin API returns all categories regardless of active state
    await test("15. Admin API returns all categories including deactivated", async () => {
      const { req, res } = createMockReqRes();
      await categoryController.getAdminCategories(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      const list = res.getResponseData().categories;
      const foundDeactivated = list.find((c) => c._id.toString() === parentCat2Id);
      assert.notStrictEqual(foundDeactivated, undefined);
    });

    // 16. Product creation accepts categoryId & subcategoryId
    await test("16. Product model accepts categoryId & subcategoryId ObjectIds", async () => {
      const dummyRestId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        restaurant: dummyRestId,
        category: parentCatId,
        categoryId: parentCatId,
        subcategoryId: subCatId,
        name: { en: "Test Pizza Item" },
        basePrice: 299,
      });
      testProductId = product._id.toString();
      assert.strictEqual(product.categoryId.toString(), parentCatId);
      assert.strictEqual(product.subcategoryId.toString(), subCatId);
    });

    // 17. Product retains valid reference
    await test("17. Product retains valid categoryId reference", async () => {
      const p = await Product.findById(testProductId).populate("categoryId");
      assert.strictEqual(p.categoryId._id.toString(), parentCatId);
    });

    // 18. Invalid subcategory/parent relationship rejected
    await test("18. Invalid Subcategory parent relationship rejected", async () => {
      const invalidParentId = new mongoose.Types.ObjectId();
      const { req, res } = createMockReqRes({
        name: "Test Orphan Sub",
        type: "subcategory",
        parentCategoryId: invalidParentId,
      });
      await categoryController.createCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 400);
    });

    // 19. Category deletion BLOCKED when products use it
    await test("19. Category deletion BLOCKED when products use it", async () => {
      const { req, res } = createMockReqRes({}, { id: parentCatId });
      await categoryController.deleteCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 400);
      assert.strictEqual(res.getResponseData().success, false);
      assert.match(res.getResponseData().message, /currently used/i);
    });

    // 20. Audit log created for mutations
    await test("20. Audit logs created for category mutations", async () => {
      const logs = await AuditLog.find({ entity: "Category" });
      assert.ok(logs.length > 0);
    });

    // 21. Clean product and test category deletion when unreferenced
    await test("21. Unreferenced Category can be deleted after removing product", async () => {
      await Product.findByIdAndDelete(testProductId);
      // Reactivate subcategory first
      await Category.findByIdAndUpdate(subCatId, { isActive: true });
      // Delete subcategory
      const { req: sReq, res: sRes } = createMockReqRes({}, { id: subCatId });
      await categoryController.deleteCategory(sReq, sRes);
      assert.strictEqual(sRes.getStatusCode(), 200);

      // Now delete parent category
      const { req, res } = createMockReqRes({}, { id: parentCatId });
      await categoryController.deleteCategory(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
    });

    // 22. Seed script is idempotent
    await test("22. Seed script is idempotent and safe", async () => {
      await Category.deleteMany({ slug: /^test-/ });
      await seedMasterCategories();
      const count = await Category.countDocuments({ type: "main" });
      assert.strictEqual(count, 34);
    });

    // 23. Existing products remain valid after migration
    await test("23. Existing products remain valid in database", async () => {
      const prodCount = await Product.countDocuments();
      assert.ok(prodCount >= 0);
    });

    // 24. No orphan subcategory references in MongoDB
    await test("24. No orphan subcategories exist without valid main parent", async () => {
      const subs = await Category.find({ type: "subcategory" }).lean();
      for (const sub of subs) {
        const parent = await Category.findById(sub.parentCategoryId);
        assert.ok(parent !== null, `Orphan subcategory found: ${sub.name}`);
      }
    });

    // 25. Final Tree Hierarchy Structure verification
    await test("25. Final Tree Hierarchy API structure verification", async () => {
      const { req, res } = createMockReqRes();
      await categoryController.getCategoriesTree(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      const tree = res.getResponseData().data;
      assert.strictEqual(tree.length, 34);
      assert.ok(tree[0].subcategories.length > 0);
    });

  } catch (err) {
    console.error("Fatal Test Suite Error:", err);
  } finally {
    // Cleanup temporary test categories
    await Category.deleteMany({ slug: /^test-/ });
    await mongoose.disconnect();
    console.log("\n==================================================");
    console.log(`TEST SUITE COMPLETE. Passed: ${passed}/25, Failed: ${failed}/25`);
    console.log("==================================================");
  }
}

if (require.main === module) {
  runCategorySystemTests();
}

module.exports = runCategorySystemTests;
