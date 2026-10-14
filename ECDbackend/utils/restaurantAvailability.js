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
 * Fast boolean check if restaurant is open right now based on working hours & manual toggles.
 */
const isRestaurantOpenNow = (restaurant, referenceDate = new Date()) => {
  if (!restaurant) return false;
  
  // 1. Inactive or admin disabled
  if (restaurant.isActive === false) return false;

  // 2. Temporarily closed or kitchen busy
  if (restaurant.isTemporarilyClosed === true) return false;

  // 3. Manual online/offline switch
  if (restaurant.isOnline === false) return false;

  // 4. Global holiday switch
  if (restaurant.timing && restaurant.timing.isHoliday === true) return false;

  // 5. Operating hours schedule check
  const { currentDay, currentMinutes } = getCurrentTimeInfoInZone(referenceDate);
  const dayTiming = restaurant.timing ? restaurant.timing[currentDay] : null;

  if (dayTiming) {
    if (dayTiming.isClosed === true || dayTiming.isOpen === false || dayTiming.open === 'Closed' || dayTiming.close === 'Closed') {
      return false;
    }
    if (dayTiming.open && dayTiming.close) {
      return isTimeWithinRange(currentMinutes, dayTiming.open, dayTiming.close);
    }
  }

  return true;
};

/**
 * Formats 24h or any valid time string to IST 12h AM/PM string.
 * e.g. "10:00" -> "10:00 AM", "22:00" -> "10:00 PM"
 */
const formatTimeToAmPm = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (trimmed.toUpperCase() === 'CLOSED') return 'Closed';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return trimmed;
  let h = parseInt(match[1], 10);
  const m = match[2];
  let mod = match[3] ? match[3].toUpperCase() : null;
  if (!mod) {
    mod = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
  }
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m} ${mod}`;
};

/**
 * Detailed availability check returning `{ available: boolean, reason?: string }`.
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

  // 1. Inactive check
  if (restaurant.isActive === false) {
    return { available: false, reason: 'Restaurant is currently inactive' };
  }

  // 2. Temporarily closed
  if (restaurant.isTemporarilyClosed === true) {
    return {
      available: false,
      reason: restaurant.kitchenBusyReason || 'Restaurant is temporarily closed'
    };
  }

  // 3. Offline switch
  if (restaurant.isOnline === false) {
    return { available: false, reason: 'Restaurant is currently offline' };
  }

  // 4. Holiday
  if (restaurant.timing && restaurant.timing.isHoliday === true) {
    return { available: false, reason: 'Restaurant is closed for a holiday' };
  }

  // 5. Day working hours check (IST Timezone)
  const { currentDay, currentMinutes } = getCurrentTimeInfoInZone(new Date());
  const dayTiming = restaurant.timing ? restaurant.timing[currentDay] : null;

  if (dayTiming) {
    if (dayTiming.isClosed === true || dayTiming.isOpen === false || dayTiming.open === 'Closed' || dayTiming.close === 'Closed') {
      const capDay = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
      return { available: false, reason: `Restaurant is closed today (${capDay})` };
    }
    if (dayTiming.open && dayTiming.close) {
      const withinHours = isTimeWithinRange(currentMinutes, dayTiming.open, dayTiming.close);
      if (!withinHours) {
        const openAmPm = formatTimeToAmPm(dayTiming.open);
        const closeAmPm = formatTimeToAmPm(dayTiming.close);
        return {
          available: false,
          reason: `Restaurant is currently closed. Operating hours for today (${currentDay.toUpperCase()}): ${openAmPm} to ${closeAmPm} (IST)`
        };
      }
    }
  }

  return { available: true };
};

module.exports = {
  parseTimeToMinutes,
  isTimeWithinRange,
  getCurrentTimeInfoInZone,
  isRestaurantOpenNow,
  checkRestaurantAvailability,
  formatTimeToAmPm,
};

