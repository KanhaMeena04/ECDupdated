# ECDKART Database Schema Alignment & Data Preservation Report

## Executive Summary
This document outlines the MongoDB schema additions and validation rules implemented to support the updated Restaurant App baseline without breaking existing database documents or compromising data integrity.

---

## 1. Collection Schema Extensions

### A. `Order` Collection Schema (`ECDbackend/models/Order.js`)

```js
{
  orderType: {
    type: String,
    enum: ["delivery", "self_pickup", "pickup"],
    default: "delivery"
  },
  prepTimeMinutes: { type: Number, default: 15 },
  bufferTimeMinutes: { type: Number, default: 0 },
  bufferReason: { type: String },
  prepNote: { type: String },
  readyAt: { type: Date },
  scheduledAt: { type: Date },
  gracePeriodMinutes: { type: Number, default: 15 },
  selfPickupCode: { type: String },
  selfPickupVerifiedAt: { type: Date },
  cancellationReason: { type: String },
  cancellationInitiatedBy: {
    type: String,
    enum: ["customer", "restaurant_owner", "rider", "system", "admin"]
  }
}
```

### B. `Restaurant` Collection Schema (`ECDbackend/models/Restaurant.js`)

```js
{
  isOnline: { type: Boolean, default: true },
  autoAcceptOrders: { type: Boolean, default: false },
  prepBufferTimeMinutes: { type: Number, default: 0 },
  isSelfPickupEnabled: { type: Boolean, default: true },
  cancellationWindowMinutes: { type: Number, default: 5 },
  gracePeriodMinutes: { type: Number, default: 15 },
  menuApproved: { type: Boolean, default: false },
  restaurantApproved: { type: Boolean, default: false }
}
```

### C. `Product` Collection Schema (`ECDbackend/models/Product.js`)

```js
{
  isAvailable: { type: Boolean, default: true },
  outOfStock: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 15 },
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false }
}
```

---

## 2. Backward Compatibility & Data Safety Rules
1. **No Destructive Operations**: No database collection dropping, reset scripts, or field removals were performed.
2. **Safe Defaults**: All newly added fields contain sensible defaults (`default: 15` for preparation time, `default: true` for `isSelfPickupEnabled`).
3. **Indexing**: Existing 2dsphere spatial indexes on `location.coordinates` and compound indexes on `(restaurant, status)` have been strictly preserved for high query performance.
