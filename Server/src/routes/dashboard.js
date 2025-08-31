const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getDashboard
} = require('../controllers/dashboardController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user dashboard
// @route   GET /api/dashboard
// @access  Private
router.get('/', getDashboard);

module.exports = router;
