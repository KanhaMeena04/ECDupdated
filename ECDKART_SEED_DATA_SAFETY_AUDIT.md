# ECDKART Seed Data & Seeding Safety Audit Report

## Executive Overview

This audit identifies all automatic seed scripts, demo data, test credentials, and default dataset creation mechanisms across **ECDbackend** to ensure that production client data is **NEVER** automatically overwritten, corrupted, or injected with test data upon connecting to the client database.

---

## 1. Seed Script Isolation & Risk Identification

### A. Automatic Startup Seeding in `db.js` (`ensureAdminUser` & `ensureSeededData`)
- **Location:** `ECDbackend/config/db.js`
- **Current Behavior:** Upon startup, `connectDB()` checks `Restaurant.countDocuments()`. If count is 0, it triggers `seedEcdkartData.js` automatically. Furthermore, `ensureAdminUser()` resets the password of `admin@gmail.com` to `admin123`.
- **Production Risk:** High Risk if connecting to a fresh/empty database or if admin credentials get overwritten.
- **Required Production Guardrail:**
  ```javascript
  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_AUTO_SEED === 'true') {
    console.log("🔒 Auto-seeding disabled in production environment.");
    return;
  }
  ```

### B. Manual Standalone Seed Script (`seedEcdkartData.js`)
- **Location:** `ECDbackend/scripts/seedEcdkartData.js`
- **Current Behavior:** Clears products, categories, banners, and inserts demo restaurants, demo products, and demo promotional banners.
- **Production Risk:** Critical Risk if executed against client database.
- **Required Production Guardrail:** Add strict environment assertion at top of `seedEcdkartData.js`:
  ```javascript
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL SAFETY ERROR: Cannot execute seedEcdkartData.js in production mode!");
    process.exit(1);
  }
  ```

---

## 2. Demo Data & Test Credentials Purge Audit

The following demo data created during local testing MUST NOT be injected into client production databases:

| Item Type | Demo Value / Object | Action Required for Production |
|---|---|---|
| **Demo Restaurants** | "Master Evidence Audit Diner", "Royal Biryani Handi", "Delhi Butter Chicken" | **EXCLUDE / PURGE** |
| **Demo Products** | "Audit Master Butter Chicken", "Audit Master Paneer Tikka" | **EXCLUDE / PURGE** |
| **Demo Vendor Accounts** | `vendor_9876543210@ecdkart.com`, `audit_diner_*@ecdkart.com` | **EXCLUDE / PURGE** |
| **Demo Rider Accounts** | `rider_j@ecdkart.com`, `9222222222` | **EXCLUDE / PURGE** |
| **Demo Customer Accounts** | `cust_h@ecdkart.com`, `9111111111` | **EXCLUDE / PURGE** |
| **Default Test OTP** | `123456` hardcoded bypass in `vendorSendOtp` / `vendorVerifyOtp` | **DISABLE** in production (`NODE_ENV === 'production'`) |
| **Demo Placeholders** | Unsplash food images (`https://images.unsplash.com/...`) | Replace with real vendor uploaded media URLs |
