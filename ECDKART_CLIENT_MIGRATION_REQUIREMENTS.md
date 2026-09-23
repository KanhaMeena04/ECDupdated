# ECDKART CLIENT DATA MIGRATION REQUIREMENTS

**Date:** 2026-09-19  
**Phase:** Phase 6 — Migration Requirement Classification  
**Target Architecture:** ECDbackend + MongoDB Atlas  
**Audit Status:** Complete (Non-destructive inspection)  

---

## 1. Executive Summary

This document details the **Migration Requirement Classification (Phase 6)** for migrating the client database to the standardized ECDKART multi-app backend (`ECDAdmin`, `ECDbackend`, `User`, `Restaurant`, `Rider`).

Based on schema inspection, index auditing, and collection inventory analysis, the overall database migration category and specific domain classifications have been established. **No migration operations, schema transformations, or index builds have been performed.**

---

## 2. Migration Category Options Evaluated

| Option | Migration Classification | Description | Status |
| :--- | :--- | :--- | :--- |
| **A** | **No Migration** | Client DB matches ECDbackend perfectly in collections, schema, and indexes. | Evaluated |
| **B** | **Schema-Only Migration** | New fields or collections need to be initialized with default values without changing existing data. | Evaluated |
| **C** | **Index-Only Migration** | Database structure is compatible, but required MongoDB performance & geospatial indexes must be built. | **APPLICABLE (Condition 1)** |
| **D** | **Data Transformation** | Field types, legacy formats, or nested address/location structures need active transformation. | Evaluated |
| **E** | **Collection Mapping** | Legacy collection names (e.g., `users_old`, `orders_v1`) require mapping to standard names. | Evaluated |
| **F** | **Full Migration** | Complete database dump, transformation, and reloading required. | Evaluated |
| **G** | **Code Compatibility Changes** | Backend code adjustments required to support client-specific legacy fields. | **APPLICABLE (Condition 2)** |

---

## 3. Final Classification Breakdown

### Primary Classification: **Option C (Index-Only Migration) + Option G (Code & Config Alignment)**

The client database structure exhibits **HIGH COMPATIBILITY** with standard ECDbackend models. A full data migration (Option F) or heavy schema transformation (Option D) is **NOT required**.

The migration requirements are grouped into two primary execution streams:

### Stream 1: Index Creation (Option C - Non-destructive Schema Enhancement)
The client database lacks several required performance compound indexes and critical `2dsphere` geospatial indexes necessary for proximity-based restaurant discovery and rider tracking.

- **Required Index Operations:**
  1. `restaurants`: Add `location` `2dsphere` index (`{ location: "2dsphere" }`).
  2. `riders`: Add `currentLocation` `2dsphere` index (`{ currentLocation: "2dsphere" }`).
  3. `users`: Add `savedAddresses.location` `2dsphere` index (`{ "savedAddresses.location": "2dsphere" }`).
  4. `orders`: Add `deliveryAddress.coordinates` `2dsphere` index (`{ "deliveryAddress.coordinates": "2dsphere" }`).
  5. `orders`: Add compound index `{ user: 1, createdAt: -1 }` for customer order history performance.
  6. `orders`: Add compound index `{ restaurant: 1, status: 1 }` for restaurant order dashboard query acceleration.
  7. `riders`: Add compound index `{ status: 1, isAvailable: 1, isApproved: 1 }` for rider assignment algorithm.

> **Safety Guarantee:** Index creation via `ECDbackend/scripts/ensure_mongodb_indexes.js` uses `{ background: true }` and is non-destructive. It does NOT modify or delete document data.

### Stream 2: Configuration & Initial Seed Verification (Option G)
If the client database is fresh/empty or missing system-level collections (`adminsettings`, `homescreensections`, `categories`), standard system config documents must be provisioned.

- **Required System Collections to Initialize (if missing):**
  - `adminsettings`: Default commission rate, surge pricing toggles, tax percentage, support contacts.
  - `homescreensections`: Banner carousel definitions and category layouts for the User App home screen.

---

## 4. Entity-by-Entity Migration Assessment

| Collection Name | Document Status | Recommended Migration Path | Required Action |
| :--- | :--- | :--- | :--- |
| `users` | Compatible | **C (Index-only)** | Build `2dsphere` on `savedAddresses.location` |
| `restaurants` | Compatible | **C (Index-only)** | Build `2dsphere` on `location` |
| `riders` | Compatible | **C (Index-only)** | Build `2dsphere` on `currentLocation` |
| `products` | Compatible | **A (No Migration)** | Zero schema change required |
| `categories` | Compatible | **A (No Migration)** | Zero schema change required |
| `orders` | Compatible | **C (Index-only)** | Build compound query indexes |
| `promocodes` | Compatible | **A (No Migration)** | Zero schema change required |
| `carts` | Compatible | **A (No Migration)** | Zero schema change required |
| `paymenttransactions` | Compatible | **A (No Migration)** | Zero schema change required |
| `wallettransactions` | Compatible | **A (No Migration)** | Zero schema change required |
| `restaurantwallets` | Compatible | **A (No Migration)** | Zero schema change required |
| `admincommissionwallets` | Compatible | **A (No Migration)** | Zero schema change required |
| `adminsettings` | Missing / Config | **B (Schema-only)** | Initialize single config document if missing |
| `homescreensections` | Missing / Config | **B (Schema-only)** | Initialize layout document if missing |

---

## 5. Prohibited Migration Actions

The following actions are strictly **FORBIDDEN** during Atlas database migration:

1. **NO `db.dropDatabase()` or `collection.drop()`** — Production data must never be cleared.
2. **NO Manual Data Seeding Scripts** — Seed scripts containing test users/restaurants MUST NOT be run against Atlas.
3. **NO Production OTP Hardcoding** — `123456` bypass must remain disabled (`NODE_ENV=production`).
4. **NO Direct Primary Database Operations during Peak Hours** — Index builds should run using `{ background: true }`.

---

**Summary:** The client database requires **Index-Only Migration (Option C)** with minor system configuration initialization. Data transformation (Option D) and full re-migration (Option F) are not required.
