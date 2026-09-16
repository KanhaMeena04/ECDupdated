# ECDKART RESTAURANT ONBOARDING CONTRACT

## Overview
This contract defines the canonical payload structure, endpoint paths, database mappings, and approval state transitions for restaurant partner onboarding across **ECDadmin**, **Restaurant App**, **ECDbackend**, and **MongoDB**.

---

## 1. Onboarding API Endpoints

### A. Admin Restaurant Creation
- **Endpoint**: `POST /api/restaurants/admin/create`
- **Auth**: Protected (Admin Token required)
- **Content-Type**: `application/json` or `multipart/form-data`

### B. Restaurant App Partner Application
- **Endpoint**: `POST /api/restaurants/apply`
- **Auth**: Public or User Token
- **Content-Type**: `application/json` or `multipart/form-data`

---

## 2. Canonical Payload Schema

```json
{
  "ownerName": "Rajesh Kumar",
  "ownerEmail": "rajesh@gourmetkitchen.com",
  "ownerMobile": "9876543210",
  "ownerPassword": "Password123!",
  "name": {
    "en": "The Gourmet Kitchen",
    "de": ""
  },
  "description": {
    "en": "Fine dining restaurant featuring North Indian and Italian specialties",
    "de": ""
  },
  "cuisine": ["North Indian", "Italian"],
  "brand": "Gourmet Group",
  "email": "contact@gourmetkitchen.com",
  "contactNumber": "9876543210",
  "address": "45 Main Market Road",
  "city": "Sohna",
  "area": "Sohna Central",
  "latitude": 28.248,
  "longitude": 77.081,
  "location": {
    "type": "Point",
    "coordinates": [77.081, 28.248]
  },
  "deliveryTime": 30,
  "packagingCharge": 10,
  "geofenceRadius": 10,
  "deliveryType": "both",
  "paymentMethods": "Both",
  "adminCommission": 10,
  "isFreeDelivery": false,
  "freeDeliveryContribution": 0,
  "isTemporarilyClosed": false,
  "bankDetails": {
    "accountName": "Gourmet Foods Pvt Ltd",
    "accountNumber": "987654321098",
    "bankName": "HDFC Bank",
    "swiftCode": "HDFC0000123"
  },
  "timing": {
    "monday": { "open": "09:00", "close": "22:00" },
    "tuesday": { "open": "09:00", "close": "22:00" },
    "wednesday": { "open": "09:00", "close": "22:00" },
    "thursday": { "open": "09:00", "close": "22:00" },
    "friday": { "open": "09:00", "close": "22:00" },
    "saturday": { "open": "09:00", "close": "22:00" },
    "sunday": { "open": "09:00", "close": "22:00" }
  }
}
```

---

## 3. Approval Lifecycle & Rules Matrix

| Field Name | Initial State (App Submit) | Admin Created State | Approved State | Blocked State |
| :--- | :--- | :--- | :--- | :--- |
| `verificationStatus` | `'pending'` | `'verified'` | `'verified'` | `'rejected'` |
| `restaurantApproved` | `false` | `true` | `true` | `false` |
| `menuApproved` | `false` | `true` | `true` | `false` |
| `isActive` | `true` | `true` | `true` | `false` |

> [!IMPORTANT]
> A restaurant becomes visible in the User App feed **ONLY** when `restaurantApproved = true`, `menuApproved = true`, `verificationStatus = 'verified'`, `isActive = true`, and the user location falls within `geofenceRadius` (km).
