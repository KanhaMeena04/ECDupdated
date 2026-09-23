# ECDKART Client Database Inventory Report (Phase 1 & 7)

## Executive Summary

This report documents the collection inventory, document counts, index definitions, and database infrastructure specifications for the **ECDKART Food Delivery Ecosystem** client database migration audit.

> [!IMPORTANT]
> **Audit Status:** Strict Read-Only Discovery  
> **Target Database Host:** Local Sandbox & Prepared Atlas Connector  
> **Modifications Executed:** ZERO (No writes, updates, deletes, or index creation)

---

## 1. Collection & Document Inventory

The database structure contains **11 primary collections** with **73 total documents** in the local verification snapshot:

| Collection Name | Document Count | Index Count | Primary Purpose & Business Function |
|---|---|---|---|
| `users` | 8 | 7 | Customer, Vendor, Rider, and Admin user accounts |
| `restaurants` | 5 | 5 | Restaurant profiles, vendor details, location, and operational settings |
| `products` | 10 | 3 | Menu items, pricing, availability, and variations |
| `categories` | 4 | 2 | Food categories and subcategories per restaurant |
| `orders` | 22 | 9 | Customer orders, self-pickup codes, items, delivery tracking, and receipts |
| `riders` | 1 | 9 | Rider profiles, vehicle details, work zones, and online availability |
| `promocodes` | 1 | 2 | Promotional coupons, discount rules, and usage limits |
| `wallettransactions` | 10 | 2 | Customer and rider wallet credit/debit transaction logs |
| `restaurantwallets` | 1 | 2 | Vendor earnings, payout ledgers, and wallet balances |
| `adminsettings` | 1 | 1 | Global system settings, tax configurations, commission rates |
| `auditlogs` | 9 | 8 | Immutable system activity logs and admin action tracking |

---

## 2. Infrastructure & Collection Statistics

```json
{
  "database": "ecdkart_local_dev",
  "totalCollections": 11,
  "totalDocuments": 73,
  "cappedCollections": 0,
  "systemCollections": 0,
  "geospatialIndexes": 4,
  "uniqueIndexes": 6
}
```

---

## 3. Detailed Index Inventory by Collection

### A. `users` Collection
- `_id_`: `{ "_id": 1 }`
- `email_1`: `{ "email": 1 }` **[UNIQUE, SPARSE]**
- `mobile_1`: `{ "mobile": 1 }` **[UNIQUE]**
- `email_1_isDeleted_1`: `{ "email": 1, "isDeleted": 1 }`
- `mobile_1_isDeleted_1`: `{ "mobile": 1, "isDeleted": 1 }`
- `role_1`: `{ "role": 1 }`
- `savedAddresses.location_2dsphere`: `{ "savedAddresses.location": "2dsphere" }` **[2DSPHERE]**

### B. `restaurants` Collection
- `_id_`: `{ "_id": 1 }`
- `location.coordinates_2dsphere`: `{ "location.coordinates": "2dsphere" }` **[2DSPHERE]**
- `restaurants_owner`: `{ "owner": 1 }`
- `restaurants_active_online`: `{ "isActive": 1, "isOnline": 1 }`
- `restaurants_city_area`: `{ "city": 1, "area": 1 }`

### C. `riders` Collection
- `_id_`: `{ "_id": 1 }`
- `user_1`: `{ "user": 1 }` **[UNIQUE]**
- `currentLocation.coordinates_2dsphere`: `{ "currentLocation.coordinates": "2dsphere" }` **[2DSPHERE]**
- `isOnline_1`: `{ "isOnline": 1 }`
- `isAvailable_1`: `{ "isAvailable": 1 }`
- `workCity_1_workZone_1`: `{ "workCity": 1, "workZone": 1 }`
- `riders_online_available`: `{ "isOnline": 1, "isAvailable": 1 }`

### D. `orders` Collection
- `_id_`: `{ "_id": 1 }`
- `idempotencyKey_1`: `{ "idempotencyKey": 1 }` **[SPARSE]**
- `status_1`: `{ "status": 1 }`
- `customer_1_createdAt_-1`: `{ "customer": 1, "createdAt": -1 }`
- `rider_1`: `{ "rider": 1 }`
- `deliveryAddress.coordinates_2dsphere`: `{ "deliveryAddress.coordinates": "2dsphere" }` **[2DSPHERE]**
- `restaurant_1`: `{ "restaurant": 1 }`
- `paymentStatus_1`: `{ "paymentStatus": 1 }`
- `status_1_restaurant_1`: `{ "status": 1, "restaurant": 1 }`

---

## 4. Production Environment Configuration Requirements

Prior to switching live application traffic to Atlas, the following configurations MUST be set:

| Service / Feature | Local Setting | Required Client Production Value | Secret Management Rule |
|---|---|---|---|
| **MongoDB Database** | `mongodb://127.0.0.1:27017/...` | `mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/<DB>?...` | Stored in production `.env` (`MONGO_URI`) |
| `JWT_SECRET` | `ecd_local_dev_jwt_secret_key_2026` | Cryptographically generated 256-bit secret string | Stored in production `.env` (`JWT_SECRET`) |
| **CORS Origins** | `*` / `localhost` | `https://admin.ecdkart.com`, `https://ecdkart.com` | Configured in Express CORS whitelist |
| **Push Notifications (FCM)** | Disabled | Client Firebase Admin SDK `serviceAccountKey.json` | Placed in `ECDbackend/config/` (gitignored) |
| **SMS Gateway (Twilio)** | Disabled / Dev Mock | Account SID, Auth Token, Sender Phone Number | Stored in `.env` (`TWILIO_ACCOUNT_SID`, etc.) |
| **Stripe Payments** | Test Keys | Live Secret Key (`sk_live_...`) | Stored in `.env` (`STRIPE_SECRET_KEY`) |
| **Razorpay Payments** | Test Keys | Live Key ID & Secret (`rzp_live_...`) | Stored in `.env` (`RAZORPAY_KEY_ID`, etc.) |
| **Google Maps API** | Test Key | Live Geocoding & Distance Matrix API Key | Configured in frontend & backend `.env` |
