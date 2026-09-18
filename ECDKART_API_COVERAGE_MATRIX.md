# ECDKART Database → Backend → Admin / Mobile Apps API Coverage Matrix

> [!NOTE]
> This API Coverage Matrix documents the single-source-of-truth data flow from **MongoDB collections** through **ECDbackend models, controllers, and routes** to **ECDadmin**, **User App**, **Restaurant App**, and **Rider App**.

---

## Complete Data Integrity & API Mapping

| # | MongoDB Collection | Backend Model | Controller File | Primary API Route | HTTP Method | Admin Tower | User App | Restaurant App | Rider App | Socket.IO | Audit Log | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | `users` | `User.js` | `userController.js`, `authController.js` | `/api/user`, `/api/auth` | GET, POST, PUT | PASS | PASS | PASS | PASS | No | Yes | **COMPLETE** |
| **2** | `restaurants` | `Restaurant.js` | `restaurantController.js` | `/api/restaurants`, `/api/admin/restaurants` | GET, POST, PUT | PASS | PASS | PASS | N/A | Yes | Yes | **COMPLETE** |
| **3** | `riders` | `Rider.js` | `riderController.js` | `/api/riders`, `/api/admin/riders` | GET, POST, PUT | PASS | N/A | N/A | PASS | Yes | Yes | **COMPLETE** |
| **4** | `orders` | `Order.js` | `orderController.js` | `/api/orders` | GET, POST, PUT | PASS | PASS | PASS | PASS | Yes | Yes | **COMPLETE** |
| **5** | `products` | `Product.js` | `productController.js` | `/api/menu`, `/api/admin/pending-menus` | GET, POST, PUT | PASS | PASS | PASS | N/A | No | Yes | **COMPLETE** |
| **6** | `categories` | `Category.js` | `homeController.js`, `catalogCmsController.js` | `/api/categories`, `/api/cms/catalog` | GET, POST, PUT | PASS | PASS | N/A | N/A | No | Yes | **COMPLETE** |
| **7** | `cuisines` | `Cuisine.js` | `homeController.js` | `/api/categories` | GET | PASS | PASS | N/A | N/A | No | No | **COMPLETE** |
| **8** | `banners` | `Banner.js` | `homeController.js`, `homeCmsController.js` | `/api/banners`, `/api/cms/home-sections` | GET, POST, PUT | PASS | PASS | N/A | N/A | No | Yes | **COMPLETE** |
| **9** | `homesections` | `HomeSection.js` | `homeCmsController.js` | `/api/cms/home-sections` | GET, POST, PUT | PASS | PASS | N/A | N/A | No | Yes | **COMPLETE** |
| **10** | `ruleengines` | `RuleEngine.js` | `ruleEngineController.js` | `/api/rules` | GET, POST, PUT | PASS | PASS | PASS | PASS | No | Yes | **COMPLETE** |
| **11** | `riderearningconfigs` | `RiderEarningConfig.js` | `ruleEngineController.js` | `/api/rules/rider-earnings` | GET, POST, PUT | PASS | N/A | N/A | PASS | No | Yes | **COMPLETE** |
| **12** | `emergencycontrols` | `EmergencyControl.js` | `emergencyController.js` | `/api/emergency` | GET, POST, PUT | PASS | PASS | PASS | PASS | Yes | Yes | **COMPLETE** |
| **13** | `featureflags` | `FeatureFlag.js` | `featureFlagController.js` | `/api/feature-flags` | GET, POST, PUT | PASS | PASS | PASS | PASS | No | Yes | **COMPLETE** |
| **14** | `scheduledchanges` | `ScheduledChange.js` | `scheduledChangeController.js` | `/api/scheduled-changes` | GET, POST, DELETE | PASS | N/A | N/A | N/A | No | Yes | **COMPLETE** |
| **15** | `serviceareas` | `ServiceArea.js` | `serviceAreaController.js` | `/api/service-areas` | GET, POST, PUT | PASS | PASS | N/A | PASS | No | Yes | **COMPLETE** |
| **16** | `reconciliationreports` | `ReconciliationReport.js` | `reconciliationController.js` | `/api/reconciliations` | GET, POST | PASS | N/A | N/A | N/A | No | Yes | **COMPLETE** |
| **17** | `coupons` | `Coupon.js` | `promocodeController.js` | `/api/coupons`, `/api/admin/promocode` | GET, POST, PUT | PASS | PASS | N/A | N/A | No | Yes | **COMPLETE** |
| **18** | `carts` | `Cart.js` | `cartController.js` | `/api/cart` | GET, POST, PUT | N/A | PASS | N/A | N/A | No | No | **COMPLETE** |
| **19** | `wallets` | `Wallet.js` | `walletController.js` | `/api/wallet` | GET, POST | PASS | PASS | PASS | PASS | No | Yes | **COMPLETE** |
| **20** | `paymenttransactions` | `PaymentTransaction.js` | `paymentController.js` | `/api/payment` | GET, POST | PASS | PASS | PASS | PASS | No | Yes | **COMPLETE** |
| **21** | `settlements` | `Settlement.js` | `settlementController.js` | `/api/admin/settlements` | GET, POST, PUT | PASS | N/A | PASS | PASS | No | Yes | **COMPLETE** |
| **22** | `auditlogs` | `AuditLog.js` | `auditLogController.js` | `/api/admin/audit-logs` | GET | PASS | N/A | N/A | N/A | No | N/A | **COMPLETE** |
| **23** | `foodquantities` | `FoodQuantity.js` | `foodQuantityController.js` | `/api/food-quantities` | GET, POST, PUT | PASS | PASS | PASS | N/A | No | Yes | **COMPLETE** |

---

## Data Architecture Verification Rules

1. **MongoDB Single Source of Truth**: All operational state changes pass through `ECDbackend` and mutate MongoDB documents.
2. **Server-Side Rules Engine**: Pricing calculations (item total, GST tax, packaging fee, distance delivery fee, surge charge, tip) are computed by `ECDbackend` controllers during cart checkout.
3. **Audit Trails**: Every admin mutation (price override, status toggle, emergency switch, payout release) generates an immutable log entry in `auditlogs`.
4. **INR Currency Standardization**: All monetary fields across models default to `currency: "INR"` with numeric values in Indian Rupees (`₹`).
