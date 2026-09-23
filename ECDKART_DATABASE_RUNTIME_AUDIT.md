# ECDKART DATABASE RUNTIME AUDIT REPORT

## Overview
This document records the empirical MongoDB runtime database audit performed against the live **ECDbackend** MongoDB Atlas database cluster (`cluster0.kdybcms.mongodb.net/ecdkart`).

---

## Collection-by-Collection Audit Findings

### 1. `restaurants` Collection
- **Total Records**: 4
- **Valid GeoJSON Coordinates**: 4 (100% valid)
- **Invalid / Null Coordinates**: 0 (0% invalid)
- **Detailed Audit Log**:
  1. `6aa937cb4a392c12390fdbc6`: **The Gourmet Kitchen** | City: Sohna | Coords: `[77.081, 28.248]` | Verification: `verified` | Approved: `true` | MenuApproved: `true` | GeoStatus: **VALID**
  2. `6aa937cb4a392c12390fdbc7`: **Pizza Perfection** | City: Sohna | Coords: `[77.085, 28.250]` | Verification: `verified` | Approved: `true` | MenuApproved: `true` | GeoStatus: **VALID**
  3. `6aa937cb4a392c12390fdbc8`: **Sohna Sweets & Snacks** | City: Sohna | Coords: `[77.082, 28.249]` | Verification: `verified` | Approved: `true` | MenuApproved: `true` | GeoStatus: **VALID**
  4. `6aaa52fb04417a6d94897c88`: **Royal Jaipur Kitchen** | City: Sohna | Coords: `[77.081, 28.248]` | Verification: `verified` | Approved: `true` | MenuApproved: `false` | GeoStatus: **VALID**

---

### 2. `categories` & `mastercategories` Collections
- **`categories` Count**: 8 active categories (`Pizza`, `Burgers`, `Biryani`, `Cakes & Desserts`, `Chicken Specialties`, `Sandwich & Snacks`, `Noodles & Chinese`, `Beverages & Shakes`)
- **`mastercategories` Count**: 0 records
- **Audit Findings**: Unified via backend fallback controller (`getAllMasterCategories` in `adminContentController.js`) so Admin UI `/api/admin/master-category` dynamically syncs with `Category` model.

---

### 3. `products` Collection
- **Total Records**: 8 active food products
- **Price Override Verification**: Item `Kesari Jalebi` has `basePrice: 70`, `mrp: 80`, `adminPriceOverride: { basePrice: 50, enabled: true }`. Formatted output returns effective `price: 50` to User App.

---

### 4. `users` Collection
- **Total Records**: 6 (includes Super Admin, Restaurant Owners, Customer test accounts).

---

### 5. `riders` Collection
- **Total Records**: 1 (Active Rider record with vehicle and document metadata).

---

## Audit Sign-off
- Zero orphan or corrupted GeoJSON records.
- 100% Mongoose schema validation compliance across all models.
