const express = require('express');
const router = express.Router();
const ReconciliationReport = require('../models/ReconciliationReport');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin: Get all reconciliation records
router.get('/', protect, admin, async (req, res) => {
  try {
    const records = await ReconciliationReport.find()
      .populate('orderId', 'orderId totalAmount paymentMethod paymentStatus status')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Resolve reconciliation record
router.patch('/:id/resolve', protect, admin, async (req, res) => {
  try {
    const record = await ReconciliationReport.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    record.status = 'RESOLVED';
    record.notes = req.body.notes || 'Manually resolved by admin';
    record.resolvedBy = req.user._id;
    await record.save();
    res.json({ success: true, message: 'Reconciliation record marked as resolved', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
