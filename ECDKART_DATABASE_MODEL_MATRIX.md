# ECDKART DATABASE MODEL MATRIX

## Overview
This document records every Mongoose schema and MongoDB collection in `ECDbackend`, detailing fields, data types, validation constraints, indexes, and relations across the platform.

---

## Central MongoDB Models & Schemas

### 1. `User` Model (`users` collection)
- `_id`: ObjectId (Primary Key)
- `name`: String (Required)
- `email`: String (Unique, Indexed, Required)
- `mobile`: String (Unique, Indexed)
- `password`: String (Hashed, Required)
- `role`: Enum `['customer', 'restaurant_owner', 'rider', 'admin', 'super_admin']` (Default: `'customer'`)
- `isVerified`: Boolean (Default: `false`)
- `walletBalance`: Number (Default: `0`)
- `addresses`: Array of Address Objects (`{ street, city, state, pincode, location }`)
- `createdAt`, `updatedAt`: Timestamps

### 2. `Restaurant` Model (`restaurants` collection)
- `_id`: ObjectId (Primary Key)
- `owner`: ObjectId -> `User` (Ref, Required)
- `name`: Multilingual Map `{ en: String (Required), de: String, ar: String }`
- `description`: Multilingual Map `{ en: String (Required), de: String, ar: String }`
- `email`: String (Required)
- `contactNumber`: String (Required)
- `address`: String (Required)
- `city`, `area`: String (Required)
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }` (2dsphere index)
- `deliveryTime`: Number (Estimated Mins, Required)
- `geofenceRadius`: Number (Default: `10` km)
- `deliveryType`: Array of Enum `['Home Delivery', 'Pickup', 'Dining']` (Validated)
- `paymentMethods`: Enum `['COD', 'Online', 'Both']` (Default: `'Both'`)
- `packagingCharge`: Number (Default: `0`)
- `adminCommission`: Number (Default: `10`%)
- `isActive`: Boolean (Default: `true`)
- `restaurantApproved`: Boolean (Default: `true`)
- `menuApproved`: Boolean (Default: `true`)
- `verificationStatus`: Enum `['pending', 'verified', 'rejected']` (Default: `'verified'`)
- `bankDetails`: Object `{ accountName, bankName, accountNumber, swiftCode }`
- `documents`: Object `{ license, pan, gst }` with file URLs and expiry dates
- `timing`: Object with daily schedule schemas (`monday` through `sunday`)

### 3. `Product` Model (`products` collection)
- `_id`: ObjectId (Primary Key)
- `restaurant`: ObjectId -> `Restaurant` (Ref, Required)
- `category`: ObjectId -> `Category` (Ref, Required)
- `name`: Multilingual Map or String
- `description`: Multilingual Map or String
- `basePrice`: Number (Required, Original Base Price)
- `mrp`: Number (Maximum Retail Price)
- `adminPriceOverride`: Object `{ basePrice: Number, enabled: Boolean, updatedBy: ObjectId }`
- `isVeg`: Boolean (Default: `true`)
- `isAvailable`: Boolean (Default: `true`)
- `variants`: Array of Variant Objects
- `addons`: Array of Addon Objects

### 4. `Category` / `MasterCategory` Models (`categories` & `mastercategories` collections)
- `_id`: ObjectId (Primary Key)
- `name`: Multilingual Map `{ en: String }` or String
- `image`: String (Image URL)
- `isActive` / `status`: Enum `['active', 'inactive']` / Boolean

### 5. `Order` Model (`orders` collection)
- `_id`: ObjectId (Primary Key)
- `orderId`: String (Unique Order Ref ID)
- `user`: ObjectId -> `User` (Ref, Required)
- `restaurant`: ObjectId -> `Restaurant` (Ref, Required)
- `rider`: ObjectId -> `Rider` (Ref)
- `items`: Array of Order Item Objects (Product ID, Name, Price, Quantity, Customizations)
- `totalAmount`: Number (Final Customer Payable)
- `subtotal`: Number
- `deliveryFee`: Number
- `packagingFee`: Number
- `adminCommission`: Number
- `restaurantEarning`: Number
- `riderEarning`: Number
- `discountAmount`: Number
- `couponCode`: String
- `paymentMethod`: Enum `['COD', 'Online', 'Wallet']`
- `paymentStatus`: Enum `['pending', 'paid', 'failed', 'refunded']`
- `orderStatus`: Enum `['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']`
- `deliveryAddress`: Object `{ street, city, area, location }`
- `createdAt`, `updatedAt`: Timestamps

### 6. `Rider` Model (`riders` collection)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId -> `User` (Ref, Required)
- `vehicleDetails`: Object `{ type, model, registrationNumber, licenseNumber }`
- `documents`: Object `{ licenseUrl, vehicleRcUrl, aadharUrl, panUrl }`
- `kycStatus`: Enum `['pending', 'verified', 'rejected']`
- `isOnline`: Boolean (Default: `false`)
- `currentLocation`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }` (2dsphere index)
- `walletBalance`: Number (Default: `0`)
- `totalEarnings`: Number (Default: `0`)

### 7. `HomeScreenSection` Model (`homescreensections` collection)
- `_id`: ObjectId (Primary Key)
- `sectionKey`: String (Unique, e.g. `'banners_carousel'`, `'food_categories'`)
- `title`: String
- `subtitle`: String
- `sectionType`: Enum `['banner_carousel', 'category_grid', 'food_categories', 'recommended_dishes', 'explore_restaurants', 'ecdkart_comparison']`
- `displayOrder`: Number
- `isActive`: Boolean (Default: `true`)
