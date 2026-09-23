const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Category = require("../models/Category");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecdkart_local_dev";

const slugify = (text) => {
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

// Initial Master Data Catalog
const MASTER_CATALOG = [
  {
    name: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    subcategories: [
      "Veg Pizza",
      "Cheese Pizza",
      "Paneer Pizza",
      "Corn Pizza",
      "Farmhouse Pizza",
      "Margherita",
      "Special Pizza",
    ],
  },
  {
    name: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    subcategories: [
      "Veg Burger",
      "Cheese Burger",
      "Paneer Burger",
      "Aloo Tikki Burger",
      "Chicken Burger",
      "Special Burger",
    ],
  },
  {
    name: "Rolls & Wraps",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
    subcategories: [
      "Veg Roll",
      "Paneer Roll",
      "Egg Roll",
      "Chicken Roll",
      "Kathi Roll",
      "Frankie",
      "Shawarma",
    ],
  },
  {
    name: "Chinese",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    subcategories: [
      "Noodles",
      "Fried Rice",
      "Manchurian",
      "Chilli Paneer",
      "Chilli Potato",
      "Momos",
      "Spring Roll",
    ],
  },
  {
    name: "Momos",
    image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400",
    subcategories: [
      "Veg Momos",
      "Paneer Momos",
      "Fried Momos",
      "Tandoori Momos",
      "Kurkure Momos",
      "Chicken Momos",
    ],
  },
  {
    name: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
    subcategories: [
      "Veg Biryani",
      "Paneer Biryani",
      "Chicken Biryani",
      "Egg Biryani",
      "Special Biryani",
    ],
  },
  {
    name: "Rice & Meals",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    subcategories: [
      "Jeera Rice",
      "Fried Rice",
      "Pulao",
      "Rajma Rice",
      "Chole Rice",
      "Dal Rice",
      "Thali",
    ],
  },
  {
    name: "North Indian",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    subcategories: [
      "Dal",
      "Paneer",
      "Kadhai",
      "Butter Masala",
      "Kofta",
      "Chole",
      "Rajma",
      "Mix Veg",
    ],
  },
  {
    name: "South Indian",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400",
    subcategories: [
      "Dosa",
      "Masala Dosa",
      "Idli",
      "Vada",
      "Uttapam",
      "Sambar",
      "South Indian Meals",
    ],
  },
  {
    name: "Roti & Paratha",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400",
    subcategories: [
      "Roti",
      "Butter Roti",
      "Naan",
      "Butter Naan",
      "Garlic Naan",
      "Aloo Paratha",
      "Paneer Paratha",
      "Mix Paratha",
    ],
  },
  {
    name: "Thali",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400",
    subcategories: [
      "Veg Thali",
      "Special Thali",
      "Punjabi Thali",
      "South Indian Thali",
      "Mini Thali",
    ],
  },
  {
    name: "Street Food",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    subcategories: [
      "Chaat",
      "Golgappa/Pani Puri",
      "Aloo Tikki",
      "Samosa",
      "Kachori",
      "Chole Bhature",
      "Pav Bhaji",
    ],
  },
  {
    name: "Snacks",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400",
    subcategories: [
      "French Fries",
      "Peri Peri Fries",
      "Nuggets",
      "Garlic Bread",
      "Cheese Balls",
      "Potato Shots",
    ],
  },
  {
    name: "Sandwiches",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
    subcategories: [
      "Veg Sandwich",
      "Grilled Sandwich",
      "Cheese Sandwich",
      "Paneer Sandwich",
      "Club Sandwich",
    ],
  },
  {
    name: "Fast Food",
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400",
    subcategories: [
      "Hot Dog",
      "Pasta",
      "Mac & Cheese",
      "Nachos",
      "Garlic Bread",
      "Loaded Fries",
    ],
  },
  {
    name: "Pasta",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    subcategories: [
      "White Sauce",
      "Red Sauce",
      "Pink Sauce",
      "Arrabbiata",
      "Alfredo",
      "Paneer Pasta",
    ],
  },
  {
    name: "Soup",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    subcategories: [
      "Tomato Soup",
      "Manchow Soup",
      "Hot & Sour",
      "Sweet Corn",
      "Veg Soup",
      "Chicken Soup",
    ],
  },
  {
    name: "Salads",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    subcategories: [
      "Green Salad",
      "Fruit Salad",
      "Sprouts Salad",
      "Paneer Salad",
      "Chicken Salad",
    ],
  },
  {
    name: "Egg Dishes",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
    subcategories: [
      "Egg Roll",
      "Egg Bhurji",
      "Omelette",
      "Egg Curry",
      "Boiled Egg",
      "Egg Rice",
    ],
  },
  {
    name: "Non-Veg",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
    subcategories: [
      "Chicken Curry",
      "Butter Chicken",
      "Kadhai Chicken",
      "Chicken Tikka",
      "Chicken Kebab",
      "Mutton",
    ],
  },
  {
    name: "Tandoor & Grill",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400",
    subcategories: [
      "Paneer Tikka",
      "Tandoori Paneer",
      "Chicken Tikka",
      "Tandoori Chicken",
      "Kebab",
    ],
  },
  {
    name: "Desserts",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400",
    subcategories: [
      "Cake",
      "Pastry",
      "Brownie",
      "Gulab Jamun",
      "Rasmalai",
      "Kheer",
      "Ice Cream",
    ],
  },
  {
    name: "Ice Cream",
    image: "https://images.unsplash.com/photo-1560008511-11c63416e52d?w=400",
    subcategories: [
      "Cup",
      "Cone",
      "Sundae",
      "Family Pack",
      "Kulfi",
      "Falooda",
    ],
  },
  {
    name: "Beverages",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    subcategories: [
      "Cold Drink",
      "Juice",
      "Fresh Juice",
      "Shake",
      "Lassi",
      "Chaas",
      "Water",
    ],
  },
  {
    name: "Shakes & Smoothies",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
    subcategories: [
      "Chocolate Shake",
      "Vanilla Shake",
      "Oreo Shake",
      "Mango Shake",
      "Banana Shake",
      "Smoothie",
    ],
  },
  {
    name: "Tea & Coffee",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400",
    subcategories: [
      "Tea",
      "Masala Tea",
      "Green Tea",
      "Coffee",
      "Cold Coffee",
      "Cappuccino",
    ],
  },
  {
    name: "Mocktails",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
    subcategories: [
      "Mojito",
      "Virgin Mojito",
      "Blue Lagoon",
      "Fruit Punch",
      "Lemonade",
    ],
  },
  {
    name: "Breakfast",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
    subcategories: [
      "Poha",
      "Upma",
      "Paratha",
      "Chole Bhature",
      "Idli",
      "Dosa",
      "Sandwich",
      "Omelette",
    ],
  },
  {
    name: "Healthy Food",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400",
    subcategories: [
      "Fruit Bowl",
      "Salad Bowl",
      "Protein Bowl",
      "Smoothie Bowl",
      "Healthy Meals",
    ],
  },
  {
    name: "Kids Menu",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    subcategories: [
      "Kids Burger",
      "Kids Pizza",
      "Nuggets",
      "Fries",
      "Mini Pasta",
      "Mini Meal",
    ],
  },
  {
    name: "Pure Veg",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
    subcategories: [
      "Pure Veg Meals",
      "Jain Food",
      "Veg Snacks",
      "Veg Thali",
    ],
  },
  {
    name: "Jain Food",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    subcategories: [
      "Jain Pizza",
      "Jain Sandwich",
      "Jain Chinese",
      "Jain Main Course",
    ],
  },
  {
    name: "Combos & Deals",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
    subcategories: [
      "Meal Combo",
      "Burger Combo",
      "Pizza Combo",
      "Family Combo",
      "Couple Combo",
      "Student Combo",
    ],
  },
  {
    name: "Party Packs",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    subcategories: [
      "Family Pack",
      "Party Biryani",
      "Pizza Party Pack",
      "Snacks Platter",
      "Beverage Pack",
    ],
  },
];

const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const connectDB = require("../config/db");

async function seedMasterCategories() {
  console.log("=========================================");
  console.log("SEEDING MASTER CATEGORIES & SUBCATEGORIES");
  console.log("=========================================");

  let mainCreated = 0;
  let mainUpdated = 0;
  let subCreated = 0;
  let subUpdated = 0;
  let skipped = 0;
  let existing = 0;
  let errors = 0;

  try {
    mongoose.set('bufferCommands', true);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${MONGO_URI}`);

    let positionCounter = 1;

    for (const catData of MASTER_CATALOG) {
      try {
        const mainSlug = slugify(catData.name);

        let mainCat = await Category.findOne({ type: "main", slug: mainSlug });

        if (!mainCat) {
          mainCat = await Category.create({
            name: catData.name,
            slug: mainSlug,
            type: "main",
            parentCategoryId: null,
            description: `${catData.name} delicious selections`,
            image: catData.image,
            position: positionCounter,
            isActive: true,
            isVisible: true,
            isFeatured: positionCounter <= 10,
            userAppVisible: true,
            restaurantAppVisible: true,
          });
          mainCreated++;
          console.log(`[MAIN CREATED] #${positionCounter} ${mainCat.name} (${mainCat._id})`);
        } else {
          // Do NOT overwrite user-modified position, image, or active status unless missing
          let changed = false;
          if (!mainCat.image && catData.image) {
            mainCat.image = catData.image;
            changed = true;
          }
          if (changed) {
            await mainCat.save();
            mainUpdated++;
            console.log(`[MAIN UPDATED] ${mainCat.name}`);
          } else {
            existing++;
            console.log(`[MAIN EXISTING] ${mainCat.name}`);
          }
        }

        positionCounter++;

        // Process subcategories
        let subPosition = 1;
        for (const subName of catData.subcategories) {
          const subSlug = slugify(subName);

          let subCat = await Category.findOne({
            type: "subcategory",
            parentCategoryId: mainCat._id,
            slug: subSlug,
          });

          if (!subCat) {
            subCat = await Category.create({
              name: subName,
              slug: subSlug,
              type: "subcategory",
              parentCategoryId: mainCat._id,
              description: `${subName} under ${mainCat.name}`,
              image: mainCat.image,
              position: subPosition,
              isActive: true,
              isVisible: true,
              isFeatured: false,
              userAppVisible: true,
              restaurantAppVisible: true,
            });
            subCreated++;
            console.log(`   └─ [SUB CREATED] #${subPosition} ${subCat.name} (${subCat._id})`);
          } else {
            existing++;
            console.log(`   └─ [SUB EXISTING] ${subCat.name}`);
          }
          subPosition++;
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error seeding ${catData.name}:`, err.message);
      }
    }

    console.log("\n=========================================");
    console.log("SEEDING SUMMARY REPORT");
    console.log("=========================================");
    console.log(`Main categories created : ${mainCreated}`);
    console.log(`Main categories updated : ${mainUpdated}`);
    console.log(`Subcategories created   : ${subCreated}`);
    console.log(`Subcategories updated   : ${subUpdated}`);
    console.log(`Existing untouched      : ${existing}`);
    console.log(`Skipped                 : ${skipped}`);
    console.log(`Errors                  : ${errors}`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("Fatal Seeding Error:", error);
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  }
}

if (require.main === module) {
  seedMasterCategories();
}

module.exports = seedMasterCategories;
