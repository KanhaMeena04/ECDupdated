# ECDKART Admin Frontend → ECDbackend Integration Matrix

| Admin Tab | Frontend Page | Current API | ECDbackend API | DB Model | CRUD | Status | Action |
|------------|---------------|-------------|----------------|----------|------|--------|--------|
| Dashboard | Dashboard | `/api/admin/dashboard` | `GET /api/admin/dashboard` | `Order`, `Restaurant`, `User`, `Rider` | READ | CONNECTED | Verified live connection to ECDbackend |
| Order Management | Orders Dashboard | `/api/admin/order-dashboard` | `GET /api/admin/order-dashboard` | `Order` | READ | CONNECTED | Connected to ECDbackend order stats |
| Order Management | New Order | `/api/orders/admin/all?status=placed` | `GET /api/orders/admin/all` | `Order` | READ/UPDATE | CONNECTED | Monitor placed orders |
| Order Management | Processing Order | `/api/orders/admin/all?status=preparing` | `GET /api/orders/admin/all` | `Order` | READ/UPDATE | CONNECTED | Monitor preparing orders |
| Order Management | Pickup Order | `/api/orders/admin/all?status=ready` | `GET /api/orders/admin/all` | `Order` | READ/UPDATE | CONNECTED | Monitor ready orders |
| Order Management | Delivered Order | `/api/orders/admin/all?status=delivered` | `GET /api/orders/admin/all` | `Order` | READ | CONNECTED | Monitor delivered orders |
| Order Management | Cancelled Order | `/api/orders/admin/all?status=cancelled` | `GET /api/orders/admin/all` | `Order` | READ | CONNECTED | Monitor cancelled orders |
| Order Management | Failed Order | `/api/orders/admin/all?status=failed` | `GET /api/orders/admin/all` | `Order` | READ | CONNECTED | Monitor failed orders |
| Order Management | Abandon Cart | `/api/cart/all` | `GET /api/cart/all` | `Cart` | READ | CONNECTED | Monitor carts |
| Order Management | Refund Order | `/api/admin/refunds` | `GET /api/admin/refunds` | `RefundRequest` | READ/UPDATE | CONNECTED | Manage refunds |
| Restaurants | Restaurants List | `/api/restaurants/admin/list` | `GET /api/restaurants/admin/list` | `Restaurant` | READ/DELETE | CONNECTED | Manage all restaurants |
| Restaurants | Active Restaurants List | `/api/restaurants/admin/list/active` | `GET /api/restaurants/admin/list/active` | `Restaurant` | READ | CONNECTED | View active restaurants |
| Restaurants | Admin Create Restaurant | `/api/restaurants/admin/create` | `POST /api/restaurants/admin/create` | `Restaurant`, `User` | CREATE | CONNECTED | Admin restaurant onboarding |
| Restaurants | Pending Restaurants | `/api/restaurants/admin/pending` | `GET /api/restaurants/admin/pending` | `Restaurant` | READ/UPDATE | CONNECTED | Pending approvals |
| Restaurants | Approve Restaurants | `/api/restaurants/admin/approve/:id` | `PUT /api/restaurants/admin/approve/:id` | `Restaurant` | UPDATE | CONNECTED | Approve restaurant application |
| City Management | Add City | `/api/admin/cities` | `POST /api/admin/cities` | `City` | CREATE | CONNECTED | Add new city |
| City Management | City List | `/api/admin/cities` | `GET /api/admin/cities` | `City` | READ/DELETE | CONNECTED | View & delete cities |
| City Management | Zones List | `/api/admin/cities/:cityId/zones` | `GET /api/admin/cities/:cityId/zones` | `City` | READ/CREATE | CONNECTED | View & add zones |
| Vehicle Management | Vehicle List | `/api/admin/vehicles` | `GET /api/admin/vehicles` | `Vehicle` | READ/DELETE | CONNECTED | Rider vehicle types |
| Vehicle Management | Add Vehicle | `/api/admin/vehicles` | `POST /api/admin/vehicles` | `Vehicle` | CREATE | CONNECTED | Add vehicle type |
| Brands | Brand List | `/api/admin/brand` | `GET /api/admin/brand` | `Brand` | READ/DELETE | CONNECTED | Manage restaurant brands |
| Brands | Add Brand | `/api/admin/brand` | `POST /api/admin/brand` | `Brand` | CREATE | CONNECTED | Add brand |
| Driver Management | Driver List | `/api/riders/admin/all` | `GET /api/riders/admin/all` | `Rider`, `User` | READ/DELETE | CONNECTED | Manage riders |
| Driver Management | Admin Add Rider | `/api/riders/admin/create` | `POST /api/riders/admin/create` | `Rider`, `User` | CREATE | CONNECTED | Onboard rider |
| Driver Management | Pending Rider List | `/api/riders/admin/pending` | `GET /api/riders/admin/pending` | `Rider` | READ/UPDATE | CONNECTED | Approve pending riders |
| Document Management | Document List | `/api/admin/document-type` | `GET /api/admin/document-type` | `DocumentType` | READ/DELETE | CONNECTED | Manage KYC document types |
| Cancellation Reasons | Reasons List | `/api/admin/cancellation-reason` | `GET /api/admin/cancellation-reason` | `AdminSetting` | READ/DELETE | CONNECTED | Cancellation reasons |
| Promocodes | Promocode List | `/api/admin/promocode` | `GET /api/admin/promocode` | `Promocode` | READ/DELETE | CONNECTED | View promocodes |
| Promocodes | Add Promocode | `/api/admin/promocode` | `POST /api/admin/promocode` | `Promocode` | CREATE | CONNECTED | Add promocode |
| Restaurant Banner | Banners List | `/api/admin/banner` | `GET /api/admin/banner` | `Banner` | READ/DELETE | CONNECTED | Manage home banners |
| User Management | User Management | `/api/admin/users` | `GET /api/admin/users` | `User` | READ/UPDATE | CONNECTED | Block user / adjust wallet |
| Categories | Category List | `/api/admin/master-category` | `GET /api/admin/master-category` | `MasterCategory` | READ/DELETE | CONNECTED | Master food categories |
| Units | Unit List | `/api/admin/unit` | `GET /api/admin/unit` | `Unit` | READ/DELETE | CONNECTED | Measurement units |
| Tags | Tags List | `/api/admin/tag` | `GET /api/admin/tag` | `Tag` | READ/DELETE | CONNECTED | Food tags |
| Cuisines | Cuisines List | `/api/admin/cuisine` | `GET /api/admin/cuisine` | `Cuisine` | READ/DELETE | CONNECTED | Manage cuisines |
| Addons | Addons List | `/api/admin/addon` | `GET /api/admin/addon` | `Addon` | READ/DELETE | CONNECTED | Global addons |
| Groups | Group List | `/api/admin/groups` | `GET /api/admin/groups` | `Group` | READ/DELETE | CONNECTED | Category groups |
| Filter | Filter Category List | `/api/admin/filters` | `GET /api/admin/filters` | `FilterCategory` | READ/DELETE | CONNECTED | Search filter categories |
| Payout | Financial Overview | `/api/admin/commission-details` | `GET /api/admin/commission-details` | `AdminCommissionWallet` | READ | CONNECTED | Platform commission earnings |
| Payout | Rider Cash & Unfreeze | `/api/payment/admin/rider-cod-summary` | `GET /api/payment/admin/rider-cod-summary` | `RiderWallet` | READ/UPDATE | CONNECTED | Unfreeze rider COD cash |
| Payout | Restaurant Payout | `/api/payment/admin/weekly-payouts` | `GET /api/payment/admin/weekly-payouts` | `RestaurantWallet` | READ/UPDATE | CONNECTED | Process weekly payouts |
| Food Quantity | Food Quantity List | `/api/admin/food-quantities` | `GET /api/admin/food-quantities` | `FoodQuantity` | READ/DELETE | CONNECTED | Food portion sizes |
| Reviews and Ratings | Reviews List | `/api/reviews/admin/all` | `GET /api/reviews/admin/all` | `Review` | READ | CONNECTED | Customer reviews |
| Content Management | User App CMS Tower | `/api/home/admin/home-sections` | `GET /api/home/admin/home-sections` | `HomeScreenSection` | CRUD | CONNECTED | Manage customer home layout |
| Content Management | Catalog & Menu Control | `/catalog/restaurants` | `GET /api/catalog/restaurants` | `Restaurant`, `Category`, `Product` | CRUD | API MISMATCH | Fix prefix to `/api/catalog/restaurants` |
| Content Management | Pricing & Fee Control | `/pricing/config` | `GET /api/pricing/config` | `AdminSetting` | CRUD | API MISMATCH | Fix prefix to `/api/pricing/config` |
| Content Management | Privacy Policy | `/api/cms/privacy-policy` | `GET /api/cms/privacy-policy` | `PrivacyPolicy` | READ/UPDATE | CONNECTED | Manage privacy policy |
| Roles | Role & Staff List | `/api/admin/users?role=staff` | `GET /api/admin/users` | `User` | CRUD | CONNECTED | Manage staff users |
| Reports | Order & Revenue Reports | `/api/admin/reports/revenue` | `GET /api/admin/reports/revenue` | `Order` | READ | CONNECTED | Revenue analytics |
| Settings | General Settings | `/api/admin/settings` | `GET /api/admin/settings` | `AdminSetting` | READ/UPDATE | CONNECTED | App general settings |
