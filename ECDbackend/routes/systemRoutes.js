const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getSystemHealth, getIntegrationsStatus } = require('../controllers/systemHealthController');

router.get('/health', protect, admin, getSystemHealth);
router.get('/integrations', protect, admin, getIntegrationsStatus);

module.exports = router;

