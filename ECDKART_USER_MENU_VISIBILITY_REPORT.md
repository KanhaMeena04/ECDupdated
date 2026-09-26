# ECDKART User Menu Visibility Report

## 1. User App Menu Visibility Rules
For a menu item to be visible in the User App, ALL of the following criteria MUST be true simultaneously:

```
                  ┌────────────────────────────────────────────────────────┐
                  │              USER APP VISIBILITY CRITERIA              │
                  ├────────────────────────────────────────────────────────┤
                  │ 1. product.isApproved === true                         │
                  │ 2. product.isPublished === true                        │
                  │ 3. product.isRejected !== true                         │
                  │ 4. product.available === true                          │
                  │ 5. product.outOfStock !== true                         │
                  │ 6. restaurant.restaurantApproved === true              │
                  │ 7. restaurant.isActive === true                        │
                  │ 8. restaurant.menuApproved === true                    │
                  │ 9. category.isActive === true                          │
                  │ 10. category.userAppVisible === true                   │
                  │ 11. subcategory.isActive === true (if set)             │
                  │ 12. subcategory.userAppVisible === true (if set)       │
                  └────────────────────────────────────────────────────────┘
```

## 2. B2C vs. B2B Pricing Visibility
- **B2C Customer**:
  - Receives `pricing.b2c.sellingPrice` and `pricing.b2c.mrp`.
  - `pricing.b2b` object is stripped by backend before sending response.
- **Authorized B2B / Corporate User**:
  - Determined securely server-side based on `req.user.userType === 'b2b' || req.user.userType === 'corporate' || req.user.role === 'b2b'`.
  - Client parameter manipulation (e.g. `?priceType=b2b`) is ignored.
  - Receives `pricing.b2b.sellingPrice` (e.g., ₹219 vs ₹249).

## 3. Empirical Verification Results
- **Unapproved / Pending Item**: 0% User App visibility (Blocked by backend controller).
- **Approved & Published Item**: 100% User App visibility under correct Main Category & Subcategory.
- **B2C User Response**: B2C Price ₹249 displayed.
- **Authorized B2B Response**: B2B Price ₹219 displayed.
- **Status**: Verified PASS on local MongoDB `ecdkart_local_dev`.
