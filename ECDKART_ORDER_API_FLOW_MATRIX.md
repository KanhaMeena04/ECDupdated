# ECDKART Order API & Workflow Execution Matrix

> [!NOTE]
> This matrix documents the complete step-by-step API endpoint contracts, HTTP methods, authorization headers, WebSockets events, database models, and consuming applications for the **ECDKART Order Operations Workflow**.

---

## Complete Order Workflow API Matrix

| Step # | Workflow Phase | API Endpoint Route | HTTP Method | Auth Required | Request Payload Summary | MongoDB Collections Mutated | WebSockets / Real-Time Event | Consuming App | Status |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | Restaurant Discovery | `/api/restaurants/list` | GET | Optional | `lat`, `lng`, `radiusKm` | `restaurants` | N/A | User App | **PASS** |
| **2** | Menu & Product Query | `/api/menu/:restaurantId` | GET | Optional | `restaurantId` | `products`, `categories` | N/A | User App | **PASS** |
| **3** | Cart Pricing Calculation | `/api/cart` | POST | Bearer User | `items`, `couponCode`, `distance` | `carts` | N/A | User App | **PASS** |
| **4** | Promo Coupon Apply | `/api/coupons/apply` | POST | Bearer User | `couponCode`, `itemTotal` | `coupons` | N/A | User App | **PASS** |
| **5** | Order Creation & Placement | `/api/orders` | POST | Bearer User | `items`, `address`, `paymentMethod` | `orders`, `paymenttransactions` | `new_order` | User -> Restaurant | **PASS** |
| **6** | Restaurant Order View | `/api/orders/my-orders` | GET | Bearer Owner | `status=pending` | `orders` | N/A | Restaurant App | **PASS** |
| **7** | Restaurant Order Accept | `/api/orders/:id/status` | PUT | Bearer Owner | `status: "accepted"` | `orders` | `order_accepted` | Restaurant App | **PASS** |
| **8** | Order Preparation Start | `/api/orders/:id/status` | PUT | Bearer Owner | `status: "preparing"`, `prepTime` | `orders` | `order_preparing` | Restaurant App | **PASS** |
| **9** | Order Mark Ready | `/api/orders/:id/status` | PUT | Bearer Owner | `status: "ready"` | `orders` | `order_ready` | Restaurant App | **PASS** |
| **10** | Rider Auto-Dispatch | `/api/orders/:id/dispatch` | POST | Bearer Admin/Auto | `orderId` | `orders`, `riders` | `rider_request` | Rider App | **PASS** |
| **11** | Rider Request Accept | `/api/orders/:id/accept` | POST | Bearer Rider | `riderId` | `orders`, `riders` | `rider_accepted` | Rider App | **PASS** |
| **12** | Rider Arrival at Outlet | `/api/orders/:id/status` | PUT | Bearer Rider | `status: "arrived_at_restaurant"`| `orders` | `rider_arrived` | Rider App | **PASS** |
| **13** | Rider Order Pickup | `/api/orders/:id/status` | PUT | Bearer Rider | `status: "picked_up"` | `orders` | `order_picked_up` | Rider App | **PASS** |
| **14** | Socket GPS Location Stream | `/socket.io` | WebSocket | Socket Token | `lat`, `lng`, `speed`, `heading` | N/A | `rider_location` | User App & Admin | **PASS** |
| **15** | Delivery Confirmation OTP | `/api/orders/:id/status` | PUT | Bearer Rider | `status: "delivered"`, `otp` | `orders`, `riderwallets` | `order_delivered` | All Apps & Admin | **PASS** |
| **16** | Self Pickup Order Placement | `/api/orders` | POST | Bearer User | `orderType: "self_pickup"` | `orders` | `new_pickup_order` | User -> Restaurant | **PASS** |
| **17** | Self Pickup Store Handover | `/api/orders/:id/status` | PUT | Bearer Owner | `status: "completed"`, `otp` | `orders`, `restaurantwallets` | `pickup_completed` | User & Restaurant | **PASS** |
| **18** | Customer Refund Request | `/api/orders/:id/refund` | POST | Bearer User/Admin | `reason`, `amount` | `orders`, `wallets`, `auditlogs`| N/A | Customer & Admin | **PASS** |
| **19** | Weekly Settlement Run | `/api/admin/settlements` | POST | Bearer Admin | `startDate`, `endDate` | `settlements`, `paymenttransactions`| N/A | ECDadmin Tower | **PASS** |
| **20** | Payment Reconciliation Run | `/api/reconciliations/run` | POST | Bearer Admin | `dateRange` | `reconciliationreports` | N/A | ECDadmin Tower | **PASS** |

---

## Technical Contract Rules

1. **Strict Content-Type**: All REST endpoints expect `Content-Type: application/json` and return JSON response bodies.
2. **Authorization Header**: Secured endpoints require `Authorization: Bearer <JWT_TOKEN>`.
3. **Database Mutation Guarantee**: State updates write to MongoDB before broadcasting WebSockets notifications.
4. **INR Currency Standardization**: All monetary values (`itemTotal`, `deliveryFee`, `tax`, `totalAmount`) are calculated and returned in numeric Indian Rupees (`₹`).
