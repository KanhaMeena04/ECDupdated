# ECDKART Database Schema Migration & Preservation Plan

## Executive Summary

This document outlines the database migration strategy, index requirements, and data preservation mandates for connecting **ECDbackend** to the client's Atlas MongoDB database.

---

## 1. Collections & Data Preservation Strategy

When connecting to the client's existing database, existing operational data MUST be preserved and MUST NOT be dropped, wiped, or overwritten.

| Collection | Preservation Requirement | Migration Strategy |
|---|---|---|
| `users` | **CRITICAL PRESERVATION** | Preserve all existing customer, vendor, rider, and admin account documents. Add missing schema fields (`isBlocked: false`, `isDeleted: false`, `savedAddresses`) with default values. |
| `restaurants` | **CRITICAL PRESERVATION** | Preserve existing vendor profiles, contact details, and locations. Transform legacy flat strings `name: "My Cafe"` to translation objects `name: { en: "My Cafe" }` if legacy data exists. |
| `products` | **CRITICAL PRESERVATION** | Preserve existing menu items. Backfill missing `basePrice` from `price` and add `adminPriceOverride: { isOverridden: false }`. |
| `categories` | **HIGH PRESERVATION** | Preserve category structures. Ensure every category document contains a valid `restaurant` ObjectId reference. |
| `orders` | **STRICT READ-ONLY PRESERVATION** | Retain all historical customer orders and financial receipts. Ensure `idempotencyKey` and `orderType` fields are initialized. |
| `riders` | **HIGH PRESERVATION** | Preserve rider registration documents, vehicle verification status, and work zones. |
| `wallettransactions` / `restaurantwallets` | **STRICT FINANCIAL PRESERVATION** | Retain all transaction ledgers and financial balances. |
| `promocodes` | **HIGH PRESERVATION** | Retain active promo codes and discount configurations. |
| `adminsettings` | **CONFIG PRESERVATION** | Retain active system commission settings, tax rates, and global parameters. |

---

## 2. Required MongoDB Indexes & Constraints Audit

To ensure high-performance querying and data integrity, the following indexes MUST exist on the target Atlas MongoDB instance prior to going live:

### A. Geospatial Indexes (`2dsphere`)
1. `restaurants`: `location.coordinates` (`2dsphere`) — Required for location-based restaurant discovery & geofencing.
2. `riders`: `currentLocation.coordinates` (`2dsphere`) — Required for real-time rider tracking and nearest-rider dispatching algorithms.
3. `users`: `savedAddresses.location` (`2dsphere`) — Required for delivery address geo-validation.
4. `orders`: `deliveryAddress.coordinates` (`2dsphere`) — Required for delivery route distance calculation.

### B. Unique Constraints & Indexes
1. `users`: `{ email: 1 }` (unique, sparse), `{ mobile: 1 }` (unique, sparse)
2. `orders`: `{ idempotencyKey: 1 }` (unique, sparse) — Prevents duplicate billing and double order submission.
3. `promocodes`: `{ code: 1 }` (unique, uppercase)
4. `riders`: `{ user: 1 }` (unique) — Ensures 1-to-1 mapping between User and Rider profiles.

### C. Performance Query Indexes
1. `orders`: `{ status: 1, restaurant: 1 }`, `{ customer: 1, createdAt: -1 }`, `{ rider: 1 }`
2. `products`: `{ restaurant: 1, isAvailable: 1 }`, `{ category: 1 }`
3. `auditlogs`: `{ entity: 1, entityId: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`

---

## 3. Schema Compatibility Risks & Remediation

| Potential Compatibility Risk | Root Cause | Automatic Remediation Strategy |
|---|---|---|
| **Legacy Flat String Translations** | Old database stored `name: "Burger King"` instead of `{ en: "Burger King" }`. | Pre-migration migration script converts string fields to `{ en: string }` format. |
| **Missing Category Reference on Products** | Legacy products lacked a `category` ObjectId. | Auto-link to default "General" category created per restaurant. |
| **Missing Order Type** | Historical orders lacked `orderType` field. | Default unpopulated historical order `orderType` to `"delivery"`. |
| **Missing Vendor Description** | Legacy restaurants lacked `description.en`. | Set default `description: { en: "Quality food and service" }` during schema normalization. |
| **Missing Vehicle Details on Riders** | Legacy rider documents lacked nested `vehicle` object. | Backfill `vehicle: { type: "bike", number: "UNREGISTERED" }` for unpopulated rider records. |
