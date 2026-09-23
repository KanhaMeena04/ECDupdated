# ECDKART Production Environment & Configuration Checklist

## Executive Summary

This document details all required environment variable changes, security credentials, API base URLs, CORS configurations, and third-party integrations required when transitioning **ECDbackend** and frontends (`ECDAdmin`, `User`, `Restaurant`, `Rider`) from local development to production.

---

## 1. Environment Variable Audit & Diff Matrix

| Variable Name | Local Value (Current) | Required Production Value | Mandate / Impact |
|---|---|---|---|
| `PORT` | `5000` | `5000` (or `process.env.PORT` provided by host) | Server binding port |
| `NODE_ENV` | `development` | `production` | Enables production error handler, secure cookie flags, and disables verbose debug logs |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/ecdkart_local_dev` | `mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority` | Connects backend to Client Atlas Database |
| `JWT_SECRET` | `ecd_local_dev_jwt_secret_key_2026` | High-entropy 256-bit random string | Secures JWT token signatures for all user roles |
| `STRIPE_SECRET_KEY` | Placeholder (`sk_test_placeholder`) | Production Stripe Secret Key (`sk_live_...`) | Processes online card payments |
| `RAZORPAY_KEY_ID` | `rzp_test_placeholder` | Live Razorpay Key ID (`rzp_live_...`) | Processes Razorpay UPI/Card payments |
| `RAZORPAY_KEY_SECRET` | `placeholder_secret` | Live Razorpay Key Secret | Signs Razorpay payment webhook signatures |
| `TWILIO_ACCOUNT_SID` | Empty / Placeholder | Live Twilio Account SID | Sends real SMS OTPs to customer and vendor phones |
| `TWILIO_AUTH_TOKEN` | Empty / Placeholder | Live Twilio Auth Token | Twilio SMS API Authentication |
| `TWILIO_PHONE_NUMBER` | Empty / Placeholder | Registered E.164 Twilio Phone Number | Sender ID for Twilio SMS |
| `FIREBASE_SERVICE_ACCOUNT` | Missing (`config/serviceAccountKey.json`) | Valid Firebase Admin SDK Service Account JSON | Enables FCM Push Notifications for Order updates |
| `FRONTEND_URL` / `CORS_ORIGIN` | `*` / `http://localhost:*` | Exact Production Domain List (e.g., `https://admin.ecdkart.com`) | Restricts CORS access to trusted web domains |

---

## 2. Application API Base URL Configuration

All four client applications must be updated to target the production HTTPS backend domain:

| Application | Local Base URL | Required Production Base URL | Configuration File Location |
|---|---|---|---|
| **ECDAdmin** | `http://127.0.0.1:5000/api` | `https://api.ecdkart.com/api` | `ECDAdmin/src/config/api.js` |
| **User App** | `http://127.0.0.1:5000/api` | `https://api.ecdkart.com/api` | `User/lib/core/constants/app_constants.dart` |
| **Restaurant App** | `http://127.0.0.1:5000/api` | `https://api.ecdkart.com/api` | `Restaurant/lib/api_constants.dart` |
| **Rider App** | `http://127.0.0.1:5000/api` | `https://api.ecdkart.com/api` | `Rider/lib/core/constants/api_constansts.dart` |

---

## 3. Security & Infrastructure Verification

> [!CAUTION]
> **Production Security Hardening Required:**
> 1. **SSL/TLS Termination:** `ECDbackend` MUST run behind an NGINX or Cloudflare reverse proxy with valid HTTPS certificates (Let's Encrypt / Cloudflare SSL).
> 2. **WSS (WebSockets over SSL):** Socket.IO clients in User, Restaurant, and Rider apps must connect using `wss://api.ecdkart.com`.
> 3. **Firebase FCM Key Security:** `serviceAccountKey.json` MUST be stored in `ECDbackend/config/serviceAccountKey.json` and MUST NOT be committed to git.
> 4. **Rate Limiting:** Ensure Express Rate Limit middleware is enabled on `/api/auth/send-otp` and `/api/auth/login`.
