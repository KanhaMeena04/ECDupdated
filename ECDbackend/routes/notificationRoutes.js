const express = require('express');
const router = express.Router();
const { protect, optionalAuth, admin } = require('../middleware/authMiddleware');
const { saveFCMToken } = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const Notification = require('../models/Notification');

// Device Token Registration
router.post('/register-device', optionalAuth, async (req, res) => {
  try {
    const { fcmToken, token } = req.body;
    const targetToken = fcmToken || token;
    if (!targetToken) {
      return res.status(400).json({ success: false, message: 'Device token is required' });
    }
    if (req.user && req.user._id) {
      req.body.fcmToken = targetToken;
      return saveFCMToken(req, res);
    }
    return res.status(200).json({ success: true, message: 'Device token received' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

function buildNotificationQuery(req, userIds) {
  const appParam = (req.query.app || req.headers['x-app-type'] || '').toString().trim().toLowerCase();
  const baseQuery = { user: { $in: userIds } };
  if (appParam === 'customer' || appParam === 'user') {
    baseQuery.$or = [{ targetApp: { $in: ['customer', 'all'] } }, { targetApp: { $exists: false } }];
  } else if (appParam === 'restaurant' || appParam === 'partner' || appParam === 'vendor') {
    baseQuery.$or = [{ targetApp: { $in: ['restaurant', 'all'] } }, { targetApp: { $exists: false } }];
  } else if (appParam === 'rider' || appParam === 'driver') {
    baseQuery.$or = [{ targetApp: { $in: ['rider', 'all'] } }, { targetApp: { $exists: false } }];
  }
  return baseQuery;
}

async function resolveUserNotificationIds(req) {
  const appParam = (req.query.app || req.headers['x-app-type'] || '').toString().trim().toLowerCase();
  const userIds = [req.user._id];
  if (appParam !== 'customer' && appParam !== 'user' && appParam !== 'rider' && appParam !== 'driver') {
    try {
      const Restaurant = require('../models/Restaurant');
      const rest = await Restaurant.findOne({ owner: req.user._id }).select('_id');
      if (rest) userIds.push(rest._id);
    } catch (_) {}
  }
  return userIds;
}

// Get My Notifications
router.get('/', protect, async (req, res) => {
  try {
    const userIds = await resolveUserNotificationIds(req);
    const notifQuery = buildNotificationQuery(req, userIds);

    const notifications = await Notification.find(notifQuery)
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ ...notifQuery, isRead: false });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for get notifications
router.get('/my-notifications', protect, async (req, res) => {
  try {
    const userIds = await resolveUserNotificationIds(req);
    const notifQuery = buildNotificationQuery(req, userIds);

    const notifications = await Notification.find(notifQuery)
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ ...notifQuery, isRead: false });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Mark all as read
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    const userIds = await resolveUserNotificationIds(req);
    const notifQuery = buildNotificationQuery(req, userIds);

    await Notification.updateMany({ ...notifQuery, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/read-all', protect, async (req, res) => {
  try {
    const userIds = await resolveUserNotificationIds(req);
    const notifQuery = buildNotificationQuery(req, userIds);

    await Notification.updateMany({ ...notifQuery, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Custom Push Notification
router.post('/custom-push', protect, admin, adminController.sendCustomPush);

module.exports = router;
