
const Restaurant = require('../models/Restaurant');
const Rider = require('../models/Rider');
const Cart = require('../models/Cart');
const { logger } = require('../utils/logger');
const checkRestaurantAvailability = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return { available: false, reason: 'Restaurant not found' };
  }
  if (!restaurant.isActive) {
    return { available: false, reason: 'Restaurant is inactive' };
  }
  if (!restaurant.restaurantApproved) {
    return { available: false, reason: 'Restaurant is not approved' };
  }
  if (restaurant.isTemporarilyClosed) {
    return { available: false, reason: 'Restaurant is temporarily closed' };
  }
  if (restaurant.timing) {
    const now = new Date();
    const timeZone = process.env.RESTAURANT_TIMEZONE || 'Asia/Kolkata';
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone,
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });
    const currentDay = dayFormatter.format(now).toLowerCase();
    const timeParts = timeFormatter.formatToParts(now);
    const hourPart = timeParts.find((p) => p.type === 'hour');
    const minutePart = timeParts.find((p) => p.type === 'minute');
    const currentTime = `${hourPart?.value || '00'}:${minutePart?.value || '00'}`; // HH:MM
    const todayTiming = restaurant.timing[currentDay];
    if (todayTiming) {
      if (todayTiming.isClosed) {
        return { 
          available: false, 
          reason: `Restaurant is closed on ${currentDay}s` 
        };
      }
      if (todayTiming.open && todayTiming.close) {
        if (currentTime < todayTiming.open || currentTime > todayTiming.close) {
          return {
            available: false,
            reason: `Restaurant is closed. Hours: ${todayTiming.open} - ${todayTiming.close}`
          };
        }
      }
    }
  }
  return { available: true };
};
const checkRiderAvailability = async (restaurantLocation, minimumRiders = 1) => {
  try {
    let nearbyRiders = 0;
    if (restaurantLocation && restaurantLocation.coordinates) {
      nearbyRiders = await Rider.countDocuments({
        isOnline: true,
        verificationStatus: 'approved',
        currentLocation: {
          $geoWithin: {
            $centerSphere: [
              restaurantLocation.coordinates,
              50 / 6371 // 50km radius in radians
            ]
          }
        }
      });
    }

    if (nearbyRiders < minimumRiders) {
      // Fallback: check any approved online rider anywhere
      nearbyRiders = await Rider.countDocuments({
        isOnline: true,
        verificationStatus: 'approved'
      });
    }

    // Also count any approved rider in system as standby
    if (nearbyRiders < minimumRiders) {
      const totalApprovedRiders = await Rider.countDocuments({
        verificationStatus: 'approved'
      });
      if (totalApprovedRiders > 0) {
        return { available: true, nearbyRiders: totalApprovedRiders };
      }
    }

    if (nearbyRiders < minimumRiders) {
      return {
        available: false,
        reason: `No riders available nearby. Currently ${nearbyRiders} riders online.`
      };
    }
    return { available: true, nearbyRiders };
  } catch (error) {
    logger.error('Rider availability check failed', { error: error.message });
    return { available: true, nearbyRiders: 1 };
  }
};
const checkServiceAvailability = async (req, res, next) => {
  try {
    let restaurantId = req.body.restaurantId || req.body.restaurant;
    if (!restaurantId && req.user?._id) {
      const cart = await Cart.findOne({ user: req.user._id }).select('restaurant');
      if (cart?.restaurant) {
        restaurantId = cart.restaurant.toString();
      }
    }
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    const restaurantCheck = await checkRestaurantAvailability(restaurantId);
    if (!restaurantCheck.available) {
      logger.warn('Service unavailable - Restaurant', {
        restaurantId,
        reason: restaurantCheck.reason,
        userId: req.user?._id
      });
      return res.status(503).json({
        error: 'Service unavailable',
        reason: restaurantCheck.reason,
        type: 'restaurant_unavailable'
      });
    }
    const restaurant = await Restaurant.findById(restaurantId).select('location');
    
    // 📍 GEOFENCING & DISTANCE BOUNDARY CHECK
    const isSelfPickup = req.body.orderType === 'self_pickup';
    if (!isSelfPickup) {
      const { calculateDistance } = require('../utils/locationUtils');
      let customerCoords = null;
      if (req.body.addressId && req.user) {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        const addr = user?.savedAddresses?.id(req.body.addressId);
        if (addr?.location?.coordinates) {
          customerCoords = addr.location.coordinates;
        }
      } else if (req.body.latitude && req.body.longitude) {
        customerCoords = [Number(req.body.longitude), Number(req.body.latitude)];
      }

      if (customerCoords && restaurant?.location?.coordinates) {
        const distanceKm = calculateDistance(restaurant.location.coordinates, customerCoords);
        const MAX_DELIVERY_RADIUS_KM = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM || '12.0');
        if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
          logger.warn('Service unavailable - Out of Geofence Area', {
            restaurantId,
            distanceKm,
            maxRadius: MAX_DELIVERY_RADIUS_KM,
            userId: req.user?._id
          });
          return res.status(400).json({
            success: false,
            error: 'Location Out of Delivery Geofence',
            message: `📍 Your delivery address (${distanceKm.toFixed(1)} km) is outside our geofenced service area (Max: ${MAX_DELIVERY_RADIUS_KM} km). Please select a closer address or choose Self-Pickup 🛍️.`,
            type: 'out_of_geofence',
            distanceKm
          });
        }
      }
    }

    const riderCheck = await checkRiderAvailability(restaurant?.location);
    if (!riderCheck.available) {
      logger.warn('Service unavailable in placing order - Riders', {
        restaurantId,
        reason: riderCheck.reason,
        userId: req.user?._id
      });
    }
    req.serviceAvailability = {
      restaurant: restaurantCheck,
      riders: riderCheck,
      isSelfPickup
    };
    next();
  } catch (error) {
    logger.error('Service availability check failed', {
      error: error.message,
      userId: req.user?._id
    });
    next();
  }
};
module.exports = {
  checkServiceAvailability,
  checkRestaurantAvailability,
  checkRiderAvailability
};
