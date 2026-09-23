# ECDKART API Base URL & Connectivity Matrix Audit

## Executive Summary
This document provides the complete API Base URL audit across `/ECDAdmin`, `/User`, `/Restaurant`, `/Rider`, and `ECDbackend`.

---

## 1. Application API Base URL Matrix

| Application | Runtime Platform | Configured Base URL Variable | Target Backend Endpoint | Connection Status | Notes |
| :--- | :--- | :--- | :--- | :-: | :--- |
| **ECDAdmin** | React Web App (`:3000`) | `process.env.REACT_APP_API_BASE_URL` | `http://localhost:5000` | **ALIGNED** | Calls `ECDbackend` REST APIs directly via Axios interceptor. |
| **User App** | Flutter Mobile | `ApiConstants.baseUrl` | `http://10.0.2.2:5000/api` | **ALIGNED** | Targets `10.0.2.2:5000` in Android emulator (`localhost:5000` on web/desktop). |
| **Restaurant App** | Flutter Mobile | `ApiConstants.baseUrl` | `http://10.0.2.2:5000/api` | **ALIGNED** | Targets `10.0.2.2:5000` in Android emulator (`localhost:5000` on web/desktop). |
| **Rider App** | Flutter Mobile | `ApiConstants.baseUrl` / BLoC | `http://10.0.2.2:5000/api` | **ALIGNED** | Targets `10.0.2.2:5000` in Android emulator (`localhost:5000` on web/desktop). |
| **ECDbackend** | Node.js / Express | `PORT=5000` | `http://127.0.0.1:5000` | **ALIGNED** | Single backend source of truth connected to MongoDB local instance. |

---

## 2. Legacy Backend Verification
- **Obsolete Backends**: **0** obsolete backends detected in active codebase paths.
- **Port Conflicts**: **0** port conflicts detected. Port 5000 is exclusively allocated to `ECDbackend`.
- **Hardcoded Mock Routers**: All mock API fallbacks have been replaced with live MongoDB Mongoose model persistence.
