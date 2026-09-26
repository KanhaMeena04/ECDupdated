# ECDKART Dynamic Menu System Audit Report

## 1. System Overview & Architecture
The ECDKART Menu Management and Approval System links MongoDB, ECDbackend, ECDAdmin, Restaurant App, and User App through a centralized Category Master.

```
ADMIN CATEGORY MASTER
        ↓
Main Category (34)
        ↓
Subcategory (206)
        ↓
Restaurant Add Menu Item
        ↓
Item Details & B2C / B2B Pricing
        ↓
Restaurant Submits Item
        ↓
PENDING ADMIN APPROVAL
        ↓
ADMIN REVIEWS (Approve / Reject / Request Changes)
        ↓
PUBLIC MENU API
        ↓
USER APP (B2C & B2B Price Visibility)
```

## 2. Metric Summary (Real MongoDB Audit)
- **Database URI**: `mongodb://127.0.0.1:27017/ecdkart_local_dev`
- **Main Categories in DB**: 34
- **Subcategories in DB**: 206
- **Total Products in DB**: 11
- **Pending Menu Items**: 0
- **Approved Menu Items**: 1
- **Rejected Menu Items**: 0
- **Category Requests**: 0
- **E2E Automated Tests Passed**: 17/17 PASS (100% Success Rate)

## 3. Key Architectural Verification
1. **Single Source of Truth**: The central `Category` collection in MongoDB stores all 34 main categories and 206 subcategories. No hardcoded category arrays exist in Flutter or React UIs.
2. **Category Tree API**: `GET /api/categories/tree` dynamically serves nested active subcategories under main categories.
3. **Category Dependent Dropdowns**: Changing Main Category in Restaurant App automatically resets subcategories and loads valid children from MongoDB.
4. **ID Preservation**: Products store canonical `categoryId` and `subcategoryId` ObjectIds.
5. **Validation Guard**: Backend validates that `subcategoryId` belongs to `categoryId` and rejects invalid combinations with HTTP 400.
6. **Dual B2C/B2B Pricing**: Products store `pricing.b2c.mrp`, `pricing.b2c.sellingPrice`, and `pricing.b2b.sellingPrice`.
7. **Strict Admin Approval Flow**:
   - `DRAFT` / `PENDING_ADMIN_APPROVAL` → Item hidden from User App.
   - `APPROVED` & `PUBLISHED` → Item served on `GET /api/menu/:restaurantId`.
8. **Role-Based Price Filtering**: Normal users receive B2C pricing; authorized B2B users receive B2B pricing.
