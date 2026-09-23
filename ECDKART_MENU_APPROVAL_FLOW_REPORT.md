# ECDKART Menu Approval Flow Report

## 1. Approval State Machine
```
[Restaurant Creates Item] 
         ↓
      (DRAFT)
         ↓
  [Submit Item]
         ↓
(PENDING_ADMIN_APPROVAL)
 (isApproved=false)
 (isPublished=false)
         │
   ┌─────┴─────────────────────────────────┐
   ↓                                       ↓
[Admin Review: APPROVE]         [Admin Review: REJECT / CHANGES]
   ↓                                       ↓
(APPROVED & PUBLISHED)           (REJECTED / CHANGES_REQUESTED)
 (isApproved=true)               (isApproved=false)
 (isPublished=true)              (isPublished=false)
   ↓                                       ↓
USER APP VISIBLE                 EDIT & RESUBMIT BY RESTAURANT
```

## 2. Real Runtime Approval Trace
1. **Submission**:
   - Restaurant submits `Test Cheese Burst Pizza E2E`.
   - Backend sets `approvalStatus: "pending"`, `isApproved: false`, `isPublished: false`.
   - `AuditLog` records `MENU_ITEM_CREATED`.
2. **User App Isolation**:
   - Querying `GET /api/menu/:restaurantId` returns HTTP 200 without the pending item.
3. **Admin Review Page**:
   - `GET /api/admin/menu/pending` returns submitted item.
   - `GET /api/admin/menu/:id` displays complete breakdown: B2C MRP ₹299, B2C Selling ₹249, B2B Selling ₹219, Food Type Veg, Addons `Extra Cheese (+₹30)`.
4. **Admin Approval**:
   - `PUT /api/admin/menu/:id/approve` sets `isApproved: true`, `isPublished: true`, `approvedBy: adminId`, `approvedAt: Date.now()`.
   - `AuditLog` records `MENU_ITEM_APPROVED`.
5. **Public Listing**:
   - Item immediately appears in User App under `Pizza` → `Cheese Pizza` → `The Gourmet Kitchen`.

## 3. Metrics Summary
- **Pending Products**: 0
- **Approved Products**: 1
- **Rejected Products**: 0
- **Approval Flow Test Result**: 100% PASS
