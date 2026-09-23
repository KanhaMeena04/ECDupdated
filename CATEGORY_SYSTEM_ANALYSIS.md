# Category System Architecture Analysis

## 1. System Overview
The ECDKART ecosystem relies on a single canonical source of truth (`ECDbackend` + `MongoDB`) for category and subcategory management. 

### Unified Architecture Flow:
```
ECDadmin Panel (React)
       │
       ▼
ECDbackend REST API (/api/categories & /api/admin/categories)
       │
       ▼
MongoDB Database (ecdkart_local_dev -> categories collection)
       ▲
 ┌─────┴─────────────────────────┐
 │                               │
User Customer App (Flutter)    Restaurant Vendor App (Flutter)
```

## 2. Key Architecture Decisions
1. **Single Model Alignment**: Unified legacy `MasterCategory` and `Category` into a single canonical `Category` model storing both main categories (`type: "main"`, `parentCategoryId: null`) and subcategories (`type: "subcategory"`, `parentCategoryId: ObjectId`).
2. **Dynamic Frontend Consumption**: Both Flutter applications (`User` and `Restaurant`) dynamically consume categories from `/api/categories/tree`. No hardcoded category business data remains in production UI logic.
3. **Delete Safety**: Categories cannot be deleted if referenced by any active product. Deactivation and visibility toggles provide safe management.
4. **Idempotent Seeding & Migration**: 34 main categories and 206 subcategories were seeded idempotently. Existing products were migrated safely without data loss.
