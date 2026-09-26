# ECDKART Client Index Compatibility & Inspection Report (Phase 4)

## Executive Overview

This report documents the required index comparison between **ECDbackend** specifications and the target MongoDB database.

> [!IMPORTANT]
> **Action Policy:** REPORTING ONLY  
> **Index Creation Status:** ZERO indexes created on Atlas database during discovery.

---

## 1. Geospatial `2dsphere` Index Audit

Geospatial indexing is mandatory for location-based restaurant discovery, rider tracking, and delivery range calculation.

| Collection Name | Field Path | Required Index Type | Local Status | Atlas Discovery Mandate |
|---|---|---|---|---|
| `restaurants` | `location.coordinates` | `2dsphere` | **PRESENT** | Must be verified on Atlas before live routing |
| `riders` | `currentLocation.coordinates` | `2dsphere` | **PRESENT** | Must be verified on Atlas before live routing |
| `users` | `savedAddresses.location` | `2dsphere` | **PRESENT** | Must be verified on Atlas before live routing |
| `orders` | `deliveryAddress.coordinates` | `2dsphere` | **PRESENT** | Must be verified on Atlas before live routing |

---

## 2. Unique Constraints Audit

Unique indexes enforce core application integrity rules and prevent duplicate billing or user registration.

| Collection Name | Index Name | Key Definition | Unique Flag | Application Purpose |
|---|---|---|---|---|
| `users` | `users_email_unique` | `{ email: 1 }` | `unique: true, sparse: true` | Prevents duplicate user emails |
| `users` | `users_mobile_unique` | `{ mobile: 1 }` | `unique: true` | Prevents duplicate phone numbers |
| `orders` | `orders_idempotency_unique` | `{ idempotencyKey: 1 }` | `unique: true, sparse: true` | Prevents double order placement |
| `promocodes` | `promocodes_code_unique` | `{ code: 1 }` | `unique: true` | Enforces unique coupon codes |
| `riders` | `riders_user_unique` | `{ user: 1 }` | `unique: true` | Enforces 1-to-1 Rider-User mapping |
| `restaurantwallets` | `restaurant_1` | `{ restaurant: 1 }` | `unique: true` | Enforces 1-to-1 Vendor Wallet mapping |

---

## 3. High-Performance Query & Order Indexes

| Collection Name | Index Specification | Purpose |
|---|---|---|
| `orders` | `{ status: 1, restaurant: 1 }` | Fast vendor active order filtering |
| `orders` | `{ customer: 1, createdAt: -1 }` | Fast customer order history lookup |
| `orders` | `{ rider: 1 }` | Fast rider assigned order lookup |
| `products` | `{ restaurant: 1, isAvailable: 1 }` | Fast vendor menu catalog rendering |
| `auditlogs` | `{ entity: 1, entityId: 1, createdAt: -1 }` | Fast audit trail history |

---

## 4. Safe Index Creation Execution Plan

When migration approval is granted, run the idempotent index script:
```bash
node ECDbackend/scripts/ensure_mongodb_indexes.js
```
*Note: This script runs with `background: true`, does not drop existing indexes, and does not alter documents.*
