# ECDKART Restaurant & Rider API Compatibility Matrix

## 1. Restaurant API Endpoint Mapping

| App Module | Action / Feature | Backend Route | Method | Request Payload | Response Contract | Status |
|---|---|---|---|---|---|---|
| Restaurant Auth | Send OTP | `/api/restaurants/send-otp` | POST | `{ phone: String }` | `{ success: true, message: String }` | Verified (200 OK) |
| Restaurant Auth | Verify OTP | `/api/restaurants/verify-otp` | POST | `{ phone: String, otp: String }` | `{ success: true, token: String, restaurant: Object }` | Verified (200 OK) |
| Restaurant Profile | Fetch Profile | `/api/restaurants/:id/profile` | GET | Headers: Authorization | `{ success: true, data: Object }` | Verified (200 OK) |
| Restaurant Dashboard | Fetch Stats | `/api/restaurants/:id/dashboard-stats` | GET | `?filter=today` | `{ success: true, stats: Object }` | Verified (200 OK) |
| Restaurant Menu | Category Tree | `/api/categories/tree` | GET | None | `{ success: true, count: 34, data: Array }` | Verified (200 OK) |
| Restaurant Menu | Add Food Item | `/api/menu/food-item` | POST | `{ categoryId, subcategoryId, name, b2cMrp, b2cSellingPrice, b2bPrice, foodType, addOns }` | `{ success: true, product: Object, status: "pending" }` | Verified (201 Created) |
| Restaurant Menu | Fetch Menu | `/api/menu/:restaurantId` | GET | None | `{ success: true, count: Number, items: Array }` | Verified (200 OK) |
| Restaurant Wallet | Wallet Info | `/api/payment/restaurant/wallet` | GET | Headers: Authorization | `{ success: true, wallet: Object }` | Verified (200 OK) |
| Restaurant Orders | List Orders | `/api/orders/restaurant/:id` | GET | None | `{ success: true, orders: Array }` | Verified (200 OK) |

## 2. Rider API Endpoint Mapping

| App Module | Action / Feature | Backend Route | Method | Request Payload | Response Contract | Status |
|---|---|---|---|---|---|---|
| Rider Auth | Login / OTP | `/api/rider/login` | POST | `{ phone: String }` | `{ success: true, token: String, rider: Object }` | Verified (200 OK) |
| Rider Profile | Fetch Rider Info | `/api/rider/profile` | GET | Headers: Authorization | `{ success: true, data: Object }` | Verified (200 OK) |
| Rider Duty | Toggle Status | `/api/rider/toggle-status` | POST | `{ isOnline: Boolean }` | `{ success: true, status: String }` | Verified (200 OK) |
| Rider Orders | Active Orders | `/api/rider/orders/assigned` | GET | Headers: Authorization | `{ success: true, orders: Array }` | Verified (200 OK) |
| Rider Wallet | Wallet Balance | `/api/rider/wallet` | GET | Headers: Authorization | `{ success: true, wallet: Object }` | Verified (200 OK) |
| Rider COD | Collect COD | `/api/rider/cod/collect` | POST | `{ orderId: String, amount: Number }` | `{ success: true, transaction: Object }` | Verified (200 OK) |

## 3. Environment Base URL Configuration
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **Web & Desktop Local**: `http://127.0.0.1:5000/api`
- **Physical Device**: `http://<LAN_IP>:5000/api`
