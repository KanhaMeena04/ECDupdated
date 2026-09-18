const express = require('express');
const router = express.Router();
const ScheduledChange = require('../models/ScheduledChange');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin: Get all scheduled changes
router.get('/', protect, admin, async (req, res) => {
  try {
    const changes = await ScheduledChange.find().sort({ scheduledAt: -1 });
    res.json({ success: true, count: changes.length, changes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Schedule a new change
router.post('/', protect, admin, async (req, res) => {
  try {
    const change = new ScheduledChange({ ...req.body, createdBy: req.user._id });
    await change.save();
    res.status(201).json({ success: true, message: 'Change scheduled successfully', change });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Cancel a scheduled change
router.patch('/:id/cancel', protect, admin, async (req, res) => {
  try {
    const change = await ScheduledChange.findById(req.params.id);
    if (!change) return res.status(404).json({ success: false, message: 'Scheduled change not found' });
    change.status = 'CANCELLED';
    await change.save();
    res.json({ success: true, message: 'Scheduled change cancelled', change });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
