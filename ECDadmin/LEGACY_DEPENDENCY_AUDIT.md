# LEGACY DEPENDENCY AUDIT REPORT — ECDadmin

This audit traces all references to legacy admin backends, old ports, hardcoded URLs, or direct database connections in `ECDadmin`.

## 1. Environment & API Base URL Configuration

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\.env.development.local`](file:///c:/Kanha/ECDUpdt/ECDadmin/.env.development.local#L2)
  - **Usage**: `REACT_APP_API_BASE_URL=http://localhost:5000`
  - **Audit**: Points directly to ECDbackend running locally on Port 5000. No legacy backend URLs present.

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\src\utils\utils.js`](file:///c:/Kanha/ECDUpdt/ECDadmin/src/utils/utils.js#L1-L2)
  - **Usage**: `const rawUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";`
  - **Audit**: Correctly targets `http://localhost:5000`. Strips trailing `/api/` if present.

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\src\utils\api.js`](file:///c:/Kanha/ECDUpdt/ECDadmin/src/utils/api.js#L4-L20)
  - **Usage**: `baseURL: API_BASE_URL` with JWT `Authorization: Bearer <token>` interceptor.
  - **Audit**: Requires `/api` prefix standardization for relative requests (e.g. `/api/catalog/...` instead of `/catalog/...`).

## 2. Unused / Legacy References in Codebase

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\src\admin\api\auth.js`](file:///c:/Kanha/ECDUpdt/ECDadmin/src/admin/api/auth.js#L76)
  - **Usage**: `'Authorization': 'Bearer YOUR_AUTH_TOKEN'` placeholder in `useChangePassword`.
  - **Replacement**: Use `api.js` instance or attach real JWT token from `localStorage.getItem("token")`.
  - **Status**: MIGRATING TO ECDBACKEND JWT.

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\src\admin\api\restaurant.js`](file:///c:/Kanha/ECDUpdt/ECDadmin/src/admin/api/restaurant.js#L380)
  - **Usage**: Typo in string interpolation `${API_BASE_URL}api/restaurants/admin/create` (missing slash `/`).
  - **Replacement**: `${API_BASE_URL}/api/restaurants/admin/create`.
  - **Status**: TO BE FIXED.

- **File**: [`c:\Kanha\ECDUpdt\ECDadmin\src\admin\components\MenuContent.tsx`](file:///c:/Kanha/ECDUpdt/ECDadmin/src/admin/components/MenuContent.tsx)
  - **Usage**: Hardcoded link to legacy Vercel demo URL `'https://demo-foodpanda-admin-panel.vercel.app'` in CORS origins in `ECDbackend/Server.js`.
  - **Audit**: Localhost origins (`http://localhost:3000`, `http://localhost:5000`) are present and permitted in `Server.js`.

## 3. Database & Backend Source of Truth Audit

- **Runtime Backend**: `ECDbackend` (`Node.js/Express` on `http://localhost:5000`)
- **Database**: MongoDB (`ECDKART` database)
- **Direct DB Access in Admin**: NONE. All requests go through REST APIs with JWT authentication.
- **Legacy Admin Backend**: NONE active in runtime.

## 4. Required Migration Steps

1. Standardize `api.js` base URL to include `/api` or update relative calls in `CatalogMasterControl.jsx` and `PricingControlTower.jsx` to prepend `/api`.
2. Ensure login flow persists `token` in `localStorage` so protected requests pass `Authorization: Bearer <token>` to ECDbackend middleware.
3. Fix minor string concatenation typos in `restaurant.js`.
