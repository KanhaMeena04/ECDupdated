# ECDKART GEOLOCATION CONTRACT

## Overview
This contract establishes the canonical spatial coordinate format, validation rules, GeoJSON database schema, distance algorithms, and serviceability geofencing rules across **ECDbackend**, **ECDadmin**, **User App**, **Restaurant App**, and **Rider App**.

---

## 1. GeoJSON Standard Coordinate Order

> [!IMPORTANT]
> MongoDB GeoJSON standard requires coordinates array format: `[longitude, latitude]`.
>
> **Longitude**: `x` axis (range `-180.0` to `180.0`)
> **Latitude**: `y` axis (range `-90.0` to `90.0`)

Example:
- Latitude: `28.248`
- Longitude: `77.081`
- Canonical GeoJSON Object:
  ```json
  {
    "type": "Point",
    "coordinates": [77.081, 28.248]
  }
  ```

---

## 2. Validation & Normalization Contract

Backend controller helper `normalizeLocation` enforces:
1. `latitude` must be a finite number between `-90.0` and `90.0`.
2. `longitude` must be a finite number between `-180.0` and `180.0`.
3. Coordinates cannot be `[null, null]`, `[0, 0]`, or contain `NaN`.
4. If invalid or missing, backend rejects submission with **HTTP 400 Bad Request**: `"Valid restaurant location coordinates (latitude and longitude) are required. Please select the location on the map."`

---

## 3. Distance & Geofencing Calculation (Haversine Formula)

$$\text{distance} = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

Where:
- $R = 6371\text{ km}$ (Earth radius)
- $\phi_1, \phi_2$ = latitudes in radians
- $\lambda_1, \lambda_2$ = longitudes in radians

---

## 4. Ecosystem Geofencing Matrix

| App / Location Test | Location Coordinates | Restaurant Coordinates | Distance (km) | Serviceability Status | UI Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User in Indore** | `[75.89, 22.75]` | `[77.081, 28.248]` (Sohna) | ~520 km | **OUT OF SERVICE AREA** | Renders `_buildServiceUnavailableCard` ("Service Unavailable in Vijay Nagar, Indore") |
| **User in Sohna** | `[77.06, 28.24]` | `[77.081, 28.248]` (Sohna) | ~2.3 km | **SERVICEABLE** | Displays 3 active restaurants, categories, banners, and recommended dishes |
