# ECDKART Admin Control Tower & Backend Capability Alignment Report

## Executive Summary
This document verifies that every new and enhanced feature in the updated Restaurant App baseline (`remotes/origin/Resturant-app-updated`) has matching administrative capabilities in `ECDAdmin` and `ECDbackend`.

---

## 1. Admin Management Capability Audit

| Restaurant App Feature | ECDAdmin Capability | Admin Route / Page | Backend Controller Method | Audit & Override Control |
| :--- | :--- | :--- | :--- | :--- |
| **Restaurant Verification & Onboarding** | Review KYC, License, GST, Trade License documents | `PendingRestaurants.jsx`, `ApproveRestuarant.jsx` | `approveRestaurant`, `rejectRestaurant` | `Restaurant.verificationStatus`, `rejectionReason` |
| **Menu & Product Approval** | Audit menu items submitted by vendors, approve/reject individual products | `EditRestaurantMenuAdmin.jsx` | `getRestaurantProductById` | `Product.isApproved`, `isRejected`, `approvalNotes` |
| **Restaurant Online/Offline Override** | Force toggle restaurant online/offline or active/inactive status | `ActiveRestaurantsList.jsx`, `EmergencyControlsPage.jsx` | `toggleRestaurantActive` | `Restaurant.adminOverride` |
| **Self Pickup Configuration** | Enable/disable self-pickup option per restaurant or globally | `SelfPickupControlPage.jsx` | `updateSettings` | `Restaurant.isSelfPickupEnabled` |
| **Preparation Buffer & Grace Times** | View and adjust default preparation buffer and cancellation windows | `RestaurantDetails.jsx` | `updateSettings` | `Restaurant.prepBufferTimeMinutes` |
| **Order Lifecycle Monitoring** | Live tracking of all orders (Delivery & Self Pickup) across all states | `OrderDashboard.jsx`, `PickUpOrders.jsx` | `getAllOrdersAdmin`, `getOrderDetailsAdmin` | `Order.timeline`, `Order.status` |
| **Order Cancellation & Refund** | Override cancellation and issue wallet/gateway refunds | `CancelledOrders.jsx`, `RefundOrders.jsx` | `adminCancelOrder`, `adminRetryPayment` | `WalletTransaction`, `RefundRequest` |
| **Wallet & Payout Settlements** | Process restaurant payouts, view ledger, inspect commission splits | `RestaurantPayoutList.jsx`, `AdminFinancialOverview.jsx` | `getRestaurantWalletEarnings`, `settlementReport` | `RestaurantWallet`, `WalletTransaction` |
| **Commission Rate Settings** | Configure admin commission rate per store or global defaults | `RestaurantDetails.jsx` | `updateRestaurant` | `Restaurant.adminCommission` |

---

## 2. Emergency & Override Controls
- **Global Emergency Stop**: Admin can halt ordering in `EmergencyControlsPage.jsx`.
- **Feature Flags**: Admin can dynamically toggle self-pickup or custom cancellation reasons in `FeatureFlagsPage.jsx`.
- **Audit Logs**: All admin overrides and vendor status changes are recorded in `AuditLog` collection.
