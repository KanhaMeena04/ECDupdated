# ECDKART CROSS-APP CONNECTIVITY MATRIX

## Ecosystem Data Flow Diagram

```
                              +--------------------+
                              |  MongoDB Database  |
                              +---------+----------+
                                        ^
                                        | (Mongoose ODM)
                                        v
                              +--------------------+
                              |     ECDbackend     |
                              |   (Port 5000 REST) |
                              +----+----+----+-----+
                                   |    |    |
        +--------------------------+    |    +--------------------------+
        |                               |                               |
        v                               v                               v
+---------------+               +---------------+               +---------------+
|   ECDadmin    |               |   User App    |               |Restaurant App |
| (React/Vite)  |               |   (Flutter)   |               |   (Flutter)   |
+---------------+               +---------------+               +---------------+
                                        |                               |
                                        +---------------+---------------+
                                                        |
                                                        v
                                                +---------------+
                                                |   Rider App   |
                                                |   (Flutter)   |
                                                +---------------+
```

---

## Cross-App Connectivity Matrix by Domain

| Feature Domain | Triggering App / Event | Backend API Call | Central MongoDB Collection | Cross-App Realtime Update | Target App Reflection |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Restaurant Onboarding** | Admin (`ECDadmin`) | `POST /api/restaurants/admin/create` | `restaurants`, `users` | Socket.IO event `restaurant_created` | User App (visible if approved & serviceable) |
| **Restaurant App Signup** | Restaurant (`Restaurant`) | `POST /api/restaurants/apply` | `restaurants`, `users` | Socket.IO event `new_restaurant_application` | Admin (`ApproveRestuarant.jsx` pending list) |
| **Admin Restaurant Approval** | Admin (`ECDadmin`) | `PATCH /api/admin/restaurants/:id/status` | `restaurants` | Socket.IO event `restaurant_status_updated` | User App (shows in feed), Restaurant App |
| **Price Override** | Admin (`ECDadmin`) | `PUT /api/admin/products/:id/price-override` | `products` | API dynamic response formatting | User App receives effective price; Restaurant App sees base price |
| **Menu Availability** | Restaurant (`Restaurant`) | `PUT /api/restaurant-app/menu/item` | `products` | Socket.IO event `menu_updated` | User App menu updates instantly |
| **Rider Onboarding / KYC** | Rider (`Rider`) | `POST /api/riders/register` | `riders`, `users` | Socket.IO event `new_rider_registered` | Admin Document Management & Rider Management |
| **Admin Rider Verification** | Admin (`ECDadmin`) | `PATCH /api/admin/riders/:id/verify` | `riders` | Push Notification & Socket.IO event | Rider App becomes eligible for dispatch |
| **Order Placement** | User (`User`) | `POST /api/orders/create` | `orders`, `carts` | Socket.IO event `new_order_placed` | Restaurant App gets order alert; Admin gets live order stats |
| **Order Acceptance** | Restaurant (`Restaurant`) | `PATCH /api/restaurant-app/orders/:id/status` | `orders` | Socket.IO event `order_status_changed` | User App status updates to "Preparing"; Rider Auto-assignment triggers |
| **Rider Auto Dispatch** | ECDbackend Cron / Engine | Internal Assignment Algorithm | `orders`, `riders` | Socket.IO event `order_assigned` | Rider App gets order dispatch modal |
| **Order Picked Up** | Rider (`Rider`) | `PATCH /api/rider-app/orders/:id/status` | `orders` | Socket.IO event `order_status_changed` | User App live tracking updates to "Out for Delivery" |
| **Order Delivered** | Rider (`Rider`) | `PATCH /api/rider-app/orders/:id/status` | `orders`, `settlements` | Socket.IO event `order_delivered` | User App order complete; Settlement & Rider earnings generated |
| **Home CMS Update** | Admin (`ECDadmin`) | `POST /api/home/sections` | `homescreensections` | Dynamic API response | User App Home Screen layout reorders automatically |
