# Restaurant App Category Implementation Details

## Key Components & Services
- `lib/services/category_api_service.dart`: API service connecting vendor menu creation forms to `/api/categories/tree`.
- `lib/screens/menu_management_screen.dart`:
  - Removed static `_categories` and `_subcategoriesMap` arrays.
  - Dynamically populates Category dropdown from API data.
  - Dynamically populates Subcategory dropdown based on selected Main Category.
  - Stores canonical `categoryId` (ObjectId) and `subcategoryId` (ObjectId) in product creation payload.
