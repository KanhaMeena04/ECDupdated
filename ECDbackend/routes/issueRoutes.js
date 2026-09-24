const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { reportIssue } = require('../controllers/supportController');

router.post('/report', protect, reportIssue);
router.post('/', protect, reportIssue);

module.exports = router;
