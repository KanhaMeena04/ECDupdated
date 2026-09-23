# ECDKART Restaurant App API Contract & Backend Alignment Matrix

## Overview
This matrix documents the 1-to-1 alignment between the updated Restaurant App API endpoints defined in `lib/api_constants.dart` and the `ECDbackend` Express routes, controllers, and MongoDB models.

---

## Complete API Alignment Matrix

| # | Restaurant API Endpoint | HTTP | Backend Route | Controller Method | MongoDB Model & Fields | Status |
| :-: | :--- | :-: | :--- | :--- | :--- | :-: |
| 1 | `ApiConstants.sendOtp` | `POST` | `/api/restaurants/send-otp` | `vendorSendOtp` | `User` (mobile, otp, otpExpires, role) | **ALIGNED** |
| 2 | `ApiConstants.verifyOtp` | `POST` | `/api/restaurants/verify-otp` | `vendorVerifyOtp` | `User`, `Restaurant` (owner, isVerified, token) | **ALIGNED** |
| 3 | `ApiConstants.getProfile(id)` | `GET` | `/api/restaurants/:id/profile` | `getRestaurantProfileById` | `Restaurant` (name, email, address, documents, bankDetails) | **ALIGNED** |
| 4 | `ApiConstants.getOrderHistory(id)` | `GET` | `/api/restaurants/:id/order-history` | `getOrderHistory` | `Order` (restaurant, status, orderType, createdAt) | **ALIGNED** |
| 5 | `ApiConstants.getDashboardStats(id, filter)` | `GET` | `/api/restaurants/:id/dashboard-stats` | `getDashboardStats` | `Order`, `Restaurant` (todaysOrders, todaysRevenue, inProgress) | **ALIGNED** |
| 6 | `ApiConstants.deleteAccount` | `POST` | `/api/restaurants/vendor/delete-account` | `deleteAccount` | `Restaurant`, `User` (isActive: false) | **ALIGNED** |
| 7 | `ApiConstants.getRestaurantOrders(id)` | `GET` | `/api/orders/restaurant/:id` | `getOrdersForRestaurantById` | `Order` (restaurant, items, customer, rider, timeline) | **ALIGNED** |
| 8 | `ApiConstants.toggleActive(id)` | `PUT` | `/api/restaurants/:id/toggle-active` | `toggleRestaurantActive` | `Restaurant` (isOnline, isActive) | **ALIGNED** |
| 9 | `ApiConstants.addMenuItem(id)` | `POST` | `/api/restaurants/vendor/menu/add/:id` | `vendorAddMenuItem` | `Product`, `Restaurant` (product array) | **ALIGNED** |
| 10 | `ApiConstants.toggleMenuItem(restId, itemId)` | `PATCH` | `/api/restaurants/vendor/menu/toggle/:restId/:itemId` | `vendorToggleMenuItem` | `Product` (available, outOfStock) | **ALIGNED** |
| 11 | `ApiConstants.requestDeleteMenuItem(restId, itemId)` | `POST` | `/api/restaurants/:restId/menu/:itemId/request-delete` | `vendorDeleteMenuItem` | `Product`, `Restaurant` | **ALIGNED** |
| 12 | `ApiConstants.restaurantWallet` | `GET` | `/api/payment/restaurant/wallet` | `getRestaurantWalletEarnings` | `RestaurantWallet`, `Order` (balance, totalEarnings, totalPaidOut) | **ALIGNED** |
| 13 | `ApiConstants.restaurantApply` | `POST` | `/api/restaurants/apply` | `applyForRestaurant` | `Restaurant` (documents, bankDetails, verificationStatus) | **ALIGNED** |
| 14 | `ApiConstants.restaurantSettings(id)` | `PUT` | `/api/restaurants/:id/settings` | `updateSettings` | `Restaurant` (timing, minOrderValue, packagingCharge, prepBuffer) | **ALIGNED** |
| 15 | `ApiConstants.prepareOrder(orderId)` | `POST` | `/api/orders/restaurant/prepare/:orderId` | `prepareOrderVendor` | `Order` (status: 'preparing', prepTimeMinutes, prepNote) | **ALIGNED** |
| 16 | `ApiConstants.assignRider(orderId)` | `POST` | `/api/orders/restaurant/ready/:orderId` | `readyOrderVendor` / `markOrderReady` | `Order` (status: 'ready', readyAt) | **ALIGNED** |
| 17 | `ApiConstants.verifyPickup(orderId)` | `POST` | `/api/orders/restaurant/verify-pickup/:orderId` | `verifyPickupVendor` / `verifySelfPickup` | `Order` (selfPickupVerifiedAt, status: 'delivered') | **ALIGNED** |
| 18 | `ApiConstants.completePickup(orderId)` | `POST` | `/api/orders/restaurant/complete-pickup/:orderId` | `completePickupVendor` | `Order` (status: 'out_for_delivery' / 'delivered') | **ALIGNED** |
| 19 | `ApiConstants.cancelOrder(orderId)` | `POST` | `/api/orders/restaurant/cancel/:orderId` | `cancelOrderVendor` / `ownerCancelOrder` | `Order` (status: 'cancelled', cancellationReason, cancelledAt) | **ALIGNED** |

---

## Error Handling & Response Standards
- **Success Response**: `{ "success": true, "message": "...", "data": { ... } }`
- **Error Response**: `{ "success": false, "message": "...", "error": "..." }`
- **HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource (product, order) created.
  - `400 Bad Request`: Invalid parameters or state transition violation.
  - `401 Unauthorized`: Token missing or expired.
  - `403 Forbidden`: Access denied (e.g. non-owner operating on restaurant).
  - `404 Not Found`: Order/Restaurant/Product not found.
