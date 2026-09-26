require("dotenv").config();
const mongoose = require("mongoose");

const CATEGORY = {
  cake: "6a9c486491c7604d7d157332",
  burger: "6a9c486491c7604d7d157333",
  pizza: "6a9c486491c7604d7d157334",
  chinese: "6a9c486491c7604d7d157335",
  biryani: "6a9c486491c7604d7d157336",
  sandwich: "6a9c486591c7604d7d157337",
  momos: "6a9c486591c7604d7d157338",
  northIndian: "6ab3a6686402640517689549",
  beverages: "6ab3a6686402640517689550"
};

function getName(product) {
  const n = product?.name;

  if (!n) return "";

  if (typeof n === "string") {
    return n.toLowerCase().trim();
  }

  if (typeof n === "object") {
    return Object.values(n)
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .trim();
  }

  return String(n).toLowerCase().trim();
}

function detectCategory(product) {
  const name = getName(product);

  // Pizza — highest priority
  if (
    /\bpizza\b|\bmargherita\b|\bfarmhouse\b|\bpepperoni\b|\btandoori pizza\b/.test(name)
  ) {
    return CATEGORY.pizza;
  }

  // Burger
  if (
    /\bburger\b|\bcheeseburger\b|\bhamburger\b|\bveg burger\b|\bchicken burger\b/.test(name)
  ) {
    return CATEGORY.burger;
  }

  // Biryani
  if (
    /\bbiryani\b|\bdum biryani\b|\bhyderabadi\b/.test(name)
  ) {
    return CATEGORY.biryani;
  }

  // Momos
  if (
    /\bmomo\b|\bmomos\b|\bdumpling\b/.test(name)
  ) {
    return CATEGORY.momos;
  }

  // Sandwich
  if (
    /\bsandwich\b|\bclub sandwich\b|\bgrilled sandwich\b|\bsub\b/.test(name)
  ) {
    return CATEGORY.sandwich;
  }

  // Chinese
  if (
    /\bchowmein\b|\bnoodles\b|\bmanchurian\b|\bschezwan\b|\bfried rice\b|\bchilli paneer\b|\bchilli mushroom\b|\bspring roll\b|\bmanchow\b|\bhot and sour\b|\bhot & sour\b|\blollypop\b/.test(name)
  ) {
    return CATEGORY.chinese;
  }

  // Beverages
  if (
    /\bcold coffee\b|\bcoffee\b|\btea\b|\bchai\b|\bjuice\b|\bshake\b|\bshakes\b|\bsmoothie\b|\blassi\b|\bmojito\b|\bmocktail\b|\blemonade\b|\blime soda\b|\bcooler\b|\bblue lagoon\b|\bwatermelon punch\b|\bmango tango\b|\bkiwi\b|\borange blossom\b|\bdrink\b|\bdrinks\b/.test(name)
  ) {
    return CATEGORY.beverages;
  }

  // Cakes / desserts
  if (
    /\bcake\b|\bpastry\b|\bbrownie\b|\bcupcake\b|\bcheesecake\b|\bred velvet\b|\bdonut\b|\bdoughnut\b|\bmuffin\b|\bgulab jamun\b|\bphirnee\b|\bphirni\b|\btutty frutty\b/.test(name)
  ) {
    return CATEGORY.cake;
  }

  // North Indian / Indian food
  if (
    /\bpaneer\b|\bnaan\b|\broti\b|\bdal\b|\bparatha\b|\bparantha\b|\bthali\b|\bchole\b|\brajma\b|\btikka\b|\bkorma\b|\bbutter chicken\b|\bchicken curry\b|\bmatar\b|\bkofta\b|\bmasala\b|\bkadhi\b|\bmalai kofta\b|\bpulao\b|\bjeera rice\b|\bsteam rice\b|\braita\b|\brayta\b|\bpapad\b|\bpapad\b|\bchaat\b|\bpav bhaji\b|\bkulcha\b|\baloo\b|\bgobhi\b|\bsabzi\b|\bsaag\b|\bchap\b|\bgatta\b|\bdaahi\b|\bdahi\b|\bchana\b|\bveg diet\b|\bindian\b/.test(name)
  ) {
    return CATEGORY.northIndian;
  }

  // Clearly non-category-specific fast-food items:
  // keep their existing category instead of making a risky guess.
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });

  const db = mongoose.connection.db;
  const products = db.collection("products");

  console.log("\n====================================");
  console.log("ECDKART CATEGORY MIGRATION");
  console.log("DATABASE:", db.databaseName);
  console.log("====================================\n");

  const allProducts = await products.find({}).toArray();

  console.log("TOTAL PRODUCTS:", allProducts.length);

  const stats = {};
  let changed = 0;
  let unchanged = 0;

  const bulk = [];

  for (const product of allProducts) {
    const detected = detectCategory(product);

    if (!detected) {
      unchanged++;
      continue;
    }

    const current = product.category
      ? String(product.category)
      : "";

    if (current === detected) {
      unchanged++;
      continue;
    }

    const categoryName =
      Object.entries(CATEGORY).find(
        ([, id]) => id === detected
      )?.[0] || "unknown";

    stats[categoryName] =
      (stats[categoryName] || 0) + 1;

    bulk.push({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            category: detected,
            categoryId: detected,
            updatedAt: new Date()
          }
        }
      }
    });

    changed++;
  }

  console.log("\nPROPOSED/ACTUAL CATEGORY CHANGES:");

  Object.entries(stats).forEach(([category, count]) => {
    console.log(category + ":", count);
  });

  console.log("\nPRODUCTS TO CHANGE:", changed);
  console.log("PRODUCTS LEFT UNCHANGED:", unchanged);

  if (!bulk.length) {
    console.log("\nNO CHANGES REQUIRED.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nApplying migration...");

  const result = await products.bulkWrite(bulk, {
    ordered: false
  });

  console.log("\n====================================");
  console.log("MIGRATION COMPLETE");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
  console.log("====================================");

  console.log("\nVerifying category counts...\n");

  const counts = await products.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]).toArray();

  counts.forEach(x => {
    console.log(String(x._id), "=>", x.count);
  });

  await mongoose.disconnect();
}

run().catch(async error => {
  console.error("\n? MIGRATION FAILED");
  console.error(error.message);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
