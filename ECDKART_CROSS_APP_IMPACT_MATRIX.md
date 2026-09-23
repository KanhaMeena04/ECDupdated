# ECDKART 4-Way Cross-App State Reflection Matrix

## Overview
This document defines the 4-way real-time state reflection model across `User App`, `Restaurant App`, `Rider App`, `ECDAdmin`, `ECDbackend`, and `MongoDB`.

---

## 4-Way Reflection Matrix

| Event Trigger | Originating App | MongoDB State Update | User App Reflection | Restaurant App Reflection | Rider App Reflection | Admin Dashboard Reflection |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vendor Toggles Online/Offline** | Restaurant | `Restaurant.isOnline = true/false` | Restaurant card updates status; if offline, order placement is blocked. | Toggle pill reflects Online/Offline; incoming order stream opens/closes. | No dispatch requests sent for offline stores. | Status updates to "Accepting Orders" / "Offline". |
| **Vendor Adds / Edits Product** | Restaurant | `Product.create()`, `isApproved = true` | Product appears in restaurant menu under category once approved. | Item appears in Menu Management screen with toggle switch. | N/A | Product appears in `EditRestaurantMenuAdmin.jsx` for review. |
| **Customer Places Delivery Order** | User | `Order.create()`, `status = 'placed'` | Order placed screen displayed; live timeline initialized. | Order chime sounds; incoming order card appears in Dashboard queue. | N/A (Awaits acceptance/ready). | Order appears in `OrderDashboard.jsx` under New Orders. |
| **Customer Places Self-Pickup Order** | User | `Order.create()`, `orderType = 'self_pickup'` | Shows Pickup OTP Code (`4892`) and store address. | Order appears in `Self Pickup` queue with Pickup PIN badge. | **Filtered OUT** (Rider app receives 0 notifications). | Order tagged as `Self-Pickup` in `PickUpOrders.jsx`. |
| **Vendor Accepts & Sets Prep Time** | Restaurant | `Order.status = 'preparing'`, `prepTimeMinutes` | Customer sees "Chef is preparing your food" with updated ETA. | Card moves to "Preparing" section with countdown timer. | Rider notified "Food being prepared". | Status updates to `Preparing` in live order monitor. |
| **Vendor Marks Order Ready (Delivery)** | Restaurant | `Order.status = 'ready'`, `readyAt` | Customer sees "Order is Ready - Assigning Rider". | Order moves to "Ready" section. | Dispatch engine triggers notification to nearby riders. | Order status updates to `Ready`. |
| **Vendor Marks Order Ready (Pickup)** | Restaurant | `Order.status = 'ready_for_pickup'` | Customer receives notification: "Order Ready for Pickup at store!". | Order moves to "Ready for Pickup" status. | N/A | Order status updates to `Ready for Pickup`. |
| **Self-Pickup Code Verification** | Restaurant | `Order.status = 'delivered'`, `selfPickupVerifiedAt` | Customer sees "Order Completed. Thank you!". | Order completed; moved to order history. | N/A | Marked `Completed`; funds credited to `RestaurantWallet`. |
| **Vendor Rejects Order** | Restaurant | `Order.status = 'cancelled'`, `cancellationReason` | Customer sees "Order Rejected by Restaurant" with reason & refund note. | Moved to Cancelled Orders screen with reason log. | Any pending request cleared. | Logged under Cancelled Orders; refund request logged. |

---

## Technical Real-Time Synchronisation Mechanism
1. **REST APIs**: Core source of truth operations execute over authenticated HTTP REST APIs to `ECDbackend`.
2. **Socket.IO Events**: Real-time state synchronization is broadcasted via room emitters:
   - `socketService.emitToCustomer(customerId, 'order:status', payload)`
   - `socketService.emitToRestaurant(restaurantId, 'order:status', payload)`
   - `socketService.emitToRider(riderUserId, 'order:status', payload)`
   - `socketService.emitToAdmin('order:status', payload)`
3. **Database Consistency**: MongoDB acts as single source of truth; all socket payloads derive from persisted MongoDB document states.
