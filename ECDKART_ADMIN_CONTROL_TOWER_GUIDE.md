# ECDKART Admin Control Tower Operations Guide

> [!IMPORTANT]
> The ECDKART Admin Control Tower (`ECDadmin`) is a single-pane-of-glass operations tower designed for high-concurrency food delivery platform management. It contains 26 dedicated modules, enforcing server-side business rules, live emergency controls, dynamic rider payout rules, and payment reconciliation.

---

## Architecture Overview

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      ECDadmin (React Control Tower)                    │
 ├────────────────────────────────────────────────────────────────────────┤
 │  - Single Page Application (Vite + React + Tailwind + Material UI)     │
 │  - 100% Pure English UI (Zero Arabic / Zero Hardcoded Translations)    │
 │  - 26 Master Operational Modules                                       │
 └──────────────────────────────────┬─────────────────────────────────────┘
                                    │ REST API & WebSockets
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      ECDbackend (Node.js + Express)                    │
 ├────────────────────────────────────────────────────────────────────────┤
 │  - Smart Rule Engine & Surcharge Calculation                           │
 │  - Live Rider GPS Tracker & Auto-Assignment Engine                    │
 │  - Payment Gateway Reconciliation & Weekly Settlement Ledger           │
 └──────────────────────────────────┬─────────────────────────────────────┘
                                    │ Data Mutations & State
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           MongoDB Database                             │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## Operational Guide for All 26 Control Tower Modules

### 1. Dashboard & System Health (`/admin/dashboard`)
- **Purpose**: Displays system-wide operational KPIs, active orders, live delivery revenue, and rider status.
- **Backend API**: `GET /api/admin/dashboard/overview`
- **Mutated Collections**: Read-only aggregation across `orders`, `users`, `restaurants`, `riders`.
- **App Impact**: Provides platform admins with real-time awareness of system throughput.

---

### 2. Dynamic Taxonomy Management (`/admin/categories`)
- **Purpose**: Manages categories and Indian regional cuisines (e.g. North Indian, South Indian, Mughlai, Sweets).
- **Backend API**: `GET/POST/PUT/DELETE /api/categories`, `/api/cuisines`
- **Mutated Collections**: `categories`, `cuisines`
- **App Impact**: Dynamically renders category pills and cuisine filters on the Customer User App home screen.

---

### 3. Service Area Control (`/admin/service-areas`)
- **Purpose**: Geo-fencing delivery zones, enabling or disabling service in specific cities or pin codes.
- **Backend API**: `GET/POST/PUT/DELETE /api/service-areas`
- **Mutated Collections**: `serviceareas`
- **App Impact**: Blocks checkout if customer location falls outside active service boundaries.

---

### 4. Vendor Onboarding & Audit (`/admin/restaurants`)
- **Purpose**: Reviews restaurant application documents (FSSAI license, GST registration, bank account details).
- **Backend API**: `GET /api/admin/restaurants/pending`, `PUT /api/admin/restaurants/:id/approve`
- **Mutated Collections**: `restaurants`
- **App Impact**: Approved restaurants immediately become searchable in Customer App and gain access to the Restaurant Partner App.

---

### 5. Vendor Live Controls (`/admin/restaurants`)
- **Purpose**: Allows admins to forcefully toggle restaurant online/offline status or mark temporary closures.
- **Backend API**: `PUT /api/restaurants/:id/toggle-active`
- **Mutated Collections**: `restaurants`
- **App Impact**: Instantly hides closed restaurants from customer search results.

---

### 6. Catalog & Menu Moderation (`/admin/menu-moderation`)
- **Purpose**: Moderates vendor menu submissions, item price edits, food quantity definitions, and food tag classifications.
- **Backend API**: `GET/PUT /api/admin/pending-menus`
- **Mutated Collections**: `products`, `menus`
- **App Impact**: Prevents unverified prices or improper food items from displaying on user screens.

---

### 7. Dynamic Pricing & Surge Engine (`/admin/rule-engine`)
- **Purpose**: Manages global pricing rules, rain surge charges, and peak hour delivery multipliers.
- **Backend API**: `GET/POST/PUT /api/rules`
- **Mutated Collections**: `ruleengines`
- **App Impact**: Server automatically calculates item subtotals, surcharges, and rain delivery fees during cart checkout.

---

### 8. Delivery & Surcharge Slabs (`/admin/rule-engine`)
- **Purpose**: Configures distance-based delivery fee tiers (e.g., $0-3km: $25 base fee, >3km: +$8/km).
- **Backend API**: `GET/PUT /api/rules/delivery-slabs`
- **Mutated Collections**: `ruleengines`
- **App Impact**: Customer cart dynamically adjusts delivery fee based on exact customer-to-restaurant GPS distance.

---

### 9. Multi-tier Commission Engine (`/admin/rule-engine`)
- **Purpose**: Configures dynamic platform commission percentages per restaurant based on order volume or contract tier.
- **Backend API**: `GET/PUT /api/rules/commission-slabs`
- **Mutated Collections**: `ruleengines`, `restaurants`
- **App Impact**: Automatically deducts platform fees before crediting restaurant net payout balance.

---

### 10. Dynamic Slashes & Promo Engine (`/admin/coupons`)
- **Purpose**: Creates platform promo codes, flat amount discounts, percentage vouchers, and minimum order restrictions.
- **Backend API**: `GET/POST/PUT/DELETE /api/coupons`
- **Mutated Collections**: `coupons`
- **App Impact**: Customers apply coupons during checkout with full server-side validation.

---

### 11. Customer Management & Wallet (`/admin/users`)
- **Purpose**: Manages registered customer profiles, views order histories, issues wallet credits, and blocks fraudulent users.
- **Backend API**: `GET/PUT /api/admin/users`
- **Mutated Collections**: `users`, `wallets`
- **App Impact**: Customer wallet balance is updated instantly for seamless checkout or refund credit.

---

### 12. Rider Management & Fleet Control (`/admin/riders`)
- **Purpose**: Onboards delivery partners, verifies driving licenses, checks vehicle registrations, and monitors active duty status.
- **Backend API**: `GET/PUT /api/riders`
- **Mutated Collections**: `riders`
- **App Impact**: Active riders receive automated order dispatch requests on the Rider App.

---

### 13. Rider Earnings Control (`/admin/rider-earnings`)
- **Purpose**: Configures base delivery payout per order, distance rate per kilometer, peak hour incentives, and rain bonuses.
- **Backend API**: `GET/PUT /api/rules/rider-earnings`
- **Mutated Collections**: `riderearningconfigs`
- **App Impact**: Rider App wallet displays exact earnings calculation per completed delivery.

---

### 14. Live Dispatch Radar & Map (`/admin/dispatch`)
- **Purpose**: Real-time operational map tracking live orders, active rider GPS locations, and auto-dispatch assignment state.
- **Backend API**: `GET /api/orders/live`, Socket.IO events (`rider_location`)
- **Mutated Collections**: `orders`
- **App Impact**: Ensures minimal delivery delays by enabling manual order re-dispatch when auto-assignment times out.

---

### 15. Order Control & Exception Management (`/admin/orders`)
- **Purpose**: Central order management dashboard to view order states (Pending, Preparing, Ready, Out for Delivery, Delivered, Cancelled).
- **Backend API**: `GET/PUT /api/orders`
- **Mutated Collections**: `orders`
- **App Impact**: Syncs order state transitions instantly across User, Restaurant, and Rider apps via WebSockets.

---

### 16. Self Pickup Control (`/admin/self-pickup`)
- **Purpose**: Dedicated management module for Self-Pickup / Takeaway orders.
- **Backend API**: `GET/PUT /api/orders/self-pickup`
- **Mutated Collections**: `orders`
- **App Impact**: Completely bypasses delivery dispatch and waives delivery fees ($0) for customer pickup.

---

### 17. Settlement & Payout Engine (`/admin/settlements`)
- **Purpose**: Generates weekly financial settlement reports for restaurant partners and delivery riders.
- **Backend API**: `GET/POST /api/admin/settlements`
- **Mutated Collections**: `settlements`
- **App Impact**: Credits finalized earnings to restaurant and rider bank accounts/wallets.

---

### 18. Payment Gateway Reconciliation (`/admin/reconciliation`)
- **Purpose**: Auto-reconciles payment gateway webhook events (Razorpay / Stripe) against database order records to catch unmatched transactions.
- **Backend API**: `GET/POST /api/reconciliations`
- **Mutated Collections**: `reconciliationreports`
- **App Impact**: Prevents order fulfillment for unconfirmed or failed payment transactions.

---

### 19. Financial Analytics & Reports (`/admin/reports`)
- **Purpose**: Generates platform revenue reports, gross merchandise value (GMV), tax collections, and net profit margins.
- **Backend API**: `GET /api/admin/reports/finance`
- **Mutated Collections**: Read-only aggregation across `orders`, `settlements`.
- **App Impact**: Gives management full financial transparency.

---

### 20. Home Section CMS Engine (`/admin/cms/home`)
- **Purpose**: Dynamic banner carousels, home section titles, and home screen component arrangement.
- **Backend API**: `GET/POST/PUT/DELETE /api/cms/home-sections`
- **Mutated Collections**: `homesections`, `banners`
- **App Impact**: Customer App home screen layout updates dynamically without requiring app re-downloads.

---

### 21. Catalog CMS Engine (`/admin/cms/catalog`)
- **Purpose**: Visual styling and badges for food categories and curated collections.
- **Backend API**: `GET/POST/PUT /api/cms/catalog`
- **Mutated Collections**: `categories`
- **App Impact**: Highlights trending categories and festive food curations in User App.

---

### 22. Pricing CMS Engine (`/admin/cms/pricing`)
- **Purpose**: Configures promotional marketing badges (e.g. "FLAT ₹50 OFF", "CHEF'S SPECIAL") attached to menu items.
- **Backend API**: `GET/POST/PUT /api/cms/pricing`
- **Mutated Collections**: `products`
- **App Impact**: Renders promotional badges on menu items in User App.

---

### 23. Emergency Kill-Switches (`/admin/emergency-controls`)
- **Purpose**: Master operational kill-switches: Disable Platform Ordering, Force Rain Mode, Stop Delivery Dispatch, or Pause COD.
- **Backend API**: `GET/POST/PUT /api/emergency`
- **Mutated Collections**: `emergencycontrols`
- **App Impact**: Immediately halts checkout or displays emergency operational banner in User App.

---

### 24. Feature Flags (`/admin/feature-flags`)
- **Purpose**: Toggle experimental platform features on/off (e.g. Self Pickup, In-App Wallet, In-App Chat).
- **Backend API**: `GET/POST/PUT /api/feature-flags`
- **Mutated Collections**: `featureflags`
- **App Impact**: Dynamically shows or hides feature UI elements across User, Restaurant, and Rider mobile apps.

---

### 25. Scheduled Changes Engine (`/admin/scheduled-changes`)
- **Purpose**: Schedules future operational rule updates (e.g., schedule rain surge to start at 6:00 PM or activate festival banner at midnight).
- **Backend API**: `GET/POST/DELETE /api/scheduled-changes`
- **Mutated Collections**: `scheduledchanges`
- **App Impact**: Cron background worker executes rule updates automatically at the designated timestamp.

---

### 26. Audit Logs & System Governance (`/admin/audit-logs`)
- **Purpose**: Immutable security and administrative event ledger tracking all price modifications, emergency actions, and user blocks.
- **Backend API**: `GET /api/admin/audit-logs`
- **Mutated Collections**: `auditlogs`
- **App Impact**: Enforces full administrative accountability and compliance logging.
