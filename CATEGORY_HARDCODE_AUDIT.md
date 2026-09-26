# Category Hardcode Audit Report

## Overview
This audit examines all repositories in the ECDKART ecosystem (`ECDbackend`, `ECDadmin`, `User`, `Restaurant`, `Rider`) for occurrences of hardcoded food category strings (such as `"Pizza"`, `"Burgers"`, `"Chinese"`, `"Momos"`, `"Biryani"`, `"Veg Pizza"`, etc.).

The objective is to ensure production UI logic dynamically consumes categories from `ECDbackend` (MongoDB source of truth) rather than relying on static, hardcoded arrays.

---

## Audit Findings & Action Items

| File Path | Line / Component | Usage Type | Status | Action Taken / Justification |
| --------- | ---------------- | ---------- | ------ | ---------------------------- |
| `ECDbackend/scripts/seedMasterCategories.js` | Lines 18–380 | Database Seed Catalog | ACCEPTABLE | Idempotent initial seed data definition for MongoDB initialization. |
| `ECDbackend/tests/category_system.test.js` | Lines 50–360 | Unit & E2E Tests | ACCEPTABLE | Test assertions testing API responses against initial master category dataset. |
| `ECDadmin/src/admin/categories/components/CategoryTable.jsx` | Full File | Admin UI | CLEAN | Category lists and parent dropdowns loaded dynamically via `useMasterCategory` hook from API. |
| `User/lib/pages/category_selection/food_preferences_page.dart` | Lines 40–100 | Food Preferences UI | FIXED | Replaced static `_categoryItems` array with dynamic API calls via `CategoryService.getCategoryTree()`. |
| `User/lib/services/category_service.dart` | Full File | Service & Cache | CLEAN | Fetches `/api/categories/tree` dynamically and caches tree models locally. |
| `Restaurant/lib/screens/menu_management_screen.dart` | Lines 728–745 | Menu Form Dropdowns | FIXED | Removed static `_categories` and `_subcategoriesMap` arrays; now dynamically populates dropdowns via `CategoryApiService`. |
| `Restaurant/lib/services/category_api_service.dart` | Full File | API Service | CLEAN | Fetches dynamic categories and subcategories from ECDbackend REST endpoints. |
| `Rider/lib/...` | All files | Rider Delivery App | CLEAN | Verified: No category logic or business category data referenced. |

---

## Verification Conclusion
All hardcoded production UI category arrays have been successfully audited and refactored. Both the User App and Restaurant App fetch categories dynamically from the single canonical database source of truth (`ECDbackend` + `MongoDB`).
