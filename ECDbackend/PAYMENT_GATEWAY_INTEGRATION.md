# Payment Gateway Integration Documentation

**Version:** 1.0  
**Last Updated:** March 29, 2026  
**Status:** ⚠️ REQUIRES CRITICAL FIXES BEFORE PRODUCTION  
**Payment Gateway:** Stripe (Live Mode)  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [API Endpoints](#api-endpoints)
7. [Payment Flow](#payment-flow)
8. [Webhook Handling](#webhook-handling)
9. [Security Measures](#security-measures)
10. [Error Handling](#error-handling)
11. [Testing Guide](#testing-guide)
12. [Common Issues & Fixes](#common-issues--fixes)
13. [Production Checklist](#production-checklist)

---

## Overview

This documentation covers the complete Stripe payment gateway integration for a food delivery platform. The system supports three payment methods:

1. **Online Payment** (Stripe) - Credit/Debit cards, SEPA, Klarna
2. **Wallet Payment** - Pre-loaded customer wallet
3. **Cash on Delivery (COD)** - Pay when order is delivered

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/React Native)            │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  Checkout Screen     │  │  Payment Methods     │             │
│  │  - Stripe.js         │  │  - Online            │             │
│  │  - PaymentElement    │  │  - Wallet            │             │
│  │  - Address Select    │  │  - COD               │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                    │                      │                     │
│                    └──────────┬───────────┘                     │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ POST /api/orders/place-order                         │      │
│  │ - Calculate bill                                     │      │
│  │ - Create Order document                              │      │
│  │ - Deduct wallet (if wallet payment)                  │      │
│  │ - Return orderId                                     │      │
│  └──────────────────────────────────────────────────────┘      │
│                         │                                       │
│  ┌──────────────────────┼──────────────────────┐               │
│  │                      │                      │                │
│  ▼                      ▼                      ▼                │
│                                                                  │
│  Online Payment:       Wallet:                COD:              │
│  POST /api/payment/    Already Deducted      Order Placed      │
│  create-payment-intent Order → placed        Order → placed     │
│         │              status=placed         status=placed      │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────┐       │
│  │ Payment Intent Creation                            │       │
│  │ - Create payment_intent at Stripe                  │       │
│  │ - Return clientSecret                              │       │
│  │ - Update Order with stripePaymentIntentId          │       │
│  └──────┬───────────────────────────────────────────────┘     │
│         │ clientSecret                                         │
│         └─────────────────► Response to Frontend               │
│                                                                  │
│  POST /api/payment/webhook (Stripe → Backend)                  │
│  - Signature Verification                                      │
│  - Event Processing:                                           │
│    • checkout.session.completed → Payment Success             │
│    • payment_intent.succeeded → Payment Success               │
│    • payment_intent.payment_failed → Payment Failure          │
│  - Update Order Status                                         │
│  - Notify Restaurant/Customer                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                             │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ Order Document       │  │ PaymentTransaction   │             │
│  │ - totalAmount        │  │ - type: online_pay   │             │
│  │ - paymentStatus      │  │ - amount             │             │
│  │ - paymentMethod      │  │ - status: completed  │             │
│  │ - transactionId      │  │ - breakdown          │             │
│  │ - status: "placed"   │  └──────────────────────┘             │
│  └──────────────────────┘                                       │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ ProcessedWebhook     │  │ WalletTransaction    │             │
│  │ - stripeEventId      │  │ - type: debit/credit │             │
│  │ - eventType          │  │ - amount             │             │
│  │ - processedAt        │  │ - status: completed  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stripe API                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Payment Intents                                      │       │
│  │ - Create payment_intent                              │       │
│  │ - Process payment                                    │       │
│  │ - Request retries on decline                         │       │
│  │ - Trigger webhook on completion                      │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Webhooks                                             │       │
│  │ - Event: checkout.session.completed                  │       │
│  │ - Event: payment_intent.succeeded                    │       │
│  │ - Event: payment_intent.payment_failed               │       │
│  │ - Event: charge.refunded (for manual refunds)        │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | 16.x / 18.x |
| **Framework** | Express.js | 4.x |
| **Database** | MongoDB | 4.4+ |
| **Payment Gateway** | Stripe | 2024-06-20 API |
| **Authentication** | JWT | - |
| **Real-time Communication** | Socket.io | 4.x |
| **SMS** | Twilio | - |
| **Logging** | Winston | 3.x |
| **Validation** | express-validator | 7.x |
| **Rate Limiting** | express-rate-limit | 6.x |

---

## Setup Instructions

### 1. Prerequisites

```bash
# Node.js 16+
node --version

# npm or yarn
npm --version

# MongoDB running
mongosh --version

# Stripe account (https://stripe.com)
```

### 2. Clone and Install

```bash
git clone <repo-url>
cd Backend
npm install
```

### 3. Configure Environment Variables

Create `.env` file (**.gitignore this file!**):

```bash
cp .env.example .env
```

Populate with values (see [Environment Variables](#environment-variables)).

### 4. Run Database Migrations

```bash
# Already integrated in schema, but verify MongoDB connection
node scripts/verify-db.js
```

### 5. Start Development Server

```bash
# Set environment
export NODE_ENV=development

# Start server
npm start

# Server runs on http://localhost:5000
```

### 6. Test Stripe Connection

```bash
curl -X GET http://localhost:5000/api/payment/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "status": "healthy",
  "stripe": "connected",
  "lastWebhook": "2026-03-29T10:30:00Z"
}
```

### 7. Set Up Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Settings → Webhooks
3. Add Endpoint:
   - **URL:** `https://yourdomain.com/api/payment/webhook`
   - **Events:** Select all payment events
4. Copy Webhook Secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

### Critical Secrets

```env
# ⚠️ NEVER COMMIT THESE TO GIT!

# Stripe Live Keys (Replace with YOUR keys)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Frontend
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### Optional Services

```env
# Cloudinary (Media Storage)
CLOUDINARY_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Twilio (SMS/OTP)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_SERVICE_SID=VAxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password
EMAIL_FROM="Food Delivery App <noreply@foodie.com>"
```

### Environment-Specific

```env
# Development
NODE_ENV=development
PORT=5000

# Staging / Production
NODE_ENV=production
PORT=5000
```

---

## API Endpoints

### 1. Create Order with Online Payment

**Endpoint:** `POST /api/orders/place-order`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "addressId": "507f1f77bcf86cd799439011",
  "paymentMethod": "online",
  "paymentId": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created. Complete payment to confirm.",
  "orderId": "507f1f77bcf86cd799439012",
  "totalPayment": 500.50,
  "order": {
    "_id": "507f1f77bcf86cd799439012",
    "customer": "507f1f77bcf86cd799439010",
    "restaurant": "507f1f77bcf86cd799439009",
    "paymentStatus": "pending",
    "status": "pending",
    "totalAmount": 500.50,
    "paymentMethod": "online"
  },
  "requiresPayment": true
}
```

**Status Codes:**
- `201` - Order created successfully
- `400` - Invalid input (empty cart, invalid payment method)
- `401` - Unauthorized
- `404` - Restaurant/user not found

---

### 2. Create Payment Intent (Mobile)

**Endpoint:** `POST /api/payment/create-payment-intent`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "507f1f77bcf86cd799439012",
  "paymentIntentId": "pi_1234567890abcdef",
  "clientSecret": "pi_1234567890abcdef_secret_xxxxxxxxxxxx",
  "publishableKey": "pk_live_xxxxxxxxxxxx",
  "currency": "eur",
  "amount": 50050
}
```

**Usage (Frontend):**
```javascript
// React Native / React
import { StripeSDK } from '@stripe/stripe-react-native';

const result = await initPaymentSheet({
  paymentIntentClientSecret: clientSecret,
  merchantDisplayName: 'Food Delivery App'
});

if (result.error) {
  // Handle error
} else {
  const paymentResult = await presentPaymentSheet();
  if (paymentResult.error) {
    // Payment failed
  } else {
    // Payment succeeded - webhook will update order
  }
}
```

---

### 3. Create Checkout Session (Web)

**Endpoint:** `POST /api/payment/create-checkout-session`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439012",
  "successUrl": "https://yourapp.com/payment-success?order_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourapp.com/payment-cancel?order_id={CHECKOUT_SESSION_ID}"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_1234567890abcdef",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890abcdef"
}
```

**Usage (Frontend):**
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(publishableKey);

const response = await fetch('/api/payment/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId })
});

const { sessionId } = await response.json();
const result = await stripe.redirectToCheckout({ sessionId });
```

---

### 4. Stripe Webhook Endpoint

**Endpoint:** `POST /api/payment/webhook`

**Authentication:** None (but signature-verified)

**Note:** This is called by Stripe, not by frontend.

**Handled Events:**
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Session expired
- `checkout.session.async_payment_failed` - Payment failed
- `payment_intent.succeeded` - Mobile payment succeeded
- `payment_intent.payment_failed` - Mobile payment failed
- `payment_intent.canceled` - Payment intent canceled

---

### 5. Get Payment Health

**Endpoint:** `GET /api/payment/health`

**Authentication:** Optional

**Response:**
```json
{
  "status": "healthy",
  "stripe": "connected",
  "lastWebhook": "2026-03-29T10:30:00Z"
}
```

**Status Codes:**
- `200` - Healthy
- `503` - Degraded/Down

---

## Payment Flow

### Scenario 1: Online Payment (Checkout Session)

```
1. Frontend → Backend: POST /api/orders/place-order
   ├─ Calculate bill
   ├─ Create Order (status="pending", paymentStatus="pending")
   ├─ Return orderId, requiresPayment=true
   
2. Frontend shows Stripe Checkout Page
   
3. Customer enters card details and clicks "Pay"
   
4. Stripe processes payment
   
5. Stripe → Backend: POST /api/payment/webhook (checkout.session.completed)
   ├─ Verify webhook signature
   ├─ Check if already processed (idempotency)
   ├─ Find Order by orderId
   ├─ Update Order (paymentStatus="paid", status="placed")
   ├─ Send notification to restaurant
   ├─ Emit socket event to customer
   ├─ Delete cart
   ├─ Mark webhook as processed
   ├─ Return 200 OK
   
6. Frontend polls GET /api/orders/{orderId}
   ├─ See status="placed", paymentStatus="paid"
   ├─ Show "Order confirmed!" message
```

### Scenario 2: Mobile Payment (Payment Intent)

```
1. Frontend → Backend: POST /api/payment/create-payment-intent
   ├─ Validate order ownership
   ├─ Check payment status (not already paid)
   ├─ Create payment_intent at Stripe
   ├─ Return clientSecret
   
2. Frontend uses Stripe SDK to collect payment (in-app)
   ├─ useStripePaymentForm or PaymentElement
   
3. Frontend confirms payment with clientSecret
   ├─ Stripe collects payment in-app
   
4. Stripe → Backend: POST /api/payment/webhook (payment_intent.succeeded)
   ├─ Same as Scenario 1 (steps 5-6)
```

### Scenario 3: Wallet Payment

```
1. Frontend → Backend: POST /api/orders/place-order
   ├─ paymentMethod = "wallet"
   ├─ Check wallet balance
   ├─ Deduct wallet (in transaction)
   ├─ Create WalletTransaction (type="debit")
   ├─ Create Order (paymentStatus="paid", status="placed")
   ├─ Return order
   
2. No Stripe interaction
   
3. Backend sends notifications (same as online)
```

### Scenario 4: Cash on Delivery

```
1. Frontend → Backend: POST /api/orders/place-order
   ├─ paymentMethod = "cod"
   ├─ Create Order (paymentStatus="pending", status="placed")
   ├─ No payment processing
   
2. Order goes to restaurant → rider → delivery
   
3. Rider collects cash from customer
   
4. Rider → Backend: POST /api/payment/confirm-cod-collection?orderId=X
   ├─ Process COD collection
   ├─ Update rider wallet (add cash)
   ├─ Update restaurant wallet (deduct commission)
   ├─ Create PaymentTransaction (type="cod_collected")
```

---

## Webhook Handling

### Webhook Processing Flow

```
1. Stripe sends POST /api/payment/webhook
   ├─ Contains: event type, payment intent details, metadata
   
2. Backend validates signature
   ├─ stripe.webhooks.constructEvent(body, sig, secret)
   ├─ Ensures request is from Stripe
   
3. Check idempotency
   ├─ Query ProcessedWebhook collection
   ├─ If already processed, return 200 (skip)
   
4. Process event based on type
   ├─ checkout.session.completed → handlePaymentSuccess
   ├─ payment_intent.succeeded → handlePaymentIntentSuccess
   ├─ payment_intent.payment_failed → handlePaymentIntentFailure
   
5. Update database
   ├─ Find Order by orderId
   ├─ Update paymentStatus, status
   ├─ Add timeline entry
   
6. Send notifications
   ├─ Socket.io to customer/restaurant
   ├─ Database notification record
   
7. Record webhook processing
   ├─ Store in ProcessedWebhook
   ├─ Mark as "success"
   
8. Return 200 OK to Stripe
```

### Webhook Event Types

| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | Customer completes checkout | Mark order as "placed" |
| `checkout.session.expired` | Checkout link expires after 24h | Mark order as "failed" |
| `checkout.session.async_payment_failed` | Async payment (3D Secure) failed | Mark order as "failed" |
| `payment_intent.succeeded` | Mobile payment succeeds | Mark order as "placed" |
| `payment_intent.payment_failed` | Payment explicitly fails | Mark order as "failed" |
| `payment_intent.canceled` | Customer cancels intent | Mark order as "failed" |

### Webhook Retry Logic

Stripe retries failed webhooks with exponential backoff:
- 1st: Immediate
- 2nd: 5 seconds
- 3rd: 5 minutes
- 4th: 30 minutes
- 5th: 2 hours
- 6th+: Every 1 hour for 24 hours

**Our System:**
- Returns 200 on all requests (to stop retries)
- Stores failed webhooks in `FailedWebhook` collection
- Manual retry via admin panel
- Cron job checks for stale payments

---

## Security Measures

### 1. Stripe Keys Management

✅ **What We Do:**
- Secret key stored in environment variables (not in code)
- Publishable key added to frontend config

❌ **What's Missing:**
- Secrets manager (AWS Secrets Manager / HashiCorp Vault)
- Automatic key rotation

### 2. Webhook Signature Verification

```javascript
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
    req.body,       // Raw body
    sig,            // Signature from header
    webhookSecret   // Our webhook secret
);
```

✅ Ensures webhook is from Stripe

### 3. HTTPS Enforcement

Required to be added:
```javascript
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.status(403).json({ message: 'HTTPS required' });
    }
    next();
});
```

### 4. Authorization Checks

```javascript
if (order.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false });
}
```

✅ Users can only pay for their own orders

### 5. Idempotency

✅ ProcessedWebhook collection prevents double-processing

❌ Missing: Request-level idempotency on payment initiation

### 6. Rate Limiting

❌ Missing: Payment endpoints need rate limits
```javascript
const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5, // 5 attempts per 5 minutes
});
```

### 7. PCI Compliance

✅ Never store card numbers (Stripe handles this)
✅ Use secure checkout forms (Stripe.js)

❌ Missing:
- Encryption at rest for order data
- Field-level encryption for amounts
- Audit logging for sensitive operations
- Access control logs

### 8. Data Sensitivity

Never log:
- Full card numbers
- CVV/CVC codes
- Bank account details
- Full customer SSN

Safe to log:
- Last 4 digits of card (****1234)
- Transaction ID
- Amount
- Timestamp

### 9. Database Security

- MongoDB authentication enabled
- IP whitelist configured
- Backup encryption enabled
- Regular security audits

### 10. Secrets Rotation

Current plan:
- Quarterly Stripe key rotation
- Annual JWT secret rotation
- Immediate rotation on compromise

---

## Error Handling

### Order Creation Errors

| Error | HTTP Status | Message | Solution |
|-------|------------|---------|----------|
| Cart empty | 400 | "Cart is empty" | Add items to cart |
| Invalid payment method | 400 | "Invalid paymentMethod" | Use wallet/online/cod |
| Insufficient wallet balance | 400 | "Insufficient wallet balance" | Add funds to wallet |
| Restaurant closed | 400 | "Restaurant temporarily closed" | Wait for reopening |
| Address invalid | 400 | "Invalid Address ID" | Select valid address |
| User not found | 404 | "User not found" | Login again |
| Restaurant not found | 404 | "Restaurant not found" | Try another restaurant |

### Payment Creation Errors

| Error | Solution |
|-------|----------|
| Order already paid | Wait for webhook / try different order |
| Order not found | Verify orderId is correct |
| Unauthorized | Login and ensure order belongs to you |
| Unsupported region | Online payment only in Germany/Dubai |
| Stripe API error | Retry in 30 seconds |

### Webhook Errors

| Scenario | Current Behavior | Should Be |
|----------|------------------|-----------|
| Webhook signature invalid | Return 400 | ✅ CORRECT |
| Database down during webhook | Function returns undefined | Store in FailedWebhook, return 200 |
| Order not found | Log error | Create order recovery entry |
| Duplicate webhook | Process twice ❌ | Check ProcessedWebhook, skip |

### Troubleshooting

**Payment stuck in "processing"**
- Check Stripe dashboard for payment intent status
- Run `cleanupStalePayments()` cron job
- Manually trigger webhook from Stripe Dashboard

**Webhook not arriving**
- Check Stripe Dashboard → Webhooks → Event deliveries
- Verify webhook URL is correct and publicly accessible
- Check firewall/security group rules
- Test with `curl`:
  ```bash
  curl -X POST https://yourdomain.com/api/payment/webhook \
    -H "Content-Type: application/json" \
    -H "stripe-signature: YOUR_SIG" \
    -d '{"type":"payment_intent.succeeded"}'
  ```

**Double charge detected**
- Check PaymentTransaction table for duplicates
- Process refund via Stripe Dashboard
- Update Order.refund status
- Notify customer support

---

## Testing Guide

### Unit Tests

```javascript
// tests/payment.test.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

describe('Payment Controller', () => {
    
    test('createCheckoutSession creates valid session', async () => {
        const orderId = 'valid-order-id';
        const response = await createCheckoutSession({
            body: { orderId },
            user: { _id: 'user-id' }
        });
        
        expect(response.success).toBe(true);
        expect(response.sessionId).toBeDefined();
    });
    
    test('Webhook deduplicates on idempotency', async () => {
        const eventId = 'evt_1234567890';
        
        // First call
        await handleWebhook(eventId);
        
        // Second call (duplicate)
        const result = await handleWebhook(eventId);
        
        expect(result.message).toContain('already processed');
    });
});
```

### Integration Tests

```bash
# Test with real Stripe test keys
STRIPE_SECRET_KEY=sk_test_xxxx npm test -- --integration

# Tests:
# - Create payment intent
# - Confirm payment intent
# - Trigger webhook
# - Verify order updated
```

### Postman Tests

#### Test 1: Place Order with Online Payment

```javascript
// Pre-request Script
const orderId = pm.environment.get('orderId') || 'new-order';

// Body (raw JSON)
{
  "addressId": "{{addressId}}",
  "paymentMethod": "online",
  "paymentId": null
}

// Expected Response
{
  "success": true,
  "requiresPayment": true,
  "orderId": "...",
  "totalPayment": 500.50
}

// Tests (JavaScript)
pm.test("Order created successfully", () => {
    pm.expect(pm.response.json().success).to.be.true;
});

pm.test("Payment required", () => {
    pm.expect(pm.response.json().requiresPayment).to.be.true;
});

pm.environment.set("orderId", pm.response.json().orderId);
```

#### Test 2: Create Payment Intent

```javascript
// Body
{
  "orderId": "{{orderId}}"
}

// Expected Response
{
  "success": true,
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "currency": "eur",
  "amount": 50050
}

// Tests
pm.test("Payment intent created", () => {
    pm.expect(pm.response.json().paymentIntentId).to.match(/^pi_/);
});

pm.test("Client secret provided", () => {
    pm.expect(pm.response.json().clientSecret).to.match(/_secret_/);
});
```

#### Test 3: Webhook Signature Validation (Manual)

```bash
# Generate test event
curl https://api.stripe.com/v1/test_helpers/test_clocks \
  -u sk_test_xxxx: \
  -d "frozen_time=1234567890"

# Send webhook manually
curl -X POST http://localhost:5000/api/payment/webhook \
  -H "stripe-signature: SIGNATURE_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test\",\"status\":\"succeeded\"}}}"
```

### Manual Testing Checklist

- [ ] Successful payment flow (card accepted)
- [ ] Failed payment (card declined)
- [ ] Payment timeout (30+ second delay)
- [ ] Duplicate webhook (same event ID twice)
- [ ] Network failure during webhook
- [ ] Database down during webhook
- [ ] Concurrent payment attempts
- [ ] Refund processing
- [ ] Wallet deduction
- [ ] COD collection

---

## Common Issues & Fixes

### Issue 1: "Webhook signature verification failed"

**Cause:** Wrong webhook secret or body modified

**Fix:**
```javascript
// Verify secret is correct
console.log(process.env.STRIPE_WEBHOOK_SECRET);

// Ensure raw body is used (not parsed JSON)
// ✅ CORRECT
app.post('/webhook', express.raw({type: 'application/json'}), handler);

// ❌ WRONG
app.use(express.json());
app.post('/webhook', handler); // Body already parsed!
```

### Issue 2: Webhook not triggering

**Check Stripe Dashboard:**
1. Settings → Webhooks
2. Click endpoint
3. Scroll to "Recent events"
4. Check delivery status

**If failed:**
- Click event → Click "Retry" button
- Check event details for error message

**If stuck:**
```bash
# Manually trigger via CLI
stripe trigger payment_intent.succeeded \
  --api-key sk_test_xxxx
```

### Issue 3: Double charging customers

**Prevention:**
```javascript
// Already implemented: Check if already paid
if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false });
}

// Add: Check if processing
if (order.paymentStatus === 'processing') {
    return res.status(400).json({ 
        success: false, 
        message: 'Payment already in progress' 
    });
}
```

**If it happens:**
1. Find duplicate orders: `db.orders.find({customer: X, sourceOrder: Y})`
2. Process refund: Stripe Dashboard → Charges → Refund
3. Update order: `db.orders.updateOne({_id: X}, {$set: {refund.status: 'completed'}})`

### Issue 4: Payment stuck in "processing"

**Causes:**
- Webhook failed (check Stripe delivery)
- Database error during webhook
- Network timeout

**Resolution:**
```javascript
// Run this manually
const staleOrders = await Order.find({
    paymentStatus: 'processing',
    createdAt: { $lt: new Date(Date.now() - 10*60*1000) }
});

for (const order of staleOrders) {
    const intent = await stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId
    );
    
    if (intent.status === 'succeeded') {
        // Webhook failed, recover
        await finalizeOrderPaymentSuccess(order, intent.id, 'Recovery');
    } else if (intent.status === 'failed') {
        await finalizeOrderPaymentFailure(order, 'Recovery');
    }
}
```

### Issue 5: Stripe API rate limit

**Error:** 429 Too Many Requests

**Cause:** Making >100 requests/second

**Fix:**
```javascript
// Implement exponential backoff
async function apiCallWithRetry(fn, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (err.statusCode === 429) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await new Promise(r => setTimeout(r, delay));
                lastError = err;
            } else {
                throw err;
            }
        }
    }
    throw lastError;
}

// Usage
await apiCallWithRetry(() => stripe.pagmentIntents.create(...));
```

### Issue 6: Missing webhook events

**Check dashboard event deliveries:**
```
Stripe Dashboard → Developers → Webhooks → Select endpoint → Event Deliveries
```

**Common missing events:**
- `charge.dispute.created` - Chargeback
- `charge.refunded` - Refund completed
- `payment_intent.amount_capturable_updated` - For authorized-only payments

**Add to webhook handler:**
```javascript
case "charge.dispute.created": {
    const dispute = event.data.object;
    logger.warn('Chargeback received', { chargeId: dispute.charge });
    // Alert team, mark order for investigation
    break;
}

case "charge.refunded": {
    const charge = event.data.object;
    logger.info('Refund detected', { chargeId: charge.id,   refundId: charge.refunded });
    // Update order refund status
    break;
}
```

---

## Production Checklist

### Pre-Production (1 Week Before)

- [ ] All critical security fixes implemented
- [ ] Stripe keys are LIVE production keys (not test)
- [ ] Webhook endpoint is publicly accessible
- [ ] HTTPS is enforced on all payment endpoints
- [ ] Rate limiting is active on payment endpoints
- [ ] Idempotency is working for webhooks
- [ ] Refund logic is complete and tested
- [ ] Payment timeout cleanup cron is running
- [ ] Monitoring and alerting is configured
- [ ] Team is trained on incident response

### Deployment Day

- [ ] Database backups are verified
- [ ] Rollback plan is documented
- [ ] Team is on standby
- [ ] Customer communication is ready
- [ ] Support team is briefed
- [ ] Monitoring dashboard is open

### Post-Deployment (First 24 Hours)

- [ ] Payment success rate is > 95%
- [ ] No critical errors in logs
- [ ] Webhooks are processing normally
- [ ] Customer complaints are < 1%
- [ ] Database performance is normal
- [ ] All critical features are working

### Ongoing (Weekly)

- [ ] Review failed webhooks (if any)
- [ ] Check payment error rates
- [ ] Verify backup integrity
- [ ] Review security logs
- [ ] Test disaster recovery
- [ ] Update runbook based on learnings

### Ongoing (Monthly)

- [ ] Stripe key rotation (if policy requires)
- [ ] Database encryption verification
- [ ] Load testing (simulate peak traffic)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Capacity planning

### Annual

- [ ] PCI compliance audit
- [ ] Security penetration testing
- [ ] Architecture review
- [ ] Dependency updates
- [ ] Disaster recovery drill

---

## Appendix: Sample Postman Collection

```json
{
  "info": {
    "name": "Food Delivery - Payment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [{"key": "token", "value": "{{jwt_token}}", "type": "string"}]
  },
  "item": [
    {
      "name": "Place Order (Online Payment)",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{base_url}}/api/orders/place-order",
        "body": {
          "mode": "raw",
          "raw": "{\"addressId\": \"{{addressId}}\", \"paymentMethod\": \"online\", \"paymentId\": null}"
        }
      }
    },
    {
      "name": "Create Payment Intent",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{base_url}}/api/payment/create-payment-intent",
        "body": {
          "mode": "raw",
          "raw": "{\"orderId\": \"{{orderId}}\"}"
        }
      }
    },
    {
      "name": "Payment Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/payment/health"
      }
    }
  ]
}
```

---

## Support & Resources

- **Stripe Documentation:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Webhooks:** https://stripe.com/docs/webhooks
- **Testing:** https://stripe.com/docs/testing
- **Support:** support@stripe.com

---

**Maintained by:** Backend Team  
**Last Review:** March 29, 2026  
**Next Review:** April 30, 2026  
**Status:** ⚠️ Requires Critical Fixes Before Production
