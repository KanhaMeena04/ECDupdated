# ECDKART RIDER DOCUMENT & KYC CONTRACT

## Overview
This contract details the rider onboarding API endpoints, document submission payloads, storage schema, verification states, and Admin KYC management flows between **Rider App**, **ECDbackend**, **ECDadmin**, and **MongoDB**.

---

## 1. Rider Document API Endpoints

### A. Document Upload (Rider App)
- **Endpoint**: `POST /api/riders/documents`
- **Auth**: Protected (Rider Bearer Token required)
- **Content-Type**: `multipart/form-data`

### B. Admin Pending Riders List
- **Endpoint**: `GET /api/riders/admin/pending`
- **Auth**: Protected (Admin Token required)

### C. Admin Rider Verification
- **Endpoint**: `PATCH /api/riders/admin/verify/:id`
- **Auth**: Protected (Admin Token required)
- **Payload**: `{ "kycStatus": "verified" }` or `{ "kycStatus": "rejected", "rejectionReason": "Illegible driving license scan" }`

---

## 2. Multipart Upload Payload Schema

```multipart/form-data
Fields:
- name: "Amit Sharma"
- email: "amit.rider@gmail.com"
- upi: "amit@upi"
- vehicleType: "Bike"
- vehicleNumber: "MP-09-AB-1234"
- licenseNumber: "DL-1420110012345"

Files:
- profileImage: Binary image
- aadharFront: Binary image
- aadharBack: Binary image
- license: Binary image
- vehicleRc: Binary image
```

---

## 3. Database Schema Mapping (`Rider` Model)

```javascript
{
  user: ObjectId, // Ref -> User
  vehicleDetails: {
    type: String, // 'Bike', 'Scooter', 'EV'
    registrationNumber: String,
    licenseNumber: String
  },
  documents: {
    profileImage: String, // Cloud / Server URL
    licenseUrl: String,
    aadharFrontUrl: String,
    aadharBackUrl: String,
    vehicleRcUrl: String
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedBy: ObjectId // Ref -> Admin User
}
```

---

## 4. Admin KYC Verification Workflow

```
[Rider App Submit Documents]
            ↓
[Uploads stored in ECDbackend uploads/ folder or Cloudinary]
            ↓
[Rider record updated with kycStatus: 'pending']
            ↓
[ECDadmin PendingRiderTable.jsx displays rider & document links]
            ↓
[Admin verifies documents & clicks Approve / Reject]
            ↓
[PATCH /api/riders/admin/verify/:id]
            ↓
[kycStatus updated to 'verified' -> Rider App enables "Go Online"]
```
