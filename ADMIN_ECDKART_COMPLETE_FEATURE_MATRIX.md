# ADMIN ECDKART COMPLETE FEATURE MATRIX

## Overview
This matrix inventories every Admin Control Tower sidebar item, route, React component, API endpoint, controller, model, cross-app connectivity, and current operational status across the entire **ECDKART** ecosystem.

---

## Complete Feature & Control Matrix (26 Major Control Areas)

| # | Control Area / Sidebar Item | React Route | Component File | Backend API Endpoint | HTTP Method | Controller & Method | MongoDB Model | Cross-App Impact | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Dashboard Overview** | `/admin` | `Dashboard.jsx` | `/api/dashboard/stats` | GET | `dashboardController.getDashboardStats` | `Order`, `Restaurant`, `User`, `Rider` | Admin metrics aggregation | CONNECTED |
| **2** | **Restaurant Master Control** | `/restaurants` | `ActiveRestaurantsList.jsx` | `/api/restaurants/admin/list` | GET | `restaurantController.getAdminRestaurants` | `Restaurant` | User, Restaurant Apps | CONNECTED |
| **2a** | **Add Restaurant** | `/restaurants/create` | `AdminCreateRestaurant.jsx` | `/api/restaurants/admin/create` | POST | `restaurantController.adminCreateRestaurant` | `Restaurant`, `User` | User, Restaurant Apps | CONNECTED |
| **2b** | **Approve / Reject Restaurant** | `/restaurants/pending` | `ApproveRestuarant.jsx` | `/api/restaurants/admin/:id/status` | PATCH | `restaurantController.updateRestaurantStatus` | `Restaurant` | User App visibility | CONNECTED |
| **3** | **Commission Control** | `/commission` | `CommissionSetting.jsx` | `/api/admin/commission` | GET/PUT | `adminController.updateCommission` | `Restaurant`, `AdminSettings` | Restaurant Settlement | CONNECTED |
| **4** | **Delivery Charge Control** | `/delivery-charge` | `PricingControlTower.jsx` | `/api/admin/pricing-rules` | GET/POST | `pricingController.updatePricingRules` | `PricingRule` | User Checkout | CONNECTED |
| **5** | **Rider Earning Control** | `/rider-earnings` | `RiderEarningsControl.jsx` | `/api/admin/rider-rates` | GET/PUT | `riderController.updateRiderRates` | `RiderRates` | Rider App Wallet | CONNECTED |
| **6** | **Rider Auto Assignment** | `/auto-assignment` | `AutoAssignmentSetting.jsx` | `/api/admin/auto-assignment` | GET/PUT | `assignmentController.updateConfig` | `AssignmentRule` | Rider Dispatch | CONNECTED |
| **7** | **Order Rules** | `/order-rules` | `OrderRules.jsx` | `/api/admin/order-rules` | GET/PUT | `orderRulesController.updateRules` | `AdminSettings` | User, Restaurant, Rider | CONNECTED |
| **8** | **Smart Rule Engine** | `/smart-rules` | `SmartRuleEngine.jsx` | `/api/admin/smart-rules` | GET/POST | `smartRuleController.createRule` | `SmartRule` | Dynamic Pricing/Alerts | CONNECTED |
| **9** | **Menu Master Control** | `/menu-control` | `CatalogMasterControl.jsx` | `/api/admin/menu` | GET/POST | `restaurantController.getAdminMenu` | `Product`, `Category` | User App, Restaurant App | CONNECTED |
| **10** | **Coupon Control** | `/coupons` | `PromocodeTable.jsx` | `/api/admin/promocodes` | GET/POST | `promocodeController.addPromocode` | `Promocode` | User Checkout | CONNECTED |
| **11** | **Offers & Marketing** | `/offers` | `OffersMarketing.jsx` | `/api/admin/offers` | GET/POST | `offerController.createOffer` | `Offer` | User App Banners | CONNECTED |
| **12** | **App Home Screen CMS** | `/home-cms` | `HomeScreenBuilder.jsx` | `/api/home/sections` | GET/POST | `homeController.updateHomeSections` | `HomeScreenSection` | User App Home Screen | CONNECTED |
| **13** | **Service Area Control** | `/service-areas` | `CityZoneTable.jsx` | `/api/admin/cities` | GET/POST | `cityController.addCity` | `City`, `Zone` | User Geofencing | CONNECTED |
| **14** | **Self Pickup Control** | `/self-pickup` | `SelfPickupSettings.jsx` | `/api/admin/self-pickup` | GET/PUT | `adminSettingsController.updatePickup` | `AdminSettings` | User & Restaurant Apps | CONNECTED |
| **15** | **Payment Control** | `/payment-settings` | `PaymentControl.jsx` | `/api/admin/payment-config` | GET/PUT | `adminSettingsController.updatePayment` | `AdminSettings` | User Checkout | CONNECTED |
| **16** | **Refund Control** | `/refunds` | `RefundOrders.jsx` | `/api/admin/refunds` | GET/POST | `refundController.processRefund` | `Refund`, `Order` | User Wallet / Payment | CONNECTED |
| **17** | **Restaurant Ranking** | `/restaurant-ranking` | `RestaurantRanking.jsx` | `/api/admin/restaurant-ranking` | GET/PUT | `restaurantController.updateRanking` | `Restaurant` | User Recommended List | CONNECTED |
| **18** | **Notification Control** | `/notifications` | `PushNotificationForm.jsx` | `/api/admin/notifications/broadcast` | POST | `notificationController.broadcast` | `Notification` | User, Rider, Restaurant | CONNECTED |
| **19** | **Analytics & Reports** | `/analytics` | `AdminFinancialOverview.jsx` | `/api/admin/analytics` | GET | `analyticsController.getAnalytics` | `Order`, `Payment` | Executive Dashboard | CONNECTED |
| **20** | **Settlement & Payouts** | `/payouts` | `RestaurantPayoutList.jsx` | `/api/admin/payouts` | GET/POST | `withdrawalController.approveWithdrawal` | `Withdrawal`, `Settlement` | Restaurant & Rider Apps | CONNECTED |
| **21** | **Roles & Permissions** | `/staff-roles` | `StaffTable.jsx` | `/api/admin/staff` | GET/POST | `adminController.manageStaff` | `User` | Admin Panel Access | CONNECTED |
| **22** | **Audit Logs** | `/audit-logs` | `AuditLogs.jsx` | `/api/admin/audit-logs` | GET | `auditLogController.getLogs` | `AuditLog` | System Traceability | CONNECTED |
| **23** | **Emergency Controls** | `/emergency-controls` | `EmergencySwitches.jsx` | `/api/admin/emergency-controls` | GET/PUT | `adminSettingsController.updateKillSwitches` | `AdminSettings` | Global Ecosystem | CONNECTED |
| **24** | **Feature Flags** | `/feature-flags` | `FeatureFlags.jsx` | `/api/admin/feature-flags` | GET/PUT | `adminSettingsController.updateFlags` | `FeatureFlag` | User, Rider, Restaurant | CONNECTED |
| **25** | **Scheduled Config** | `/scheduled-config` | `ScheduledConfig.jsx` | `/api/admin/scheduled-config` | GET/POST | `scheduledJobController.createConfigJob` | `ScheduledJob` | Automated System Cron | CONNECTED |
| **26** | **Master Settings** | `/site-settings` | `SIteSetting.jsx` | `/api/admin/settings` | GET/PUT | `adminSettingsController.updateAdminSettings` | `AdminSettings` | Global Platform Rules | CONNECTED |
