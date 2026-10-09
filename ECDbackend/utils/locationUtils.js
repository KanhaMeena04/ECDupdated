const logger = console;

exports.calculateETA = (riderCoords, customerCoords, orderStatus) => {
  try {
    if (!riderCoords || !customerCoords) return { minutes: 15, display: '15 mins away' };
    const lat1 = riderCoords[1] !== undefined ? riderCoords[1] : riderCoords.lat;
    const lng1 = riderCoords[0] !== undefined ? riderCoords[0] : riderCoords.lng;
    const lat2 = customerCoords[1] !== undefined ? customerCoords[1] : customerCoords.lat;
    const lng2 = customerCoords[0] !== undefined ? customerCoords[0] : customerCoords.lng;

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return { minutes: 15, display: '15 mins away' };
    }

    const distKm = exports.calculateDistance([lng1, lat1], [lng2, lat2]);
    const etaMinutes = Math.max(1, Math.ceil(distKm * 3));
    return { minutes: etaMinutes, display: `${etaMinutes} mins away` };
  } catch (error) {
    return { minutes: 15, display: '15 mins away' };
  }
};

exports.calculateDistance = (coord1, coord2) => {
  try {
    if (!coord1 || !coord2) return 999;
    const lat1 = Number(coord1[1] !== undefined ? coord1[1] : coord1.lat);
    const lng1 = Number(coord1[0] !== undefined ? coord1[0] : coord1.lng);
    const lat2 = Number(coord2[1] !== undefined ? coord2[1] : coord2.lat);
    const lng2 = Number(coord2[0] !== undefined ? coord2[0] : coord2.lng);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return 999;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = 6371 * c;
    return Math.round(distKm * 10) / 10;
  } catch (error) {
    return 999;
  }
};

exports.estimateTravelMinutes = (distanceKm, speedKmph = 20) => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const minutes = (distanceKm / speedKmph) * 60;
  return Math.max(1, Math.ceil(minutes));
};

exports.isWithinRestaurantRadius = (restaurant, userLat, userLng) => {
  if (!Number.isFinite(Number(userLat)) || !Number.isFinite(Number(userLng))) return true;
  if (!restaurant) return false;

  const coords = restaurant.location?.coordinates;
  if (!coords || !Array.isArray(coords) || coords.length < 2) return true;

  const restLng = Number(coords[0]);
  const restLat = Number(coords[1]);
  if (!Number.isFinite(restLat) || !Number.isFinite(restLng) || (restLat === 0 && restLng === 0)) return true;

  const distKm = exports.calculateDistance([Number(userLng), Number(userLat)], [restLng, restLat]);

  // Restaurant's configured geofence/delivery radius in KM (defaults to 500 KM to cover multi-city / test environments)
  const rawRadius = Number(restaurant.geofenceRadius ?? restaurant.deliveryRadius);
  const maxRadiusKm = (Number.isFinite(rawRadius) && rawRadius > 0) ? Math.max(rawRadius, 500) : 500;

  return distKm <= maxRadiusKm;
};

exports.getNearbyRidersQuery = (restaurantCoords, radiusMeters = 10000) => {
  return {
    currentLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: restaurantCoords
        },
        $maxDistance: radiusMeters
      }
    },
    isOnline: true,
    isAvailable: true,
    verificationStatus: 'approved'
  };
};

module.exports = exports;
