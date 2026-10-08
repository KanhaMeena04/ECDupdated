const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Ensure you have this
const { upload } = require('../utils/upload');
const {getMyRefunds} = require('../controllers/refundController');
const {
    getProfile,
    updateProfile,
    verifyProfileUpdateOTP,
    resendProfileUpdateOTP,
    changePassword,
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    addPaymentMethod,
    getPaymentMethods,
    deleteAccount,
    toggleFavoriteRestaurant,
    getFavoriteRestaurants,
    toggleFavoriteProduct,
    getFavoriteProducts,
    saveFCMToken,
    removeFCMToken,
    getNotificationStatus
} = require('../controllers/userController');

// User profile aliases
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.put('/update-profile', protect, upload.single('profilePic'), updateProfile);
router.post('/profile/verify-otp', protect, verifyProfileUpdateOTP);
router.post('/profile/resend-otp', protect, resendProfileUpdateOTP);
router.put('/change-password', protect, changePassword);

// Address aliases
router.get('/address', protect, getAddresses);
router.get('/addresses', protect, getAddresses);
router.post('/address', protect, addAddress);
router.post('/addresses', protect, addAddress);
router.put('/address/:id', protect, updateAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/address/:id', protect, deleteAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.patch('/address/set-default/:id', protect, setDefaultAddress);
router.patch('/addresses/set-default/:id', protect, setDefaultAddress);

router.get('/payment-methods', protect, getPaymentMethods);
router.post('/payment-method', protect, addPaymentMethod);
router.delete('/account', protect, deleteAccount);
router.delete('/delete-account', protect, deleteAccount);
router.get('/refunds', protect, getMyRefunds);
router.get('/favorites/restaurants', protect, getFavoriteRestaurants);
router.post('/favorites/restaurants/:id', protect, toggleFavoriteRestaurant);
router.get('/favorites/products', protect, getFavoriteProducts);
router.post('/favorites/products/:id', protect, toggleFavoriteProduct);
const Notification = require('../models/Notification');

router.post('/fcm-token', protect, saveFCMToken);
router.post('/device-token', protect, saveFCMToken);
router.post('/register-device', protect, saveFCMToken);
router.delete('/fcm-token', protect, removeFCMToken);
router.get('/notification-status', protect, getNotificationStatus);

// In-app notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/my-notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.patch('/notifications/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.patch('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.patch('/notifications/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.patch('/notifications/:id/read', protect, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.delete('/notifications/:id', protect, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

