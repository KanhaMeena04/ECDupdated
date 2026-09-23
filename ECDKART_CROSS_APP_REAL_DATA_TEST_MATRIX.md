# ECDKART Cross-App Real Data Test Matrix

## Overview
This matrix summarizes the end-to-end data propagation and state reflection across all 5 applications in the ECDKART ecosystem based on actual execution of the 20 master integration tests.

---

## Master Cross-App Reflection Matrix

| # | Test Name | Admin | MongoDB | Backend API | User App | Restaurant App | Rider App | Status | Evidence |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: | :--- |
| **1** | **Restaurant Created** | Appears in store table | `Restaurant` doc created | `POST /api/restaurants/admin/create` | Listed in store directory | Store owner linked | N/A | **PASS** | `6aae42963b423ff621eea1ef` |
| **2** | **Restaurant Online/Offline** | Toggle state updated | `isOnline` updated | `PUT /api/restaurants/:id/toggle-active` | Order placement blocked when OFF | Toggle pill updated | N/A | **PASS** | Toggled `false` → `true` |
| **3** | **Product Created** | Listed in menu approval | `Product` doc created | `POST /api/restaurants/vendor/menu/add/:id` | Pending approval | Added in vendor menu | N/A | **PASS** | `6aae42963b423ff621eea1f3` |
| **4** | **Product Availability Toggle** | Status updated | `available` updated | `PATCH /api/restaurants/vendor/menu/toggle` | Item hidden/shown | Toggle updated | N/A | **PASS** | Toggled `false` → `true` |
| **5** | **Admin Price Override** | Override set | `adminPriceOverride` | `PUT /api/products/admin/:id/override` | Displays ₹199 price | Base price preserved | N/A | **PASS** | Effective price ₹199 |
| **6** | **Product Out-of-Stock** | OOS badge | `outOfStock: true` | `PATCH /api/products/:id/oos` | Item marked OOS | Item marked OOS | N/A | **PASS** | OOS state persisted |
| **7** | **Category Created** | Category listed | `Category` doc | `POST /api/categories` | Shows in category bar | Selectable in menu | N/A | **PASS** | `6aae42963b423ff621eea1f1` |
| **8** | **Home CMS Banner** | Banners set | `HomeScreenSection` | `GET /api/cms/landing` | Renders banners | N/A | N/A | **PASS** | CMS API responsive |
| **9** | **Restaurant Active Toggle** | Status Active | `isActive: true` | `PUT /api/restaurants/:id/toggle-active` | Store open for orders | Dashboard active | Dispatch eligible | **PASS** | Active & online |
| **10**| **Self Pickup Verification** | Order completed | `status: 'delivered'` | `POST /api/orders/restaurant/verify-self-pickup` | Self pickup completed | OTP verified | Ignored by Rider pool | **PASS** | Order `6aae42963b423ff621eea1f5` |
| **11**| **Delivery Order Flow** | Monitored | `status: 'ready'` | `POST /api/orders/restaurant/ready/:id` | Ready for pickup | Ready state set | Dispatch notified | **PASS** | Order `#eea1f8` READY |
| **12**| **Rider Delivery Flow** | Delivered | `status: 'delivered'` | `POST /api/rider/orders/verify-delivery` | Shows Delivered | Order completed | Earnings updated | **PASS** | Delivery completed |
| **13**| **Rider Status Update** | Rider pool | `isAvailable` | `PUT /api/rider/status` | N/A | N/A | Online/offline toggle | **PASS** | Filter operational |
| **14**| **User Profile Update** | Profile updated | `User` doc updated | `PUT /api/user/profile` | Name updated | N/A | N/A | **PASS** | User profile saved |
| **15**| **Cart Calculations** | Totals verified | `Cart` schema | `POST /api/cart/add` | Server price calculated | N/A | N/A | **PASS** | Server pricing enforced |
| **16**| **Pricing Configuration** | Fees set | Snapshot fee | `GET /api/orders/:id` | Item + delivery fee | Item total | Rider share | **PASS** | Snapshot pricing |
| **17**| **Coupon Redemption** | Promo logged | Discount deducted | `POST /api/promocode/apply` | Discount applied | N/A | N/A | **PASS** | Discount verified |
| **18**| **COD Payment Transition** | Payment logged | `paymentStatus: 'paid'` | `POST /api/payment/cod/confirm` | Payment confirmed | COD logged | Cash logged | **PASS** | Status `paid` |
| **19**| **Wallet Ledger** | Ledger updated | `balance: ₹438` | `GET /api/payment/restaurant/wallet` | N/A | Balance ₹438 | Rider ledger | **PASS** | Balance ₹438 |
| **20**| **Admin Audit Logging** | Audit recorded | `AuditLog` doc | `POST /api/admin/audit` | N/A | N/A | N/A | **PASS** | `6aae42963b423ff621eea1fd` |
