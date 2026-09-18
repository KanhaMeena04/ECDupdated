const express = require('express');
const router = express.Router();
const EmergencyControl = require('../models/EmergencyControl');
const { protect, admin } = require('../middleware/authMiddleware');

// Get current emergency controls (Public/Auth view)
router.get('/', async (req, res) => {
  try {
    const controls = await EmergencyControl.getControls();
    res.json({ success: true, controls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update emergency controls (Admin only)
router.put('/', protect, admin, async (req, res) => {
  try {
    let controls = await EmergencyControl.findOne({});
    if (!controls) {
      controls = new EmergencyControl({ ...req.body, updatedBy: req.user._id });
    } else {
      Object.assign(controls, req.body);
      controls.updatedBy = req.user._id;
    }
    await controls.save();
    res.json({ success: true, message: 'Emergency controls updated successfully', controls });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
