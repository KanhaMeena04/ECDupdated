const express = require('express');
const { getPublicSettings } = require('../controllers/adminSettingsController');
const router = express.Router();
router.get('/', getPublicSettings);
module.exports = router;
