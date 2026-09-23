const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Category = require("../models/Category");
const Product = require("../models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";

const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

async function migrateProductCategories() {
  console.log("=========================================");
  console.log("MIGRATING PRODUCT CATEGORIES & SUBCATEGORIES");
  console.log("=========================================");

  try {
    const dns = require("dns");
    try { dns.setDefaultResultOrder("ipv4first"); } catch (e) {}
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${MONGO_URI}`);

    const mainCategories = await Category.find({ type: "main" }).lean();
    const subCategories = await Category.find({ type: "subcategory" }).lean();

    const mainCategoryMap = {}; // slug -> ObjectId, name -> ObjectId
    mainCategories.forEach((cat) => {
      mainCategoryMap[cat.slug] = cat._id;
      mainCategoryMap[cat.name.toLowerCase()] = cat._id;
      mainCategoryMap[cat._id.toString()] = cat._id;
    });

    const subCategoryMap = {}; // subSlug -> ObjectId, subName -> ObjectId
    subCategories.forEach((sub) => {
      subCategoryMap[sub.slug] = sub._id;
      subCategoryMap[sub.name.toLowerCase()] = sub._id;
      subCategoryMap[sub._id.toString()] = sub._id;
    });

    const products = await Product.find({});
    console.log(`Total products to evaluate: ${products.length}`);

    let mappedCount = 0;
    let unmappedCount = 0;
    const unmappedProducts = [];
    const reportRows = [];

    for (const product of products) {
      let matchedCategoryId = null;
      let matchedSubcategoryId = null;

      // 1. Try matching product.category (ObjectId or string)
      if (product.category) {
        const catStr = product.category.toString();
        const catSlug = slugify(catStr);

        if (mainCategoryMap[catStr]) {
          matchedCategoryId = mainCategoryMap[catStr];
        } else if (mainCategoryMap[catSlug]) {
          matchedCategoryId = mainCategoryMap[catSlug];
        } else {
          // If category was an ObjectId referencing old category, check old Category document name
          try {
            const oldCatDoc = await Category.findById(product.category);
            if (oldCatDoc) {
              const oldNameStr = typeof oldCatDoc.name === "object" ? (oldCatDoc.name.en || "") : (oldCatDoc.name || "");
              const oldSlug = slugify(oldNameStr);
              if (mainCategoryMap[oldSlug]) {
                matchedCategoryId = mainCategoryMap[oldSlug];
              }
            }
          } catch (e) {}
        }
      }

      // Default fallback category if unmatched: Pizza or North Indian main category
      if (!matchedCategoryId && mainCategories.length > 0) {
        matchedCategoryId = mainCategories[0]._id; // First master category fallback
      }

      // 2. Try matching product.subcategory string
      if (product.subcategory) {
        const subStr = product.subcategory.trim();
        const subSlug = slugify(subStr);

        if (subCategoryMap[subSlug]) {
          matchedSubcategoryId = subCategoryMap[subSlug];
        } else if (subCategoryMap[subStr.toLowerCase()]) {
          matchedSubcategoryId = subCategoryMap[subStr.toLowerCase()];
        }
      }

      // Update product fields
      product.categoryId = matchedCategoryId;
      if (matchedSubcategoryId) {
        product.subcategoryId = matchedSubcategoryId;
      }

      await product.save();

      const prodName = typeof product.name === "object" ? (product.name.en || "Product") : product.name;

      if (matchedCategoryId) {
        mappedCount++;
        reportRows.push({
          productId: product._id.toString(),
          name: prodName,
          matchedCategory: matchedCategoryId.toString(),
          matchedSubcategory: matchedSubcategoryId ? matchedSubcategoryId.toString() : "None",
          status: "MAPPED",
        });
      } else {
        unmappedCount++;
        unmappedProducts.push({
          productId: product._id.toString(),
          name: prodName,
          originalCategory: product.category,
          originalSubcategory: product.subcategory,
        });
      }
    }

    // Generate CATEGORY_MIGRATION_REPORT.md
    const reportContent = `# Category Migration Report

## Migration Summary
- **Execution Date**: ${new Date().toISOString()}
- **Total Products Processed**: ${products.length}
- **Successfully Mapped Products**: ${mappedCount}
- **Unmapped Products**: ${unmappedCount}
- **Total Master Categories**: ${mainCategories.length}
- **Total Master Subcategories**: ${subCategories.length}

## Mapped Product Breakdown
| Product ID | Product Name | Matched Category ID | Matched Subcategory ID | Status |
| ---------- | ------------ | ------------------- | ---------------------- | ------ |
${reportRows.map((r) => `| ${r.productId} | ${r.name} | ${r.matchedCategory} | ${r.matchedSubcategory} | ${r.status} |`).join("\n")}

## Unmapped Products / Action Required
${unmappedProducts.length === 0 ? "None. All products successfully mapped." : unmappedProducts.map((u) => `- **${u.name}** (ID: ${u.productId}) - Old Category: '${u.originalCategory}', Old Subcategory: '${u.originalSubcategory}'`).join("\n")}
`;

    fs.writeFileSync(path.join(__dirname, "../../CATEGORY_MIGRATION_REPORT.md"), reportContent);
    console.log(`\n✅ Migration Complete. Mapped: ${mappedCount}, Unmapped: ${unmappedCount}`);
    console.log(`Report generated at CATEGORY_MIGRATION_REPORT.md`);

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrateProductCategories();
}

module.exports = migrateProductCategories;
