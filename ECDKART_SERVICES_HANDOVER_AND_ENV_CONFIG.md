# ECDKart Services & Account Handover Documentation

## 1. Third-Party Services Account Handover

During the development of the application, third-party services were configured and activated using the client-provided primary email account:

- **Primary Email Account**: `ecdkartdatabase@gmail.com`

### Services Account Access Details
- **MongoDB Atlas**: Used for database management and application data storage (`ECD-Cluster`).
- **Firebase Console**: Used for push notifications (FCM), analytics, and crash reporting.
- **ImageKit.io**: Used for media storage, image optimization, and CDN delivery (`https://ik.imagekit.io/ECDKART`).

> [!NOTE]
> These services were configured directly using the client email account mechanism. No separate third-party credentials were created by our team. Ownership and management of all associated accounts reside with the client. We recommend reviewing account security settings upon project handover.

---

## 2. Comprehensive Service Inventory

| Service | Category | Purpose / Usage in ECDKart |
|---|---|---|
| **MongoDB** | Database & Storage | Primary database for managing Users, Restaurants, Products, Categories, Orders, Riders, and Payment status. |
| **Firebase Cloud Messaging (FCM)** | Communications | Push notification management for real-time order updates and delivery alerts across User, Restaurant, and Rider apps. |
| **Firebase Crashlytics** | Diagnostics | Real-time crash reporting and performance monitoring to ensure application stability. |
| **Firebase Analytics** | Analytics | Collection and analysis of user interaction data to optimize user experience. |
| **Cloudflare** | Infrastructure | DNS management, domain security, SSL, and DDoS traffic protection for backend API endpoints. |
| **Reseller VPS - KYC Adhaar** | Hosting | Primary VPS hosting and deployment platform for ECDKart Node.js backend servers. |
| **ImageKit.io** | Media Storage | Cloud media storage and image optimization for food items, restaurant banners, and rider KYC identity documents. |
| **Google Maps Platform** | Location & Geofencing | Location services, real-time navigation, distance calculations, and delivery tracking. |
| **Razorpay** | Payments | Online payment gateway processing for UPI, credit/debit cards, and digital wallets. |
| **TwoFactor (2Factor.in)** | Authentication | SMS OTP services for secure mobile number verification, user login, and handover authentication. |
| **Socket.IO** | Real-time Communication | Low-latency WebSocket communication for live order state transitions and real-time rider tracking. |
| **JWT (JSON Web Token)** | Security | Stateless authentication and RBAC authorization protocol between client apps and backend server. |
| **Google Cloud Platform** | Cloud Services | Integrated cloud infrastructure supporting Google Maps APIs and Firebase service accounts. |

---

## 3. Infrastructure Summary

- **Database & Storage**: MongoDB serves as the central database repository, while ImageKit.io handles media delivery and CDN optimization.
- **Communications**: Socket.IO handles live WebSocket updates; Firebase Cloud Messaging handles background push notifications.
- **Security & Identity**: JWT enforces secure API authorization; TwoFactor manages mobile SMS OTP verification.
- **Logistics & Payments**: Google Maps Platform powers location calculation; Razorpay manages payment transactions.
- **Hosting & DNS**: VPS manages backend execution; Cloudflare secures DNS traffic (`api.ecdkart.co.in`, `admin.ecdkart.co.in`).

---

## 4. Production Environment Configuration

### Backend Production Environment Variables (`ECDbackend/.env.production`)

```env
NODE_ENV=production
PORT=5000

# Database Configuration
MONGO_URI=mongodb+srv://ecdkartdatabase_db_user:96oxjzGOXBVtCMMi@ecdcluster.kgowkum.mongodb.net/test?retryWrites=true&w=majority&appName=ECD-Cluster

# JWT Configuration
JWT_ACCESS_SECRET=aKiuLfDr5Nrae7VjN4LYvY5V26JIMoBwrz7mMnG3cNwb-oSFu1hcvgCKWuNXYaUXJtOUF0sjVZjUYBTcJc7HVQ
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_SECRET=XHhoZGcA7h46R0cRTZM4BQxTYVEkkDF3G809Rhph2MvzGF0YO3fJvy3XakC6BI_DaT_tOuQZGfmBzz8VHZEBBw
JWT_REFRESH_EXPIRES_IN=90d
JWT_SECRET=aKiuLfDr5Nrae7VjN4LYvY5V26JIMoBwrz7mMnG3cNwb-oSFu1hcvgCKWuNXYaUXJtOUF0sjVZjUYBTcJc7HVQ

# Frontend Configuration
FRONTEND_ORIGIN=https://admin.ecdkart.co.in

# API Base Path
BASE_PATH=/api/v1

# Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_SoUrOmQ6Rc5zI4
RAZORPAY_KEY_SECRET=wp4TSQ3sphSO0smdNxyNMIyj
RAZORPAY_WEBHOOK_SECRET=
PAYMENT_TIMEOUT_MINUTES=15
COD_MAX_AMOUNT=5000

# Platform Reference ID
PLATFORM_REF_ID=000000000000000000000000

# 2Factor API Configuration
TWO_FACTOR_API_KEY=02532f33-4cfd-11f1-9800-0200cd936042

# ImageKit API Configuration
IMAGEKIT_PUBLIC_KEY=public_bndzwvE17qu6mX6x96Ak/PhnGY0=
IMAGEKIT_PRIVATE_KEY=private_/hx/a+OvHSDm7BzeueSyvAmZljY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ECDKART

# Internal Admin API Key
ADMIN_API_KEY=ecd_admin_super_secret_2026

# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"ecdkart-24dbe","private_key_id":"your_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_FIREBASE_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk@ecdkart-24dbe.iam.gserviceaccount.com"}'
```

### Admin Web Frontend Environment Variables (`ECDadmin/.env.production`)

```env
VITE_API_URL=https://api.ecdkart.co.in/api/v1
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU
```
