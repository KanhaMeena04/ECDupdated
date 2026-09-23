# User App Category Implementation Details

## Key Components & Services
- `lib/services/category_service.dart`: HTTP service and cache provider fetching category tree from `/api/categories/tree`.
- `lib/pages/category_selection/food_preferences_page.dart`: Removed hardcoded `_categoryItems` static const array. Now dynamically loads category preferences from backend API via `CategoryService`.
- **Caching Mechanism**: API responses are cached locally in-memory. If network is offline, cached categories are returned. No hardcoded fallback business categories are used.
