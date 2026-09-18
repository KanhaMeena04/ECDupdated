const express = require('express');
const router = express.Router();
const ServiceArea = require('../models/ServiceArea');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/App: Get active service areas
router.get('/active', async (req, res) => {
  try {
    const areas = await ServiceArea.find({ isServiceActive: true }).sort({ state: 1, city: 1, zone: 1 });
    res.json({ success: true, count: areas.length, areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all service areas
router.get('/', protect, admin, async (req, res) => {
  try {
    const areas = await ServiceArea.find().sort({ state: 1, city: 1, zone: 1 });
    res.json({ success: true, count: areas.length, areas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add service area
router.post('/', protect, admin, async (req, res) => {
  try {
    const area = new ServiceArea({ ...req.body, createdBy: req.user._id });
    await area.save();
    res.status(201).json({ success: true, message: 'Service area created successfully', area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Update service area
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    res.json({ success: true, message: 'Service area updated successfully', area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Toggle service area active switch
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const area = await ServiceArea.findById(req.params.id);
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    area.isServiceActive = !area.isServiceActive;
    await area.save();
    res.json({ success: true, message: `Service area ${area.isServiceActive ? 'activated' : 'deactivated'}`, area });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete service area
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ success: false, message: 'Service area not found' });
    res.json({ success: true, message: 'Service area deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
