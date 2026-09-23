# ECDKART Production Risk Register

## Executive Overview

This document synthesizes all identified technical, operational, database, and security risks associated with transitioning **ECDKART** from local development (`mongodb://127.0.0.1:27017/ecdkart_local_dev`) to client production hosting and database infrastructure.

---

## Risk Heatmap & Matrix

| Risk ID | Category | Risk Description | Severity | Impact | Mitigation Strategy |
|---|---|---|---|---|---|
| **RISK-01** | Database | **Standalone Mongo vs Atlas ReplicaSet Transactions**<br>`mongoose.startSession()` & `startTransaction()` cause 500 errors on standalone local Mongo if unsupported. | **HIGH** | High | Resolved in `restaurantController.js` by checking connection topology (`isReplicaSet`) before initializing transaction sessions. |
| **RISK-02** | Database | **Unintentional Data Overwrite via Auto-Seed**<br>`db.js` auto-triggers `seedEcdkartData.js` if `Restaurant.countDocuments() === 0`. | **CRITICAL** | Critical | Guard startup seeding in `db.js` with `if (process.env.NODE_ENV === 'production') return;`. |
| **RISK-03** | Security | **Default Admin Credential Overwrite**<br>`ensureAdminUser()` resets `admin@gmail.com` password to `admin123` on startup. | **CRITICAL** | High | Disable `ensureAdminUser()` auto-reset when `NODE_ENV === 'production'`. |
| **RISK-04** | Security | **Hardcoded Test OTP Bypass (`123456`)**<br>`vendorVerifyOtp` accepts `123456` regardless of user state. | **HIGH** | High | Require real Twilio OTP verification when `NODE_ENV === 'production'`. |
| **RISK-05** | Performance | **Missing 2dsphere Indexes on Atlas**<br>Missing `location.coordinates_2dsphere` causes Mongo query failure on `$near` / `$geoWithin`. | **HIGH** | High | Run schema index initialization script on client DB prior to backend startup. |
| **RISK-06** | Integration | **Unconfigured FCM Service Account Key**<br>Missing `config/serviceAccountKey.json` disables push notifications. | **MEDIUM** | Medium | Provision client's Firebase Admin SDK key in server environment prior to deployment. |
| **RISK-07** | Integration | **Third-Party Payment Gateways Unconfigured**<br>Stripe and Razorpay live keys missing from `.env`. | **HIGH** | High | Acquire live merchant keys from client for Stripe and Razorpay. |
| **RISK-08** | Network | **Socket.IO CORS & SSL Mismatch**<br>Frontends configured with HTTP/WS instead of HTTPS/WSS. | **HIGH** | High | Enforce HTTPS and WSS endpoints across all mobile app `app_constants.dart` and web `api.js`. |
