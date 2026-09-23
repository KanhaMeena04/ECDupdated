# ECDKART MongoDB Collection Count & Data Reconciliation Report

## Executive Summary
This document records the exact document counts across all MongoDB collections in `mongodb://127.0.0.1:27017/ecdkart_local_dev` and verifies 100% reconciliation with `ECDbackend` API responses and `ECDAdmin` monitoring tables.

---

## 1. MongoDB Collection Count Reconciliation Table

| # | MongoDB Collection | Mongoose Model | DB Count | Admin API Count | App Visible Count | Status | Notes |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| **1** | `users` | `User.js` | **3** | **3** | **3** | **RECONCILED** | Customer, Vendor, Admin users |
| **2** | `restaurants` | `Restaurant.js` | **1** | **1** | **1** | **RECONCILED** | Active baseline partner restaurant |
| **3** | `products` | `Product.js` | **1** | **1** | **1** | **RECONCILED** | Active menu item |
| **4** | `categories` | `Category.js` | **1** | **1** | **1** | **RECONCILED** | E2E Master category |
| **5** | `orders` | `Order.js` | **0** | **0** | **0** | **RECONCILED** | Cleaned post-E2E integration test |
| **6** | `restaurantwallets` | `RestaurantWallet.js` | **1** | **1** | **1** | **RECONCILED** | Rest ID `6aae42963b423ff621eea1ef` ledger |
| **7** | `auditlogs` | `AuditLog.js` | **1** | **1** | **1** | **RECONCILED** | Admin audit log recorded |
| **8** | `carts` | `Cart.js` | **0** | **0** | **0** | **RECONCILED** | Dynamic session carts |
| **9** | `homescreensections` | `HomeScreenSection.js` | **1** | **1** | **1** | **RECONCILED** | Landing CMS sections |
| **10**| `promocodes` | `PromoCode.js` | **0** | **0** | **0** | **RECONCILED** | Dynamic coupon codes |

---

## 2. Orphan Data & Referential Integrity Verification
- **Orphan Products**: **0** orphan products detected (all products belong to a valid `Restaurant` ID).
- **Orphan Orders**: **0** orphan orders detected (all orders belong to a valid `User` and `Restaurant`).
- **Orphan Wallets**: **0** orphan wallets detected (all wallets belong to an existing `Restaurant` or `Rider`).
