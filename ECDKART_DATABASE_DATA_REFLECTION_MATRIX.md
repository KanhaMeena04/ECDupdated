# ECDKART Database Data Reflection & Single Source of Truth Matrix

> [!NOTE]
> This matrix audits **data reflection** across all 5 applications in the ECDKART ecosystem. It proves that MongoDB serves as the single source of truth (`MongoDB -> ECDbackend -> ECDadmin / User / Restaurant / Rider Apps`), verifying visibility rules, CRUD operations, audit log recording, and real-time WebSocket updates.

---

## Data Reflection Audit Matrix

| Entity | MongoDB Collection | Backend Model | Controller File | Primary API Route | Admin | User | Restaurant | Rider | CRUD | Audit Log | Real-Time | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **User Profile** | `users` | `User.js` | `userController.js` | `/api/user/profile` | PASS | PASS | PASS | PASS | Full | Yes | No | **PASS** | User records populated in MongoDB; role checks enforced. |
| **Restaurant Profile** | `restaurants` | `Restaurant.js` | `restaurantController.js` | `/api/restaurants` | PASS | PASS | PASS | N/A | Full | Yes | Yes | **PASS** | Visibility requires `restaurantApproved=true`, `menuApproved=true`, `isActive=true`. |
| **Delivery Rider** | `riders` | `Rider.js` | `riderController.js` | `/api/riders` | PASS | N/A | N/A | PASS | Full | Yes | Yes | **PASS** | Rider state transitions (`online`, `duty_status`, `assigned`) synced via WebSockets. |
| **Food Category** | `categories` | `Category.js` | `homeController.js` | `/api/categories` | PASS | PASS | N/A | N/A | Full | Yes | No | **PASS** | Dynamic category array fetched by User App home screen. |
| **Master Category** | `mastercategories` | `MasterCategory.js` | `adminContentController.js` | `/api/admin/master-category` | PASS | N/A | N/A | N/A | Full | Yes | No | **PASS** | Fallback to `Category` collection if MasterCategory empty. |
| **Menu Product** | `products` | `Product.js` | `productController.js` | `/api/menu`, `/api/admin/pending-menus` | PASS | PASS | PASS | N/A | Full | Yes | No | **PASS** | Visibility requires `isApproved=true` and `available=true`. |
| **Banner Carousel** | `banners` | `Banner.js` | `homeController.js` | `/api/banners` | PASS | PASS | N/A | N/A | Full | Yes | No | **PASS** | Banner list populated from DB via `GET /api/banners`. |
| **Home CMS Sections** | `homesections` | `HomeSection.js` | `homeCmsController.js` | `/api/cms/home-sections` | PASS | PASS | N/A | N/A | Full | Yes | No | **PASS** | Custom collection layout order configured via Admin CMS. |
| **Promo Coupons** | `coupons` | `Coupon.js` | `promocodeController.js` | `/api/coupons` | PASS | PASS | N/A | N/A | Full | Yes | No | **PASS** | Server-side validation of min order value ₹ and expiry. |
| **Customer Cart** | `carts` | `Cart.js` | `cartController.js` | `/api/cart` | N/A | PASS | N/A | N/A | Full | No | No | **PASS** | Cart items & pricing breakdown calculated on backend. |
| **Food Order** | `orders` | `Order.js` | `orderController.js` | `/api/orders` | PASS | PASS | PASS | PASS | Full | Yes | Yes | **PASS** | Order state machine (`pending` -> `accepted` -> `preparing` -> `picked_up` -> `delivered`) synced across all apps. |
| **Payment Ledger** | `paymenttransactions` | `PaymentTransaction.js` | `paymentController.js` | `/api/payment` | PASS | PASS | PASS | PASS | Full | Yes | No | **PASS** | Records COD, online, wallet, and payout transactions in INR. |
| **Customer Wallet** | `wallets` | `Wallet.js` | `walletController.js` | `/api/wallet` | PASS | PASS | PASS | PASS | Full | Yes | No | **PASS** | Direct credit/debit for refunds and order payments. |
| **Restaurant Wallet** | `restaurantwallets` | `RestaurantWallet.js` | `restaurantController.js` | `/api/restaurants/wallet` | PASS | N/A | PASS | N/A | Full | Yes | No | **PASS** | Tracks net revenue minus platform commissions. |
| **Rider Wallet** | `riderwallets` | `RiderWallet.js` | `riderController.js` | `/api/riders/wallet` | PASS | N/A | N/A | PASS | Full | Yes | No | **PASS** | Tracks base pay, distance bonus, surge earnings. |
| **Settlement Payout** | `settlements` | `Settlement.js` | `settlementController.js` | `/api/admin/settlements` | PASS | N/A | PASS | PASS | Full | Yes | No | **PASS** | Weekly settlement lifecycle (`CALCULATED` -> `PAID`). |
| **Reconciliation Report** | `reconciliationreports` | `ReconciliationReport.js` | `reconciliationController.js` | `/api/reconciliations` | PASS | N/A | N/A | N/A | Full | Yes | No | **PASS** | Webhook verification against order transaction ledger. |
| **Audit Log** | `auditlogs` | `AuditLog.js` | `auditLogController.js` | `/api/admin/audit-logs` | PASS | N/A | N/A | N/A | Read | N/A | No | **PASS** | Immutable security audit log for admin mutations. |
| **Food Quantity Sizing** | `foodquantities` | `FoodQuantity.js` | `foodQuantityController.js` | `/api/food-quantities` | PASS | PASS | PASS | N/A | Full | Yes | No | **PASS** | Variant sizing (Half, Full, Regular, Large) DB-driven. |
| **Smart Rule Engine** | `ruleengines` | `RuleEngine.js` | `ruleEngineController.js` | `/api/rules` | PASS | PASS | PASS | PASS | Full | Yes | No | **PASS** | Distance fee slabs & surge multiplier rules in DB. |
| **Rider Earning Config** | `riderearningconfigs` | `RiderEarningConfig.js` | `ruleEngineController.js` | `/api/rules/rider-earnings` | PASS | N/A | N/A | PASS | Full | Yes | No | **PASS** | Base pay ₹20, distance ₹15/km configured in DB. |
| **Emergency Controls** | `emergencycontrols` | `EmergencyControl.js` | `emergencyController.js` | `/api/emergency` | PASS | PASS | PASS | PASS | Full | Yes | Yes | **PASS** | Operational kill-switches stored & checked in DB. |
| **Feature Flags** | `featureflags` | `FeatureFlag.js` | `featureFlagController.js` | `/api/feature-flags` | PASS | PASS | PASS | PASS | Full | Yes | No | **PASS** | Dynamic feature rollout flags stored & checked in DB. |

---

## Public Visibility Enforcement Summary

To ensure public safety and business integrity, public customer endpoints (`/api/restaurants/list`, `/api/menu`, `/api/categories`) strictly enforce MongoDB query criteria:

```javascript
// Public Restaurant Query Eligibility (restaurantController.js)
const publicRestaurantQuery = {
  restaurantApproved: true,
  menuApproved: true,
  isActive: true,
  isTemporarilyClosed: false
};

// Public Product Query Eligibility (productController.js)
const publicProductQuery = {
  isApproved: true,
  available: true,
  restaurant: restaurantId
};
```

**Conclusion**: All 23 domain entities achieve 100% data reflection from MongoDB to consuming applications.
