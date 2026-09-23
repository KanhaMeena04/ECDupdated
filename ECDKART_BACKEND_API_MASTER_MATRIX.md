# ECDKART BACKEND API MASTER MATRIX

## Overview
This document indexes all active REST API routes, HTTP methods, authorization levels, request parameters, response structures, and controller handlers mounted in **ECDbackend** (Node.js/Express).

---

## Master API Endpoint Inventory

### 1. Authentication & Users (`/api/auth`, `/api/users`)
- `POST /api/auth/register` — User/Rider/Restaurant registration (`authController.register`)
- `POST /api/auth/login` — Universal login (`authController.login`)
- `GET /api/auth/me` — Current user profile (`authController.getMe`, Protected)
- `PUT /api/auth/profile` — Update profile details (`authController.updateProfile`, Protected)
- `POST /api/auth/refresh-token` — Issue new JWT token (`authController.refreshToken`)

### 2. Admin Control Tower (`/api/admin`)
- `GET /api/admin/dashboard` — Platform overview & metrics (`dashboardController.getDashboardStats`, Admin)
- `GET /api/admin/master-category` — Fetch all master categories with Category model fallback (`adminContentController.getAllMasterCategories`, Admin)
- `POST /api/admin/master-category` — Create master category (`adminContentController.addMasterCategory`, Admin)
- `PUT /api/admin/master-category/:id` — Update category (`adminContentController.updateMasterCategory`, Admin)
- `DELETE /api/admin/master-category/:id` — Delete category (`adminContentController.deleteMasterCategory`, Admin)
- `GET /api/admin/categories` — Catalog categories (`homeController.getCategories`)
- `GET /api/admin/restaurants` — List all restaurants (`restaurantController.getAdminRestaurants`, Admin)
- `POST /api/restaurants/admin/create` — Admin register new restaurant (`restaurantController.adminCreateRestaurant`, Admin)
- `PATCH /api/admin/restaurants/:id/approve` — Approve pending restaurant (`restaurantController.updateRestaurantStatus`, Admin)
- `GET /api/admin/riders` — List all riders & KYC status (`riderController.getAdminRiders`, Admin)
- `PATCH /api/admin/riders/:id/verify` — Verify rider documents/KYC (`riderController.verifyRiderDocs`, Admin)
- `GET /api/admin/promocodes` — Fetch all promocodes (`promocodeController.getAllPromocodes`, Admin)
- `POST /api/admin/promocodes` — Add promocode (`promocodeController.addPromocode`, Admin)
- `GET /api/admin/settings` — Get master settings (`adminSettingsController.getAdminSettings`, Admin)
- `PUT /api/admin/settings` — Update master settings (`adminSettingsController.updateAdminSettings`, Admin)

### 3. Public User & Home Screen (`/api/home`, `/api/categories`, `/api/banners`, `/api/restaurants`)
- `GET /api/categories` — Public food categories (`homeController.getCategories`)
- `GET /api/banners` — Active marketing banners (`homeController.getBanners`)
- `GET /api/popular-dishes` — Popular menu dishes (`homeController.getPopularDishes`)
- `GET /api/home/sections` — CMS layout section configuration (`homeController.getHomeSections`)
- `GET /api/home/recommended` — Geofenced recommended restaurants (`homeController.getRecommendedRestaurants`)
- `GET /api/restaurants/list` — List serviceable restaurants (`restaurantController.getRestaurants`)
- `GET /api/restaurants/:id` — Restaurant details & menu with price overrides (`restaurantController.getRestaurantById`)
- `GET /api/restaurants/details/:id` — Canonical alias route (`restaurantController.getRestaurantById`)

### 4. Orders, Cart & Checkout (`/api/orders`, `/api/cart`)
- `POST /api/cart/add` — Add product to cart (`cartController.addToCart`, Protected)
- `GET /api/cart` — View user active cart (`cartController.getCart`, Protected)
- `POST /api/orders/create` — Create order (`orderController.createOrder`, Protected)
- `GET /api/orders/my-orders` — User order history (`orderController.getUserOrders`, Protected)
- `GET /api/orders/:id` — Single order details (`orderController.getOrderById`, Protected)

### 5. Restaurant App (`/api/restaurant-app`)
- `POST /api/restaurants/apply` — Restaurant partner application (`restaurantController.applyRestaurant`)
- `GET /api/restaurant-app/orders` — Incoming live orders (`restaurantController.getRestaurantOrders`, Protected)
- `PATCH /api/restaurant-app/orders/:id/status` — Accept/Prepare/Ready order (`restaurantController.updateOrderStatus`, Protected)
- `PUT /api/restaurant-app/menu/item` — Update item price & availability (`restaurantController.updateMenuItem`, Protected)

### 6. Rider App (`/api/rider-app`)
- `POST /api/riders/register` — Rider registration & document upload (`riderController.registerRider`)
- `GET /api/rider-app/available-orders` — Broadcasted available orders (`riderController.getAvailableOrders`, Protected)
- `POST /api/rider-app/accept-order` — Accept order dispatch (`riderController.acceptOrder`, Protected)
- `PATCH /api/rider-app/location` — Update live GPS coordinates (`riderController.updateLocation`, Protected)
- `PATCH /api/rider-app/orders/:id/status` — Picked up / Delivered status (`riderController.updateDeliveryStatus`, Protected)
