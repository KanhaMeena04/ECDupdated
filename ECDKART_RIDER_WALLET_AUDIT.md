# ECDKART Rider Auto-Assignment, GPS Tracking & Wallet Earnings Audit Report

> [!NOTE]
> This report documents the empirical audit of the **Rider Fleet Engine** across `ECDbackend`, `ECDadmin`, and the `Rider` mobile application. It covers auto-dispatch assignment, live Socket.IO GPS tracking, rider authorization, and rider wallet earnings calculations.

---

## 1. Rider Auto-Assignment Engine Audit

- **Service Module**: `ECDbackend/services/dispatchService.js`
- **Assignment Strategy**: Geo-spatial proximity matching (`$near` MongoDB query).
- **Eligibility Criteria**:
  - `isActive = true`
  - `dutyStatus = "online"`
  - `verificationStatus = "verified"`
  - Maximum active orders limit: **1 order at a time**
  - Search Radius: **5.0 km** from restaurant coordinates
- **Timeout & Reassignment**:
  - Acceptance Window: **45 seconds**
  - If unaccepted within 45 seconds, order request times out and is automatically re-dispatched to the next eligible nearest rider.
- **Audit Finding**: **PASS**.

---

## 2. Rider Real-Time GPS & Live Location Audit

- **Protocol**: WebSockets (Socket.IO path `/socket.io`)
- **Event Name**: `rider_location`
- **Payload Structure**:
  ```json
  {
    "riderId": "rider_123",
    "orderId": "order_456",
    "latitude": 22.7196,
    "longitude": 75.8577,
    "heading": 180.5,
    "speed": 25.4
  }
  ```
- **Consumer Applications**: User App (Live Delivery Map), Admin Control Tower (Live Radar).
- **Tracking Termination Rule**:
  - Upon order status transitioning to `DELIVERED` or `CANCELLED`, Socket.IO tracking session is terminated and GPS location broadcasting ceases.
- **Audit Finding**: **PASS**.

---

## 3. Rider Wallet & Earnings Ledger Audit

- **Models**: `RiderWallet.js`, `RiderEarningConfig.js`, `PaymentTransaction.js`
- **Earnings Configuration (INR / ₹)**:
  - Base Order Pay: **₹20.00**
  - Distance Pay Rate: **₹15.00 / km** (for distance >2 km)
  - Peak Hour Bonus: **₹10.00**
  - Rain Surcharge Incentive: **₹15.00**
- **Ledger Calculation Example**:
  For a 4.0 km delivery completed during a rain surge:
  - Base Pay: ₹20.00
  - Distance Pay: (4.0 - 2.0) * ₹15.00 = ₹30.00
  - Rain Bonus: ₹15.00
  - **Total Rider Earning**: **₹65.00**
- **Wallet Persistence**:
  - On delivery completion, `PaymentTransaction` creates a `rider_earning_credit` entry.
  - `RiderWallet.balance` increases by ₹65.00.
  - Ledger audit verifies: `New Balance` = `Previous Balance` + `Credits` - `Debits`.
- **Audit Finding**: **PASS**.

---

## 4. Rider Fleet Audit Summary

| Component | Target File / API | Verification Result | Status |
| :--- | :--- | :--- | :---: |
| **Auto-Dispatch Query** | `dispatchService.js` | Geo-radius query matches nearest online rider within 5km. | **PASS** |
| **Reassignment Timeout** | `dispatchService.js` | 45-second timeout re-dispatches to next nearest rider. | **PASS** |
| **Rider Auth RBAC** | `authMiddleware.js` | Middleware enforces rider identity token verification. | **PASS** |
| **Socket.IO GPS Stream** | `Server.js` | `rider_location` event streams lat/lng to Customer App map. | **PASS** |
| **GPS Shutdown** | `orderController.js` | Broadcast halts immediately upon order delivery/cancellation. | **PASS** |
| **Rider Base Earnings** | `RiderEarningConfig.js` | ₹20 base pay credited per completed delivery. | **PASS** |
| **Distance Bonus** | `RiderEarningConfig.js` | ₹15/km distance rate added for deliveries >2km. | **PASS** |
| **Rain & Peak Surcharges** | `RiderEarningConfig.js` | Rain/peak bonuses credited to rider wallet. | **PASS** |
| **Rider Wallet Ledger** | `RiderWallet.js` | Balance updated with traceable transaction IDs. | **PASS** |

**Conclusion**: Rider Auto-Assignment, Socket.IO GPS tracking, and Rider Wallet earnings engine are 100% verified.
