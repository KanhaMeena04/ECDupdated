# Frontend Integration Guide: Rider + Restaurant + Payment

Last updated: 2026-03-10
Backend base: `http://<host>:<port>/api`

This guide is aligned with the current backend code and includes onboarding, pricing, checkout, COD confirmation, delivered settlement, and wallet endpoints.

## 1. Base API Paths

- Rider APIs: `/api/riders`
- Restaurant APIs: `/api/restaurants`
- Order APIs: `/api/orders`
- Payment APIs: `/api/payment`

## 2. Auth Requirements

Most endpoints below require JWT auth.

Use header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Role expectations:

- Rider endpoints require rider role (`protect, rider`)
- Restaurant owner endpoints require owner role (`protect, restaurantOwner`)
- Admin payment endpoints require admin role (`protect, admin`)

## 3. Rider Onboarding Integration

### 3.1 Check profile / onboarding state

- `GET /api/riders/profile`

Behavior:

- If rider profile is not created, response includes `onboardingRequired: true`
- If profile exists, response includes rider data and stats

### 3.2 Submit rider onboarding

- `POST /api/riders/onboard`
- Content-Type: `multipart/form-data`

Accepted file fields:

- `licenseFrontImage`
- `licenseBackImage`
- `rcImage`
- `insuranceImage`
- `medicalCertificate`
- `gst`

Accepted body fields:

- `name`
- `email`
- `address`
- `workCity`
- `workZone`
- `vehicle`
- `documents`
- `bankDetails`
- `location`

### 3.3 Update rider docs / vehicle / bank

- `PUT /api/riders/documents`
- `PUT /api/riders/vehicle`
- `PUT /api/riders/bank`

Verification behavior:

- Any docs/vehicle/bank update resets rider verification
- Frontend should refresh verification badge/state immediately

### 3.4 Rider status / go-online

- `GET /api/riders/status`
- `PATCH /api/riders/status`

Use `diagnostics.canGoOnline` and reasons from status response to drive UI.

## 4. Restaurant Owner Integration

### 4.1 Apply for restaurant

- `POST /api/restaurants/apply`
- Content-Type: `multipart/form-data`

Backend defaults on onboarding:

- `platformFee = 5`
- `deliverySlabs = [0-3, 3-5, 5-6, >6]`
- `adminCommission = 10`
- `verificationStatus = pending`
- `restaurantApproved = false`
- `isActive = false`

### 4.2 Profile and updates

- `GET /api/restaurants/profile`
- `PUT /api/restaurants/:id`
- `PUT /api/restaurants/:id/settings`
- `PUT /api/restaurants/:id/documents`
- `PUT /api/restaurants/:id/bank`
- `POST /api/restaurants/:id/request-update`
- `POST /api/restaurants/:id/verify-update`

Settings payload supports:

- `platformFee`
- `deliverySlabs`
- `taxConfig.gstPercent`
- `paymentMethods`
- `timing`, `deliveryTime`, `minOrderValue`, `packagingCharge`

## 5. Pricing and Fee Logic

Current behavior:

- Delivery fee uses restaurant `deliverySlabs`
- Platform fee uses restaurant `platformFee`
- Tax uses `taxConfig.gstPercent` (fallback handling applies if missing)
- Order stores fee components used at checkout (`itemTotal`, `packaging`, `tax`, `deliveryFee`, `platformFee`, `tip`, `discount`)

Delivery fee preview endpoint:

- `POST /api/payment/calculate-delivery-fee`

Request body:

```json
{
  "distanceKm": 4.2,
  "restaurantId": "<optional_restaurant_id>"
}
```

Notes:

- `restaurantId` optional
- If provided, fee is calculated using that restaurant's slabs

## 6. Order Payment Modes (Place Order)

Place order endpoint:

- `POST /api/orders/place`

Request key fields:

- `addressId`
- `paymentMethod` (`wallet`, `online`, `cod`)

Behavior by payment method:

- `wallet`: wallet debited immediately during place-order transaction, order can proceed as paid flow
- `online`: order created with payment pending, frontend must complete Stripe payment
- `cod`: order created pending payment collection at delivery

## 7. Online Payments (Stripe)

### 7.1 Create checkout session (web)

- `POST /api/payment/create-checkout-session`

Request body:

```json
{
  "orderId": "<order_id>",
  "successUrl": "https://your-app/success",
  "cancelUrl": "https://your-app/cancel"
}
```

Response fields:

- `success`
- `sessionId`
- `url`

### 7.2 Create payment intent (mobile)

- `POST /api/payment/create-payment-intent`

Request body:

```json
{
  "orderId": "<order_id>"
}
```

Response fields:

- `paymentIntentId`
- `clientSecret`
- `publishableKey`
- `currency`
- `amount`

### 7.3 Region restriction

Current backend allows online payments only for supported regions inferred from address text:

- Germany
- UAE/Dubai

Unsupported regions receive a 400 with message that online payment is not available.

### 7.4 Stripe webhook

- `POST /api/payment/webhook`

Webhook updates order payment status:

- Success transitions payment to paid and order to placed
- Failure transitions order/payment to failed

Frontend should treat webhook/websocket/order-refresh as source of truth for final payment result.

## 8. COD Confirmation and Idempotency

Rider confirms COD after delivery:

- `POST /api/payment/cod/confirm`

Request body:

```json
{
  "orderId": "<order_id>",
  "amountCollected": 0
}
```

Notes:

- `orderId` is required
- Order must be COD and already `delivered`
- Backend verifies rider ownership of the order
- Endpoint is idempotent: repeated calls return success with already-processed message

## 9. Delivered Settlement Rules

Settlement runs when order moves to `delivered` and credits wallets once.

Earning formulas currently enforced:

- Restaurant earning: `(itemTotal + packaging) - adminCommission`
- Rider earning: `deliveryFee + riderIncentive`

Additional notes:

- `adminCommission` percent source: restaurant `adminCommission`
- `tip` is stored on order but not part of rider earning formula above
- Settlement processing is idempotent and transaction-based to avoid duplicate wallet credits

## 10. Wallet and Admin Payment APIs

Rider wallet:

- `GET /api/payment/rider/wallet`

Admin rider cash controls:

- `POST /api/payment/rider/deposit`
- `POST /api/payment/rider/cash-limit`
- `GET /api/payment/rider/wallet/:riderId`
- `GET /api/payment/rider/frozen-riders`

Restaurant wallet:

- `GET /api/payment/restaurant/wallet`
- `GET /api/payment/restaurant/wallet/:restaurantId`

Admin payment overview:

- `GET /api/payment/admin/summary`
- `POST /api/payment/admin/weekly-payout`
- `GET /api/payment/admin/transactions`
- `GET /api/payment/restaurants/wallets`
- `GET /api/payment/riders/wallets`

## 11. Transaction Types Useful for Frontend Filters

Payment transaction list may include types such as:

- `cod_collected`
- `online_payment`
- `wallet_payment`
- `restaurant_commission`
- `restaurant_weekly_payout`
- `rider_weekly_payout`
- `cod_deposit`
- `rider_unfreeze`
- `admin_commission_payout`

Use `type` query on admin transaction endpoint for filtered tables.

## 12. Suggested Frontend Flows

Rider app flow:

1. Login and call `GET /api/riders/profile`.
2. Complete onboarding if required.
3. Use rider status endpoint to control online/offline UI.
4. On delivered COD orders, call `/api/payment/cod/confirm` once.
5. Show freeze warnings from rider wallet response when cash limit risk exists.

Restaurant owner flow:

1. Login and create/apply profile if needed.
2. Use `GET /api/restaurants/profile` for status and verification UI.
3. Configure fee/tax settings in `PUT /api/restaurants/:id/settings`.
4. Use `/api/payment/restaurant/wallet` for earnings and payout display.

Customer payment flow:

1. Place order with selected `paymentMethod`.
2. If online: call Stripe checkout/payment-intent endpoint.
3. Confirm final state via order refresh/websocket after webhook processing.

## 13. Common Integration Notes

- Multipart endpoints accept nested objects as stringified JSON.
- Geo coordinates are `[longitude, latitude]`.
- Keep enums aligned with backend values (`paymentMethod`, `status`, transaction `type`).
- Do not treat client-side payment success as final for online payments; webhook result is authoritative.

## 14. Quick Endpoint Checklist

Rider:

- `GET /api/riders/profile`
- `POST /api/riders/onboard`
- `PUT /api/riders/documents`
- `PUT /api/riders/vehicle`
- `PUT /api/riders/bank`
- `GET /api/riders/status`
- `PATCH /api/riders/status`

Restaurant owner:

- `POST /api/restaurants/apply`
- `GET /api/restaurants/profile`
- `PUT /api/restaurants/:id`
- `PUT /api/restaurants/:id/settings`
- `PUT /api/restaurants/:id/documents`
- `PUT /api/restaurants/:id/bank`
- `POST /api/restaurants/:id/request-update`
- `POST /api/restaurants/:id/verify-update`

Payments:

- `POST /api/payment/calculate-delivery-fee`
- `POST /api/payment/create-checkout-session`
- `POST /api/payment/create-payment-intent`
- `POST /api/payment/cod/confirm`
- `GET /api/payment/rider/wallet`
- `GET /api/payment/restaurant/wallet`

Admin payment:

- `POST /api/payment/rider/deposit`
- `POST /api/payment/rider/cash-limit`
- `GET /api/payment/rider/wallet/:riderId`
- `GET /api/payment/rider/frozen-riders`
- `GET /api/payment/restaurant/wallet/:restaurantId`
- `GET /api/payment/admin/summary`
- `POST /api/payment/admin/weekly-payout`
- `GET /api/payment/admin/transactions`
- `GET /api/payment/restaurants/wallets`
- `GET /api/payment/riders/wallets`
