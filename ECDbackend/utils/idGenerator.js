const Counter = require("../models/Counter");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Order = require("../models/Order");

/**
 * Atomically generates the next formatted ID for an entity.
 * @param {string} name - 'order' | 'customer' | 'restaurant' | 'rider'
 * @param {string} prefix - 'ORD' | 'C' | 'RNT' | 'RDR'
 * @param {number} padDigits - minimum digits (default 3 => 001, 002)
 * @param {mongoose.Model} [modelToCheck] - optional model to baseline sequence if counter is fresh
 */
async function getNextSequence(name, prefix, padDigits = 3, modelToCheck = null) {
  try {
    let existing = await Counter.findById(name);
    if (!existing) {
      let baseline = 0;
      if (modelToCheck) {
        try {
          baseline = await modelToCheck.countDocuments();
        } catch (_) {}
      }
      existing = await Counter.findByIdAndUpdate(
        name,
        { $setOnInsert: { seq: baseline } },
        { upsert: true, new: true }
      );
    }

    const updated = await Counter.findByIdAndUpdate(
      name,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numStr = String(updated.seq).padStart(padDigits, "0");
    return `${prefix}${numStr}`;
  } catch (err) {
    console.error(`[idGenerator] Error generating sequence for ${name}:`, err);
    // Fallback if counter fails
    const randomFallback = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomFallback}`;
  }
}

async function getNextOrderId() {
  return getNextSequence("order", "ORD", 3, Order);
}

async function getNextCustomerId() {
  return getNextSequence("customer", "C", 3, User);
}

async function getNextRestaurantId() {
  return getNextSequence("restaurant", "RNT", 3, Restaurant);
}

async function getNextRiderId() {
  return getNextSequence("rider", "RDR", 3, Rider);
}

/**
 * Ensures user has a valid customerId (e.g. C001)
 */
async function ensureCustomerId(user) {
  if (!user) return "C001";
  if (user.customerId && typeof user.customerId === "string" && user.customerId.startsWith("C")) {
    return user.customerId;
  }
  const newId = await getNextCustomerId();
  try {
    if (user._id) {
      await User.findByIdAndUpdate(user._id, { customerId: newId });
      user.customerId = newId;
    }
  } catch (_) {}
  return newId;
}

/**
 * Ensures restaurant has a valid restaurantId (e.g. RNT001)
 */
async function ensureRestaurantId(restaurant) {
  if (!restaurant) return "RNT001";
  if (restaurant.restaurantId && typeof restaurant.restaurantId === "string" && restaurant.restaurantId.startsWith("RNT")) {
    return restaurant.restaurantId;
  }
  const newId = await getNextRestaurantId();
  try {
    if (restaurant._id) {
      await Restaurant.findByIdAndUpdate(restaurant._id, { restaurantId: newId });
      restaurant.restaurantId = newId;
    }
  } catch (_) {}
  return newId;
}

/**
 * Ensures rider has a valid riderId (e.g. RDR001)
 */
async function ensureRiderId(rider) {
  if (!rider) return "RDR001";
  if (rider.riderId && typeof rider.riderId === "string" && rider.riderId.startsWith("RDR")) {
    return rider.riderId;
  }
  const newId = await getNextRiderId();
  try {
    if (rider._id) {
      await Rider.findByIdAndUpdate(rider._id, { riderId: newId });
      rider.riderId = newId;
    }
  } catch (_) {}
  return newId;
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
};
