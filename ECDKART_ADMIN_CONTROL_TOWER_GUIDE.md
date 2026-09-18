# ECDKART ADMIN CONTROL TOWER OPERATIONAL GUIDE

## Overview
The **ECDKART Admin Control Tower** is the centralized operational command center for the ECDKART food delivery ecosystem. Built with React and connected directly to **ECDbackend** (Port 5000) and **MongoDB Atlas**, it empowers platform administrators to manage food delivery operations, business pricing rules, service areas, restaurant onboarding, rider dispatch, financial settlements, and security controls.

---

## Key Operational Modules

### 1. Dashboard (`/dashboard`)
- **Live Order Status Counters**: Monitor real-time orders across all lifecycle states (*New, Accepted, Preparing, Ready, Rider Assigned, Picked Up, Out for Delivery, Delivered, Cancelled*).
- **Financial Metrics**: Real-time aggregation of GMV (Gross Merchandise Value), commission revenue, delivery fee revenue, net platform revenue, restaurant payables, and rider payables.

### 2. Order Management (`/order-dashboard`)
- Track live delivery and self pickup orders.
- Inspect order details, item snapshots, applied coupons, delivery address, customer contact, and payment status.
- Initiate admin order status overrides or process cancellations and refunds with recorded reason.

### 3. Restaurant Master Control (`/restaurants`, `/admin-create-restaurant`, `/pending-restaurants`, `/approve-restaurant`)
- **Onboarding**: Create new restaurant partner profiles with GeoJSON location coordinates (`[longitude, latitude]`), contact information, FSSAI/GST details, and bank account information.
- **Verification & Approval**: Approve restaurant applications (`verificationStatus: 'verified'`, `restaurantApproved: true`).
- **Operational Controls**: Toggle restaurant online/offline status, delivery ON/OFF, self pickup ON/OFF, maximum delivery radius, and prep time buffer.

### 4. Menu & Catalog Control (`/catalog-master-control`, `/edit-restaurant-menu/:id`)
- **Product Approval Workflow**:
  - Individual Product Approval: `PUT /api/admin/products/:id/approve`
  - Restaurant Menu Enablement: `PATCH /api/admin/restaurants/:id/approve-menu`
  - Public Visibility Rule: Only items with `Product.isApproved = true` and `Restaurant.menuApproved = true` appear in the public User App feed.
- **Admin Price Override**: Set effective base prices for items (`adminPriceOverride`) while preserving original base price and strikethrough MRP.

### 5. Delivery & Pricing Engine (`/pricing-control`)
- Configure dynamic delivery charge rules:
  - Base Fee
  - Distance Slabs (e.g. 0-2 km = ₹20, 2-4 km = ₹30, 4-6 km = ₹40, 6-8 km = ₹50)
  - Free Delivery Threshold (e.g. Orders > ₹500)
  - Surge Charges (Peak hours, Rain charge, High demand bonus)
  - Restaurant-specific delivery fee overrides

### 6. Rider Management & Auto-Assignment (`/driver-list`, `/admin-create-driver`, `/pending-driver-list`)
- Onboard new delivery partners with vehicle details, driving license, and bank account records.
- Configure rider auto-assignment dispatch parameters: assignment radius, acceptance timeout (e.g. 30s), max reassignment attempts.
- Track online riders and live GPS tracking during active deliveries.

### 7. Marketing & Promocodes (`/promocodes`, `/restaurant-banner`)
- **Promocode Builder**: Create discount coupons (percentage or fixed amount), minimum order value, maximum discount cap, per-user usage limits, and funding allocation (ECDKART vs Restaurant).
- **App Home Screen Banners**: Upload promotional banners and map deep links to specific restaurants or categories.

### 8. User App CMS Tower (`/user-app-cms`)
- Dynamically build and reorder home screen sections (*Banners, Categories, Recommended Dishes, Nearby Restaurants*) without requiring mobile app updates.

### 9. Service Areas & Geofencing (`/city-list`, `/zones`)
- Manage multi-tiered service areas: `State -> District -> City -> Zone -> Pincode`.
- Define active service zones, local delivery radius, minimum order limits, and local pricing rules for Tier-2, Tier-3, and rural Indian towns.

### 10. Financial Overview & Settlements (`/financial-overview`, `/restaurant-payout`, `/driver-payout`, `/rider-cash-management`)
- Calculate order-wise net payables for restaurants (`Gross Sales - Commission - Deductions`).
- Review rider earning ledgers (*Base fee + Distance bonus + Surge bonus*).
- Process payout withdrawals and reconcile payment gateway transactions against bank payouts.

### 11. Emergency Controls & Feature Flags (`/emergency-controls`, `/feature-flags`)
- **Emergency Kill-Switches**: Instantly toggle platform-wide or zone-specific switches:
  - `Accept New Orders`
  - `Delivery Service`
  - `Self Pickup`
  - `COD (Cash on Delivery)`
  - `Online Payment`
- **Feature Flags**: Runtime evaluation of experimental features (e.g. Self Pickup rollout, Rain surge rule).

### 12. Audit Logs & System Security (`/audit-logs`, `/role`, `/staff`)
- **Audit Logs**: Immutable records of all sensitive mutations including user ID, role, action, entity, changed fields, previous/new values, IP address, and timestamp.
- **RBAC**: Define granular staff roles (*Super Admin, Operations Admin, Finance Admin, Support Admin, Restaurant Manager*).

---

## Language & Locale Guidelines
- The Control Tower operates **strictly in English** tailored for Indian food delivery operations.
- Currency: Indian Rupee (₹).
- Distance Unit: Kilometers (KM).
- Order ID Prefix: `ECD`.
