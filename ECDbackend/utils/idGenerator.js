const mongoose = require("mongoose");
const Counter = require("../models/Counter");

/**
 * Safely resolves a Mongoose model without causing circular dependencies.
 */
function getModel(name) {
  try {
    return mongoose.model(name);
  } catch (_) {
    try {
      return require(`../models/${name}`);
    } catch (e) {
      return null;
    }
  }
}

/**
 * Atomically generates the next sequential formatted ID for an entity.
 * Guarantees numbers increment sequentially: e.g. RDR001 -> RDR002, RNT001 -> RNT002, C001 -> C002.
 * @param {string} name - 'order' | 'customer' | 'restaurant' | 'rider'
 * @param {string} prefix - 'ORD' | 'C' | 'RNT' | 'RDR'
 * @param {number} padDigits - minimum digits (default 3 => 001, 002)
 * @param {string} [modelName] - 'Order' | 'User' | 'Restaurant' | 'Rider'
 * @param {string} [idField] - 'orderNumber' | 'customerId' | 'restaurantId' | 'riderId'
 */
async function getNextSequence(name, prefix, padDigits = 3, modelName = null, idField = null) {
  try {
    const model = modelName ? getModel(modelName) : null;
    let maxExistingNum = 0;

    // Scan existing documents to find the highest number in DB matching prefix
    if (model && idField) {
      try {
        const regexPattern = new RegExp(`^${prefix}\\d+`, "i");
        const docs = await model.find({ [idField]: { $regex: regexPattern } })
          .select(idField)
          .lean();

        for (const doc of docs) {
          const val = doc[idField];
          if (typeof val === "string") {
            const numPart = parseInt(val.toUpperCase().replace(prefix.toUpperCase(), ""), 10);
            if (!isNaN(numPart) && numPart > maxExistingNum) {
              maxExistingNum = numPart;
            }
          }
        }
      } catch (err) {
        console.warn(`[idGenerator] Warning scanning ${idField} for ${name}:`, err.message);
      }
    }

    // Initialize or reconcile Counter so it is never behind existing DB records
    let counter = await Counter.findById(name);
    if (!counter) {
      counter = await Counter.findByIdAndUpdate(
        name,
        { $setOnInsert: { seq: maxExistingNum } },
        { upsert: true, new: true }
      );
    } else if (counter.seq < maxExistingNum) {
      counter = await Counter.findByIdAndUpdate(
        name,
        { $set: { seq: maxExistingNum } },
        { new: true }
      );
    }

    // Atomically increment by 1
    const updated = await Counter.findByIdAndUpdate(
      name,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numStr = String(updated.seq).padStart(padDigits, "0");
    return `${prefix}${numStr}`;
  } catch (err) {
    console.error(`[idGenerator] Error generating sequence for ${name}:`, err);
    const randomFallback = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomFallback}`;
  }
}

async function getNextOrderId() {
  return getNextSequence("order", "ORD", 3, "Order", "orderNumber");
}

async function getNextCustomerId() {
  return getNextSequence("customer", "C", 3, "User", "customerId");
}

async function getNextRestaurantId() {
  return getNextSequence("restaurant", "RNT", 3, "Restaurant", "restaurantId");
}

async function getNextRiderId() {
  return getNextSequence("rider", "RDR", 3, "Rider", "riderId");
}

/**
 * Ensures user has a valid customerId (e.g. C001, C002)
 */
async function ensureCustomerId(user) {
  if (!user) return "C001";
  if (user.customerId && typeof user.customerId === "string" && /^C\d+/i.test(user.customerId)) {
    return user.customerId.toUpperCase();
  }
  const newId = await getNextCustomerId();
  try {
    const User = getModel("User");
    if (user._id && User) {
      await User.findByIdAndUpdate(user._id, { customerId: newId });
      user.customerId = newId;
    }
  } catch (_) {}
  return newId;
}

/**
 * Ensures restaurant has a valid restaurantId (e.g. RNT001, RNT002)
 */
async function ensureRestaurantId(restaurant) {
  if (!restaurant) return "RNT001";
  if (restaurant.restaurantId && typeof restaurant.restaurantId === "string" && /^RNT\d+/i.test(restaurant.restaurantId)) {
    return restaurant.restaurantId.toUpperCase();
  }
  const newId = await getNextRestaurantId();
  try {
    const Restaurant = getModel("Restaurant");
    if (restaurant._id && Restaurant) {
      await Restaurant.findByIdAndUpdate(restaurant._id, { restaurantId: newId });
      restaurant.restaurantId = newId;
    }
  } catch (_) {}
  return newId;
}

/**
 * Ensures rider has a valid riderId (e.g. RDR001, RDR002)
 */
async function ensureRiderId(rider) {
  if (!rider) return "RDR001";
  if (rider.riderId && typeof rider.riderId === "string" && /^RDR\d+/i.test(rider.riderId)) {
    return rider.riderId.toUpperCase();
  }
  const newId = await getNextRiderId();
  try {
    const Rider = getModel("Rider");
    if (rider._id && Rider) {
      await Rider.findByIdAndUpdate(rider._id, { riderId: newId });
      rider.riderId = newId;
    }
  } catch (_) {}
  return newId;
}

/**
 * Backfills and re-aligns any existing database records missing or duplicate formatted sequential IDs.
 */
async function backfillMissingIds() {
  try {
    console.log("[idGenerator] Checking and re-aligning Rider, Restaurant, and Customer formatted IDs...");
    const Restaurant = getModel("Restaurant");
    const Rider = getModel("Rider");
    const User = getModel("User");
    const Counter = getModel("Counter");

    // 1. Re-align Restaurants (RNT001 for oldest, RNT002, RNT003...)
    if (Restaurant) {
      const allRestaurants = await Restaurant.find({}).sort({ createdAt: 1, _id: 1 });
      let index = 1;

      for (const rest of allRestaurants) {
        const expectedId = `RNT${String(index).padStart(3, "0")}`;
        if (rest.restaurantId !== expectedId) {
          await Restaurant.findByIdAndUpdate(rest._id, { restaurantId: expectedId });
          rest.restaurantId = expectedId;
          console.log(`[idGenerator] Saved permanent restaurantId ${expectedId} for "${rest.name?.en || rest.name || rest._id}"`);
        }
        index++;
      }

      if (Counter && allRestaurants.length > 0) {
        await Counter.findByIdAndUpdate(
          "restaurant",
          { $set: { seq: allRestaurants.length } },
          { upsert: true, new: true }
        );
      }
    }

    // 2. Re-align Riders (RDR001, RDR002, RDR003...)
    if (Rider) {
      const allRiders = await Rider.find({}).sort({ createdAt: 1, _id: 1 });
      const usedRiderIds = new Set();
      let rIndex = 1;

      for (const r of allRiders) {
        const currentId = r.riderId ? String(r.riderId).toUpperCase() : "";
        const isDuplicateOrDefault = !currentId ||
          (currentId === "RDR001" && rIndex > 1) ||
          usedRiderIds.has(currentId) ||
          !/^RDR\d+/i.test(currentId);

        let finalId = currentId;
        if (isDuplicateOrDefault) {
          let numStr = String(rIndex).padStart(3, "0");
          let candidateId = `RDR${numStr}`;
          while (usedRiderIds.has(candidateId)) {
            rIndex++;
            numStr = String(rIndex).padStart(3, "0");
            candidateId = `RDR${numStr}`;
          }
          finalId = candidateId;
          await Rider.findByIdAndUpdate(r._id, { riderId: finalId });
          console.log(`[idGenerator] Re-aligned riderId ${finalId} for rider "${r.name || r._id}"`);
        }

        usedRiderIds.add(finalId);
        rIndex++;
      }

      let maxRiderNum = 0;
      for (const id of usedRiderIds) {
        const numPart = parseInt(id.replace(/^RDR/i, ""), 10);
        if (!isNaN(numPart) && numPart > maxRiderNum) {
          maxRiderNum = numPart;
        }
      }
      if (Counter && maxRiderNum > 0) {
        await Counter.findByIdAndUpdate(
          "rider",
          { $set: { seq: maxRiderNum } },
          { upsert: true, new: true }
        );
      }
    }

    // 3. Re-align Customers/Users (C001, C002, C003...)
    if (User) {
      const allUsers = await User.find({}).sort({ createdAt: 1, _id: 1 });
      const usedUserIds = new Set();
      let uIndex = 1;

      for (const u of allUsers) {
        const currentId = u.customerId ? String(u.customerId).toUpperCase() : "";
        const isDuplicateOrDefault = !currentId ||
          (currentId === "C001" && uIndex > 1) ||
          usedUserIds.has(currentId) ||
          !/^C\d+/i.test(currentId);

        let finalId = currentId;
        if (isDuplicateOrDefault) {
          let numStr = String(uIndex).padStart(3, "0");
          let candidateId = `C${numStr}`;
          while (usedUserIds.has(candidateId)) {
            uIndex++;
            numStr = String(uIndex).padStart(3, "0");
            candidateId = `C${numStr}`;
          }
          finalId = candidateId;
          await User.findByIdAndUpdate(u._id, { customerId: finalId });
        }

        usedUserIds.add(finalId);
        uIndex++;
      }

      let maxUserNum = 0;
      for (const id of usedUserIds) {
        const numPart = parseInt(id.replace(/^C/i, ""), 10);
        if (!isNaN(numPart) && numPart > maxUserNum) {
          maxUserNum = numPart;
        }
      }
      if (Counter && maxUserNum > 0) {
        await Counter.findByIdAndUpdate(
          "customer",
          { $set: { seq: maxUserNum } },
          { upsert: true, new: true }
        );
      }
    }

    console.log("[idGenerator] Formatted ID check, re-alignment, and backfill complete.");
  } catch (err) {
    console.error("[idGenerator] Error in backfillMissingIds:", err.message);
  }
}

module.exports = {
  getNextSequence,
  getNextOrderId,
  getNextCustomerId,
  getNextRestaurantId,
  getNextRiderId,
  ensureCustomerId,
  ensureRestaurantId,
  ensureRiderId,
  backfillMissingIds,
};
