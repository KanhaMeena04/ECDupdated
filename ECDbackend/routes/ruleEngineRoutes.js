const express = require('express');
const router = express.Router();
const RuleEngine = require('../models/RuleEngine');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all rules
router.get('/', protect, admin, async (req, res) => {
  try {
    const rules = await RuleEngine.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, count: rules.length, rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create rule
router.post('/', protect, admin, async (req, res) => {
  try {
    const rule = new RuleEngine({ ...req.body, createdBy: req.user._id });
    await rule.save();
    res.status(201).json({ success: true, message: 'Rule created successfully', rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update rule
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const rule = await RuleEngine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule updated successfully', rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Toggle rule active status
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const rule = await RuleEngine.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ success: true, message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}`, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete rule
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const rule = await RuleEngine.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
