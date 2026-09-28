const mongoose = require('mongoose');

/**
 * Parses time string like "09:00 AM", "9:00 AM", "11:00 PM", "09:00", "23:00"
 * into total minutes from midnight (0 - 1439).
 * Returns null if string is invalid or empty.
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const str = timeStr.trim().toUpperCase();
  if (!str) return null;

  const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (modifier) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) {
      hours = modifier === 'AM' ? 0 : 12;
    } else if (modifier === 'PM') {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
};

/**
 * Checks if currentMinutes falls between openStr and closeStr.
 * Supports overnight operating hours (e.g. 22:00 to 04:00).
 */
const isTimeWithinRange = (currentMinutes, openStr, closeStr) => {
  const openMinutes = parseTimeToMinutes(openStr);
  const closeMinutes = parseTimeToMinutes(closeStr);

  if (openMinutes === null || closeMinutes === null) {
    return true; // If timing is invalid or missing, default to open
  }

  if (openMinutes <= closeMinutes) {
    // Standard same-day operating hours e.g. 09:00 (540) to 23:00 (1380)
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } else {
    // Overnight operating hours e.g. 22:00 (1320) to 04:00 (240)
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
};

/**
 * Gets day of week (lowercase) and current minutes from midnight in specified timeZone.
 */
const getCurrentTimeInfoInZone = (referenceDate = new Date(), timeZone = process.env.RESTAURANT_TIMEZONE || 'Asia/Kolkata') => {
  try {
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone,
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    });

    const currentDay = dayFormatter.format(referenceDate).toLowerCase();
    const timeParts = timeFormatter.formatToParts(referenceDate);
    const hourPart = timeParts.find((p) => p.type === 'hour');
    const minutePart = timeParts.find((p) => p.type === 'minute');

    const hourVal = parseInt(hourPart?.value || '0', 10);
    const minVal = parseInt(minutePart?.value || '0', 10);
    const currentMinutes = hourVal * 60 + minVal;

    return { currentDay, currentMinutes };
  } catch (error) {
    const currentDay = referenceDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
    return { currentDay, currentMinutes };
  }
};

/**
 * Fast boolean check if restaurant is open right now (Default 24x7 open mode).
 */
const isRestaurantOpenNow = (restaurant, referenceDate = new Date()) => {
  if (!restaurant) return false;
  return true; // 24x7 open mode for testing/ordering
};

/**
 * Detailed availability check returning `{ available: boolean, reason?: string }` (Default 24x7 open mode).
 */
const checkRestaurantAvailability = async (restaurantIdOrObject) => {
  let restaurant = restaurantIdOrObject;
  if (!restaurant) {
    return { available: false, reason: 'Restaurant not found' };
  }
  
  if (typeof restaurant === 'string' || (restaurant instanceof mongoose.Types.ObjectId)) {
    const Restaurant = require('../models/Restaurant');
    restaurant = await Restaurant.findById(restaurantIdOrObject);
  }

  if (!restaurant) {
    return { available: false, reason: 'Restaurant not found' };
  }
  
  // 24x7 open mode by default
  return { available: true };
};

module.exports = {
  parseTimeToMinutes,
  isTimeWithinRange,
  getCurrentTimeInfoInZone,
  isRestaurantOpenNow,
  checkRestaurantAvailability,
};

