# ECDKART Client Schema Compatibility Report (Phase 2)

## Executive Overview

This report provides a model-by-model compatibility analysis comparing the current **ECDbackend** Mongoose schemas against the client database schema structures.

> [!NOTE]
> **Compatibility Classification Guide:**
> - **MATCH:** Schemas match 100% in fields, types, and nested structures.
> - **COMPATIBLE:** Minor non-breaking differences; existing data conforms to target schema via default fallbacks.
> - **MISMATCH:** Field names, data types, or required fields differ and require automated transformation.
> - **MISSING:** Collection or key schema fields absent in client DB; schema initialization required.
> - **UNKNOWN:** Uninspected collection requiring client-provided Atlas sample data.

---

## 1. Collection-by-Collection Compatibility Matrix

| Mongoose Model File | Target Collection | Classification | Compatibility Summary & Details |
|---|---|---|---|
| `User.js` | `users` | **COMPATIBLE** | Matches core account fields (`name`, `email`, `mobile`, `password`, `role`). Local schema contains `savedAddresses` array with 2dsphere location. |
| `Restaurant.js` | `restaurants` | **COMPATIBLE** | Matches multi-language `name.en`, `description.en`, `contactNumber`, `email`, `address`, `deliveryTime`. Requires `adminPriceOverride` sub-schema. |
| `Product.js` | `products` | **COMPATIBLE** | Matches `name.en`, `basePrice`, `offerPrice`, `isVeg`, `isAvailable`, `restaurant`, `category`. Lacks optional `adminPriceOverride` in older records. |
| `Category.js` | `categories` | **MATCH** | Matches `name.en`, `restaurant` ObjectId reference, and `isActive` status. |
| `Order.js` | `orders` | **COMPATIBLE** | Matches `customer`, `restaurant`, `items`, `itemTotal`, `deliveryFee`, `totalAmount`, `orderType` (`self_pickup` / `delivery`), `selfPickupCode`, `status`, `paymentMethod`, `paymentStatus`. |
| `Rider.js` | `riders` | **COMPATIBLE** | Matches `user` ObjectId reference, `vehicle: { type, number }`, `currentLocation.coordinates`, `isOnline`, `isAvailable`. |
| `Promocode.js` | `promocodes` | **MATCH** | Matches `code`, `offerType`, `discountValue`, `minOrderValue`, `availableFrom`, `expiryDate`, `status`. |
| `WalletTransaction.js` | `wallettransactions` | **MATCH** | Matches `user`, `amount`, `type`, `description`, `status`. |
| `RestaurantWallet.js` | `restaurantwallets` | **MATCH** | Matches `restaurant` ObjectId reference, `balance`, `pendingPayouts`. |
| `AdminSetting.js` | `adminsettings` | **MATCH** | Matches global tax rates, commission percentages, and support parameters. |
| `AuditLog.js` | `auditlogs` | **MATCH** | Matches `entity`, `entityId`, `action`, `userId`, `userRole`, `reason`. |

---

## 2. Key Schema Field Mapping & Requirements

### A. `User` Schema
- **Required Fields:** `name`, `email`, `mobile`, `password`, `role` (`"customer"`, `"restaurant_owner"`, `"rider"`, `"admin"`)
- **Default Fallbacks:** `isVerified: true`, `isDeleted: false`, `isBlocked: false`

### B. `Restaurant` Schema
- **Required Fields:** `owner`, `name.en`, `description.en`, `email`, `contactNumber`, `address`, `city`, `area`, `deliveryTime`
- **Geospatial Field:** `location` `{ type: "Point", coordinates: [Number] }`
- **Approval Flags:** `restaurantApproved: true`, `menuApproved: true`, `isActive: true`, `isOnline: true`

### C. `Order` Schema
- **Required Fields:** `customer`, `restaurant`, `items`, `itemTotal`, `deliveryFee`, `totalAmount`, `orderType` (`"self_pickup"` or `"delivery"`)
- **Self-Pickup Verification:** `selfPickupCode` (4-digit string e.g. `"8899"`), `pickupOtp`
- **Delivery Flow:** `rider` (Rider ObjectId reference), `status` (`"placed"`, `"accepted"`, `"preparing"`, `"ready"`, `"delivered"`, `"cancelled"`)
