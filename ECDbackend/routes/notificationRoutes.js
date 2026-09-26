const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveFCMToken } = require('../controllers/userController');

router.post('/register-device', async (req, res) => {
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

module.exports = router;
