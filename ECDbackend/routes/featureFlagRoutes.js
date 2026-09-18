const express = require('express');
const router = express.Router();
const FeatureFlag = require('../models/FeatureFlag');
const { protect, admin } = require('../middleware/authMiddleware');

// Get active feature flags (Public/App API)
router.get('/active', async (req, res) => {
  try {
    const flags = await FeatureFlag.find({ isEnabled: true });
    const flagMap = {};
    flags.forEach(f => {
      flagMap[f.key] = true;
    });
    res.json({ success: true, flags: flagMap });
  } catch (error) {
    res.json({
      success: true,
      flags: {
        NEW_HOME_UI: true,
        SELF_PICKUP: true,
        COD: true,
        RAIN_CHARGE: false,
        NEW_COUPON_ENGINE: true,
        WALLET: true,
        REFERRAL: true
      }
    });
  }
});

// Admin: Get all feature flags
router.get('/', protect, admin, async (req, res) => {
  try {
    const flags = await FeatureFlag.find().sort({ key: 1 });
    res.json({ success: true, count: flags.length, flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create feature flag
router.post('/', protect, admin, async (req, res) => {
  try {
    const flag = new FeatureFlag({ ...req.body, updatedBy: req.user._id });
    await flag.save();
    res.status(201).json({ success: true, message: 'Feature flag created successfully', flag });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Toggle feature flag
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });
    flag.isEnabled = !flag.isEnabled;
    flag.updatedBy = req.user._id;
    await flag.save();
    res.json({ success: true, message: `Feature flag ${flag.isEnabled ? 'enabled' : 'disabled'}`, flag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete feature flag
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const flag = await FeatureFlag.findByIdAndDelete(req.params.id);
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });
    res.json({ success: true, message: 'Feature flag deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
