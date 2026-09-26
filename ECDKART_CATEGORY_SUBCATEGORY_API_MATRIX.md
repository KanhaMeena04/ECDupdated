# ECDKART Category & Subcategory API Matrix

## 1. Master Category API Matrix

| Endpoint | Method | Role | Description | Response Data Structure | Status |
|---|---|---|---|---|---|
| `/api/categories/tree` | GET | Public / Restaurant / User | Fetches active 34 Main Categories with 206 nested Subcategories | `{ success: true, count: 34, data: [...] }` | Verified (200 OK) |
| `/api/categories` | GET | Public | Filtered list of categories | `{ success: true, count: N, data: [...] }` | Verified (200 OK) |
| `/api/categories/:id` | GET | Public | Single category details + children | `{ success: true, data: { ... } }` | Verified (200 OK) |
| `/api/categories/:id/subcategories` | GET | Public / Restaurant | Subcategories under parent ID | `{ success: true, count: N, data: [...] }` | Verified (200 OK) |
| `/api/admin/categories` | GET | Admin | Full category master list with subcategory counts | `{ success: true, count: N, categories: [...] }` | Verified (200 OK) |
| `/api/admin/categories` | POST | Admin | Create main or subcategory | `{ success: true, message: "...", data: {...} }` | Verified (201 Created) |
| `/api/admin/categories/:id` | PUT | Admin | Update category name, slug, position, etc. | `{ success: true, data: {...} }` | Verified (200 OK) |
| `/api/admin/categories/:id` | DELETE | Admin | Delete category with product safety guard | `{ success: true, message: "..." }` | Verified (200 OK) |

## 2. Catalog Counts
- **Main Categories**: 34
- **Subcategories**: 206
- **Total Master Catalog Nodes**: 240
