# ECDKART Updated Restaurant App UX, Features & Architecture Analysis

## Executive Summary
This document provides the complete audit of the updated Restaurant App baseline (`remotes/origin/Resturant-app-updated`). The updated application introduces modern Flutter UI screens, enriched operational controls, real-time status management, self-pickup handling, preparation buffer time setting, cancellation tracking with custom reasons, and wallet ledger management.

---

## 1. Screen & Navigation Inventory

| Screen Name | File Path | Primary Function | State & Services |
| :--- | :--- | :--- | :--- |
| **Login Screen** | `lib/screens/login_screen.dart` | Phone & OTP Vendor Login, Multi-step Restaurant Registration & KYC Submission | AuthMode State Machine, `ApiConstants.sendOtp`, `ApiConstants.verifyOtp` |
| **Main Dashboard** | `lib/screens/dashboard_screen.dart` | Live Order Queue Stream, Preparation Time Timer, Sound Alerts, Order Type Filter (Delivery vs Self Pickup) | Order Stream State, `AudioPlayer`, `ApiConstants.getRestaurantOrders` |
| **Restaurant Dashboard** | `lib/screens/restaurant_dashboard_screen.dart` | Modern Overview Metrics, Quick Action Shortcuts, Live Revenue & Active Order Counters | Stats State, `ApiConstants.getDashboardStats` |
| **Order Details Screen** | `lib/screens/order_details_screen.dart` | Granular Order Management, Prep Time Picker (+10m, +15m, +30m), Buffer Reason Entry, Handover OTP Verification | Modal Bottom Sheet State, `ApiConstants.prepareOrder`, `ApiConstants.verifyPickup` |
| **Self Pickup Orders** | `lib/screens/pickup_orders_screen.dart` | Dedicated Queue for Customer Self-Pickup Orders, Pickup Code Verification, Handover Confirmation | Self-Pickup State, `ApiConstants.completePickup` |
| **Cancelled Orders** | `lib/screens/cancelled_orders_screen.dart` | Detailed Log of Cancelled & Rejected Orders with Reasons, Initiator Tracking, and Date Filters | Cancelled Orders State, `ApiConstants.getOrderHistory` |
| **Menu Management** | `lib/screens/menu_management_screen.dart` | Product & Category Management, Price Overrides, Out-of-Stock Toggles, Menu Approval Status Indicators | Category/Item State, `ApiConstants.addMenuItem`, `ApiConstants.toggleMenuItem` |
| **Restaurant Profile** | `lib/screens/restaurant_profile_screen.dart` | Profile Info, Operating Hours, Geofence Radius, Document Status, Bank Details Management | Profile State, `ApiConstants.getProfile`, `ApiConstants.restaurantSettings` |
| **Restaurant Wallet** | `lib/screens/restaurant_wallet_screen.dart` | Earnings Ledger, Commission Deductions, Payout Summaries, Settlement History | Wallet State, `ApiConstants.restaurantWallet` |
| **Order Settings** | `lib/screens/order_management_settings_screen.dart` | Auto-accept Orders Toggle, Preparation Buffer Time, Self-Pickup Enabled Toggle | Settings State, `ApiConstants.restaurantSettings` |
| **Notification Settings**| `lib/screens/notification_settings_screen.dart` | Sound/Chime Toggles, Push Notification Preferences, Loud Alert Mode | Preference Storage |

---

## 2. Key Operational Flows & Business Rules

### A. Authentication & Registration Flow
- Vendor enters phone number -> Receives OTP (`POST /api/restaurants/send-otp`).
- Submits OTP -> System issues JWT token and authenticates session (`POST /api/restaurants/verify-otp`).
- Multi-stage onboarding collects store trade name, cuisine, location geofence, trade license, GST number, and bank details.

### B. Order Acceptance & Preparation Flow
- Incoming order arrives via Socket.IO / REST polling -> Triggers chime alert.
- Vendor accepts order and sets expected preparation time (+10 min to +45 min) plus buffer time if busy.
- Backend transitions order state: `placed` → `accepted` → `preparing` → `ready`.
- Customer receives real-time preparation ETA updates.

### C. Self-Pickup vs Home Delivery Flow
- **Self Pickup**:
  - Customer receives 4-digit Pickup Code (`selfPickupCode`).
  - Restaurant marks food `Ready for Pickup`.
  - Customer arrives at restaurant; vendor enters & verifies code (`POST /api/orders/restaurant/verify-pickup/:orderId`).
  - Order completes; funds settle to Restaurant Wallet without rider dispatch.
- **Home Delivery**:
  - Restaurant marks food `Ready`.
  - Backend rider dispatch engine notifies nearby riders.
  - Rider accepts, arrives at store, verifies pickup OTP, and delivers food.

### D. Order Cancellation & Rejection Flow
- Vendor can reject order during `placed` state with mandatory custom reason selection (`ownerRejectOrder`).
- Vendor can cancel order during `preparing` state within the 5-minute cancellation grace window.
- Refund request is automatically logged to `RefundRequest` for paid orders.

---

## 3. UI/UX Regression Safeguards
- All modern gradient styling, card elevation, typography (Google Fonts Poppins), and interactive animations from `remotes/origin/Resturant-app-updated` have been preserved.
- No obsolete duplicate files or competing screens remain.
