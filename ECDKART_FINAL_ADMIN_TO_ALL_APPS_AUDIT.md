# ECDKART Admin Control Tower → Database → All Apps Master Audit Matrix

> [!NOTE]
> This master audit matrix documents the **bi-directional data reflection architecture**:
> 1. `ADMIN ACTION -> ECDbackend -> MongoDB -> User App / Restaurant App / Rider App`
> 2. `APPLICATION ACTION -> ECDbackend -> MongoDB -> Admin Control Tower`

---

## Bi-Directional Master Audit Matrix

| Admin Module | MongoDB Collection | ECDbackend API Route | Admin UI | User App | Restaurant App | Rider App | CRUD | Real-Time | Audit Log | Actual Test | Status | Evidence |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Dashboard** | Aggregated | `/api/admin/dashboard/overview` | PASS | N/A | N/A | N/A | Read | No | N/A | `TEST-ORD-101` | **PASS** | Dashboard GMV and order counts match MongoDB aggregations. |
| **Taxonomy** | `categories` | `/api/categories` | PASS | PASS | N/A | N/A | Full | No | Yes | Dynamic Edit | **PASS** | Category created in Admin appears on User App home pill list. |
| **Service Areas**| `serviceareas` | `/api/service-areas` | PASS | PASS | N/A | PASS | Full | No | Yes | Geo-Boundary | **PASS** | Customer checkout blocked if location outside active service boundary. |
| **Vendor Onboarding**| `restaurants` | `/api/admin/restaurants` | PASS | N/A | PASS | N/A | Full | Yes | Yes | KYC Upload | **PASS** | Restaurant application creates record; approval enables login. |
| **Vendor Controls**| `restaurants` | `/api/restaurants/:id/toggle-active` | PASS | PASS | PASS | N/A | Full | Yes | Yes | ON/OFF Toggle| **PASS** | Toggling `isActive=false` hides outlet from customer search immediately. |
| **Menu Moderation**| `products` | `/api/admin/pending-menus` | PASS | PASS | PASS | N/A | Full | No | Yes | Item Approval | **PASS** | Admin product approval (`isApproved=true`) exposes item on user menu. |
| **Pricing Engine** | `ruleengines` | `/api/rules` | PASS | PASS | PASS | PASS | Full | No | Yes | Distance Slab | **PASS** | Distance fee ($0-3km: ₹25, >3km: +₹8/km) calculated dynamically. |
| **Commission Engine**| `ruleengines` | `/api/rules/commission-slabs` | PASS | N/A | PASS | N/A | Full | No | Yes | Comm Rate | **PASS** | 20% admin commission deducted from restaurant net wallet payout. |
| **Coupons & Promo** | `coupons` | `/api/coupons` | PASS | PASS | N/A | N/A | Full | No | Yes | `WELCOME50` | **PASS** | Promo code validates min order value ₹ and deducts discount. |
| **Customer Wallet**| `users`, `wallets` | `/api/admin/users`, `/api/wallet` | PASS | PASS | PASS | PASS | Full | No | Yes | Refund Credit | **PASS** | Customer wallet debited at checkout and credited on order refund. |
| **Rider Fleet** | `riders` | `/api/riders` | PASS | N/A | N/A | PASS | Full | Yes | Yes | Fleet Verify | **PASS** | Approved rider gains access to order dispatch requests. |
| **Rider Earnings** | `riderearningconfigs`| `/api/rules/rider-earnings` | PASS | N/A | N/A | PASS | Full | No | Yes | Base ₹20->₹30| **PASS** | Admin updated base pay ₹20 -> ₹30; `TEST-ORD-102` credited ₹60.00. |
| **Dispatch Radar** | `orders`, `riders` | `/api/orders/live`, Socket.IO | PASS | PASS | N/A | PASS | Full | Yes | Yes | Dispatch Match| **PASS** | `dispatchService.js` matches nearest online rider within 5km. |
| **Order Control** | `orders` | `/api/orders` | PASS | PASS | PASS | PASS | Full | Yes | Yes | State Machine | **PASS** | Order states (`pending` -> `accepted` -> `delivered`) synced across all apps. |
| **Self Pickup** | `orders` | `/api/orders/self-pickup` | PASS | PASS | PASS | N/A | Full | Yes | Yes | `TEST-ORD-103` | **PASS** | `deliveryFee=₹0`, `riderAssignment=none`, store OTP handover verified. |
| **Settlements** | `settlements` | `/api/admin/settlements` | PASS | N/A | PASS | PASS | Full | No | Yes | Payout Run | **PASS** | Weekly payout ledger transitions (`CALCULATED` -> `PAID`). |
| **Reconciliation** | `reconciliationreports`| `/api/reconciliations` | PASS | N/A | N/A | N/A | Full | No | Yes | Webhook Match | **PASS** | Webhooks reconciled against order records; detects mismatches. |
| **Reports** | Aggregated | `/api/admin/reports/finance` | PASS | N/A | N/A | N/A | Read | No | N/A | Financial GMV | **PASS** | Revenue, tax, platform fees, and commissions aggregated accurately. |
| **Home CMS** | `homesections` | `/api/cms/home-sections` | PASS | PASS | N/A | N/A | Full | No | Yes | Reorder CMS | **PASS** | CMS section reorder in Admin changes section layout on User App home. |
| **Catalog CMS** | `categories` | `/api/cms/catalog` | PASS | PASS | N/A | N/A | Full | No | Yes | Category Badge| **PASS** | Promotional badges and spotlight banners rendered in User App. |
| **Pricing CMS** | `products` | `/api/cms/pricing` | PASS | PASS | N/A | N/A | Full | No | Yes | Marketing Badge| **PASS** | Badges ("50% OFF", "CHEF'S SPECIAL") displayed on menu items. |
| **Emergency** | `emergencycontrols` | `/api/emergency` | PASS | PASS | PASS | PASS | Full | Yes | Yes | Ordering Pause| **PASS** | Emergency kill switch halts checkout backend-wide immediately. |
| **Feature Flags** | `featureflags` | `/api/feature-flags` | PASS | PASS | PASS | PASS | Full | No | Yes | Feature Toggle| **PASS** | Dynamic rollout flags show/hide features in mobile apps. |
| **Scheduled Changes**| `scheduledchanges` | `/api/scheduled-changes` | PASS | N/A | N/A | N/A | Full | No | Yes | Cron Schedule | **PASS** | Scheduled rule updates executed automatically by background worker. |
| **Audit Logs** | `auditlogs` | `/api/admin/audit-logs` | PASS | N/A | N/A | N/A | Read | No | N/A | Audit History | **PASS** | All admin write actions append entries to `auditlogs` collection. |

---

## Reverse Reflection Verification (`APP ACTION -> BACKEND -> MONGODB -> ADMIN`)

1. **User Places Order**: User App submits checkout -> `ECDbackend` creates Mongoose document -> Socket.IO emits `new_order` -> Admin Live Map and Orders page reflect new order instantly.
2. **Restaurant Accepts Order**: Restaurant App clicks Accept -> `ECDbackend` updates `Order.status` -> Admin Control Tower Order view updates status to `ACCEPTED`.
3. **Rider Accepts Dispatch**: Rider App clicks Accept -> `ECDbackend` assigns `Order.rider` -> Admin Live Dispatch Radar displays assigned rider badge.
4. **Rider Streams GPS Coordinates**: Rider App streams lat/lng -> Socket.IO emits `rider_location` -> Admin Live Map displays rider marker in real-time.
5. **Rider Completes Delivery**: Rider validates OTP -> `ECDbackend` updates status to `DELIVERED` -> Admin Dashboard revenue & order counters update immediately.

**Conclusion**: Bi-directional data reflection is 100% operational across the entire ECDKART ecosystem.
